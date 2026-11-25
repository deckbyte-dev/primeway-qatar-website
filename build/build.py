"""
build.py: static site build for primewayqatar.com

Run from the project root:
    uv run build/build.py

Renders every page in content/pages/ into dist/<url>/index.html.

Templates use two tiny mechanisms (same as noufal-me):
  {{ include:_header.html }}   inlines a partial from templates/
  {{ key }}                    plain string substitution

Dev build:        uv run build/build.py
Production build: uv run build/build.py --production
  (fails if any [CONFIRM: ...] marker is left)
"""

import html
import json
import re
import shutil
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
CONTENT_PAGES = ROOT / "content" / "pages"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DIST = ROOT / "dist"
SITE_JSON = ROOT / "site.json"

INCLUDE_PATTERN = re.compile(r"\{\{\s*include:([\w.\-]+)\s*\}\}")
CONFIRM_PATTERN = re.compile(r"\[CONFIRM:[^\]]*\]")

# pages that use their own template instead of page.html
TEMPLATE_BY_URL = {"/": "home.html"}


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    """Split a markdown file into (front matter dict, body).
    Front matter is the simple `key: value` block between --- lines,
    with `- item` lines under a key becoming a list."""

    parts = raw.split("---", 2)
    if len(parts) < 3:
        return {}, raw

    fm_raw, body = parts[1], parts[2]
    meta: dict = {}
    current_list_key = None

    for line in fm_raw.strip().splitlines():
        if line.strip().startswith("- ") and current_list_key:
            item = line.strip()[2:].strip().strip('"').strip("'")
            meta.setdefault(current_list_key, []).append(item)
            continue

        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if value == "":
                current_list_key = key
                meta[key] = []
            else:
                current_list_key = None
                meta[key] = value

    return meta, body.strip()


def render_includes(text: str) -> str:
    """Replace {{ include:_name.html }} with that file from templates/."""

    def replace(match: re.Match) -> str:
        return (TEMPLATES / match.group(1)).read_text(encoding="utf-8")

    # Run until nothing is left, so a partial can include another partial.
    for _ in range(5):
        new = INCLUDE_PATTERN.sub(replace, text)
        if new == text:
            break
        text = new
    return text


def render_vars(text: str, context: dict) -> str:
    for key, value in context.items():
        text = text.replace("{{ " + key + " }}", str(value))
    return text


def clean_dist() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)


def copy_static() -> None:
    shutil.copytree(STATIC, DIST / "static")


def fill_placeholders(body: str, site: dict, production: bool) -> str:
    """[PHONE] etc. come from site.json. [CONFIRM: ...] is highlighted in
    a dev build and removed in a production build."""
    for token, key in (
        ("[PHONE]", "phone"),
        ("[WHATSAPP]", "whatsapp"),
        ("[EMAIL]", "email"),
        ("[ADDRESS]", "address"),
    ):
        if site.get(key):
            body = body.replace(token, site[key])

    if production:
        return CONFIRM_PATTERN.sub("", body)
    return CONFIRM_PATTERN.sub(
        lambda m: f'<mark class="confirm">{html.escape(m.group(0))}</mark>', body
    )


def whatsapp_url(site: dict) -> str:
    """wa.me link from the number in site.json. Falls back to the contact
    page until the number is filled in."""
    digits = re.sub(r"\D", "", site.get("whatsapp", ""))
    return f"https://wa.me/{digits}" if digits else "/contact/"


def build_page(page: dict, site: dict, production: bool) -> None:
    body = fill_placeholders(page["body"], site, production)
    content_html = markdown.markdown(body, extensions=["tables", "toc"])

    # Enquiry form (CTA-A): ends every page unless the page says cta: none.
    wants_cta = not page["meta"].get("cta", "").startswith("none")
    cta_block = render_includes("{{ include:_enquiry-cta.html }}") if wants_cta else ""
    if "[CONTACT_FORM]" in content_html:
        long_form = render_includes("{{ include:_enquiry-form.html }}").replace(
            "{{ form_extra }}", (TEMPLATES / "_form-extra-contact.html").read_text(encoding="utf-8")
        ).replace("{{ form_endpoint }}", site.get("form_endpoint", ""))
        content_html = content_html.replace("<p>[CONTACT_FORM]</p>", f'<div class="form-page">{long_form}</div>')

    template_name = TEMPLATE_BY_URL.get(page["url"], "page.html")
    template = (TEMPLATES / template_name).read_text(encoding="utf-8")
    out = render_includes(template)
    out = out.replace("{{ cta_block }}", cta_block)
    out = out.replace("{{ form_extra }}", "")
    out = render_vars(
        out,
        {
            "form_endpoint": site.get("form_endpoint", ""),
            "title": html.escape(page["title"]),
            "description": html.escape(page["description"]),
            "canonical": site["domain"] + page["url"],
            "robots": page["meta"].get("robots", "index, follow"),
            "h1": html.escape(page["h1"]),
            "legal_name": site["legal_name"],
            "whatsapp_url": whatsapp_url(site),
            "content": content_html,
        },
    )

    out_dir = DIST / page["url"].strip("/")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(out, encoding="utf-8")


def load_site() -> dict:
    return json.loads(SITE_JSON.read_text(encoding="utf-8"))


def load_pages() -> list[dict]:
    pages = []
    for md_file in sorted(CONTENT_PAGES.glob("*.md")):
        raw = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        pages.append(
            {
                "file": md_file.name,
                "url": meta.get("url", ""),
                "title": meta.get("title", ""),
                "description": meta.get("meta_description", ""),
                "h1": meta.get("h1", ""),
                "meta": meta,
                "body": body,
            }
        )
    return pages


def check_pages(pages: list[dict]) -> None:
    """Print a warning for anything that would hurt SEO."""
    seen_urls, seen_titles, seen_descs = set(), set(), set()
    problems = 0

    for p in pages:
        name = p["file"]
        for field in ("url", "title", "description", "h1"):
            if not p[field]:
                print(f"  ! {name}: missing {field}")
                problems += 1
        if len(p["title"]) > 62:
            print(f"  ! {name}: title is {len(p['title'])} characters (max 62)")
            problems += 1
        if len(p["description"]) > 160:
            print(
                f"  ! {name}: description is {len(p['description'])} characters (max 160)"
            )
            problems += 1
        if p["url"] in seen_urls:
            print(f"  ! {name}: duplicate url {p['url']}")
            problems += 1
        if p["title"] in seen_titles:
            print(f"  ! {name}: duplicate title")
            problems += 1
        if p["description"] in seen_descs:
            print(f"  ! {name}: duplicate description")
            problems += 1
        seen_urls.add(p["url"])
        seen_titles.add(p["title"])
        seen_descs.add(p["description"])

    confirms = sum(len(re.findall(r"\[CONFIRM", p["body"])) for p in pages)
    print(
        f"\n{len(pages)} pages, {problems} problems, {confirms} [CONFIRM] markers left"
    )


def main() -> None:
    production = "--production" in sys.argv
    site = load_site()
    pages = load_pages()

    check_pages(pages)

    if production and any(CONFIRM_PATTERN.search(p["body"]) for p in pages):
        sys.exit(
            "Production build stopped: [CONFIRM] markers are still in the content."
        )

    clean_dist()
    copy_static()
    for p in pages:
        build_page(p, site, production)

    if production:
        for html_file in DIST.rglob("*.html"):
            if "[CONFIRM" in html_file.read_text(encoding="utf-8"):
                sys.exit(f"Production build stopped: [CONFIRM] found in {html_file}")

    print(f"Build complete: {DIST} ({len(pages)} pages)")


if __name__ == "__main__":
    main()
