# Hero v1 (backup, kept so we can return to it)

Restore by putting these back.

## templates/home.html

```html
  <!-- HERO -->
  <section class="hero">
    <div class="wrap">
      <h1>{{ h1 }}</h1>
      <div class="hero-row">
        <p class="hero-sub">Starting a company in Qatar means ministries, forms, stamps and waiting. We do that part. You get your licence, your cards and a clear idea of what comes next.</p>
        <!-- TODO: small line under buttons, "Reply within one working day", once the client confirms the reply time -->
        <div class="hero-buttons">
          <a class="btn" href="/contact/">Free consultation</a>
          <a class="btn btn-line" href="{{ whatsapp_url }}">Chat on WhatsApp</a>
        </div>
      </div>
    </div>
    <div class="hero-photo">
      <div class="img-wrap" data-parallax>
        <img src="/static/img/doha/panorama-calm-1920.webp" srcset="/static/img/doha/panorama-calm-960.webp 960w, /static/img/doha/panorama-calm-1920.webp 1920w" sizes="100vw" alt="The Doha skyline across the bay" fetchpriority="high" decoding="async">
      </div>
    </div>
  </section>

```

## static/css/main.css (hero block)

```css
/* ===== Hero (light) ===== */
.hero{padding-top:calc(var(--header-h) + clamp(48px,9vh,110px))}
.hero h1{font-size:clamp(36px,5.6vw,84px);max-width:15em;font-weight:400;letter-spacing:-.045em;line-height:1.02}
.hero h1 .wm{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em}
.hero h1 .w{display:inline-block}
.js .hero h1 .w{transform:translateY(105%);animation:wordUp 1s var(--ease) forwards;animation-delay:calc(.08s*var(--i) + .15s)}
@keyframes wordUp{to{transform:none}}
.hero-row{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;margin-top:clamp(28px,4vw,52px)}
.hero-sub{max-width:34em;font-size:clamp(16px,1.3vw,19px);color:var(--muted);margin:0}
.hero-buttons{display:flex;flex-wrap:wrap;gap:12px}
.hero-photo{margin-top:clamp(36px,6vw,80px);padding:0 var(--pad)}
.hero-photo .img-wrap{height:clamp(300px,62vh,640px);border-radius:4px}

/* ===== Home sections (below the hero) ===== */
:root{interpolate-size:allow-keywords;--gradient-d:linear-gradient(125deg,#04a595 0%,#055882 62%,#023144 100%)}
.home main{counter-reset:sec}
.sec{padding:clamp(80px,11vw,160px) 0}

/* eyebrow label with section counter */
.eyebrow{display:flex;align-items:center;gap:14px;margin:0 0 clamp(18px,2.6vw,32px);font-family:var(--font-body);font-weight:500;font-size:12.5px;line-height:1;letter-spacing:.16em;text-transform:uppercase;color:var(--ocean)}
.eyebrow::before{counter-increment:sec;content:counter(sec,decimal-leading-zero);color:var(--teal);font-variant-numeric:tabular-nums}
.eyebrow::after{content:"";width:48px;height:1px;background:currentColor;opacity:.35}
.route .eyebrow,.final .eyebrow{color:rgba(255,255,255,.7)}
.route .eyebrow::before{color:var(--teal-light)}
.display,.display-s,.statement{text-wrap:balance}
.display{font-size:clamp(40px,7vw,112px);letter-spacing:-.05em;line-height:.98;font-weight:300}
.display-s{font-size:clamp(30px,4.4vw,68px);letter-spacing:-.045em;line-height:1.04;font-weight:300}

/* split headline: words rise out of a mask when they enter */
.split .wm{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .12em;margin:0 -.04em -.12em}
.split .w{display:inline-block}
.js .split .w{transform:translateY(112%);transition:transform 1.1s var(--ease);transition-delay:calc(var(--i)*55ms)}
.js .split.in .w{transform:none}

/* pill button with an arrow disc that floods on hover */
.btn-pill{--pb:var(--navy);--pf:#fff;--pd:var(--teal);position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;gap:18px;padding:7px 7px 7px 26px;border-radius:999px;background:var(--pb);color:var(--pf);font-weight:500;font-size:15.5px;line-height:1.2;text-decoration:none;transition:color .45s var(--ease)}
.btn-pill::before{content:"";position:absolute;z-index:-1;right:7px;top:50%;width:46px;height:46px;margin-top:-23px;border-radius:50%;background:var(--pd);transition:transform .7s var(--ease)}
.btn-pill i{flex:none;width:46px;height:46px;display:grid;place-items:center;transition:transform .5s var(--ease)}
.btn-pill:hover{color:var(--night)}
.btn-pill:hover::before{transform:scale(9)}
.btn-pill:hover i{transform:translateX(3px)}
.btn-pill.is-light{--pb:#fff;--pf:var(--navy);--pd:var(--teal)}
.btn-pill.is-light:hover{color:var(--night)}

```

## static/js/main.js (hero headline words)

```js
  /* Hero headline: words rise out of a mask */
  var h1 = doc.querySelector(".hero h1");
  if (h1 && !reduce) {
    var text = h1.textContent.trim();
    h1.setAttribute("aria-label", text);
    h1.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="wm" aria-hidden="true"><span class="w" style="--i:' + i + '">' + w + "</span></span>";
    }).join(" ");
  }

```
