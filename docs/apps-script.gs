/**
 * Primeway enquiry form -> Google Sheet + email to the team.
 *
 * Setup (once):
 * 1. Create a Google Sheet. Rename the first tab to "Enquiries".
 * 2. In the sheet: Extensions > Apps Script. Paste this whole file. Save.
 * 3. Set TEAM_EMAIL below (the address that should get each enquiry).
 * 4. Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Authorise when asked. Copy the Web app URL.
 * 5. Put that URL in site.json as "form_endpoint". Build and push.
 * After you change this script, use Deploy > Manage deployments > Edit > New version.
 */
var TEAM_EMAIL = "info@primewayqatar.com"; // CONFIRM with the client
var SHEET_NAME = "Enquiries";
var COLUMNS = ["timestamp", "name", "phone", "email", "service", "message", "page_url", "user_agent",
               "company", "in_qatar", "contact_via"];

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website_url) return out_("ok"); // honeypot filled: a bot
  if (!p.name || !p.phone) return out_("missing");

  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActive().insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  var row = COLUMNS.map(function (c) {
    return c === "timestamp" ? new Date() : clean_(p[c]);
  });
  sheet.appendRow(row);

  var body = COLUMNS.slice(1).map(function (c) { return c + ": " + clean_(p[c]); }).join("\n");
  MailApp.sendEmail({
    to: TEAM_EMAIL,
    replyTo: p.email || TEAM_EMAIL,
    subject: "New enquiry: " + clean_(p.service) + " from " + clean_(p.name),
    body: body
  });
  return out_("ok");
}

// Stops spreadsheet formulas such as =IMPORTXML(...) from running if someone types them in.
function clean_(v) {
  v = String(v == null ? "" : v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function out_(s) { return ContentService.createTextOutput(s); }
