/**
 * Amber for HGSE: form backend (Google Apps Script)
 *
 * Runs inside a Google Sheet you own. Every submission from the website
 * becomes one row in a sheet called "Responses". The results dashboard on the
 * website reads those rows back, but only with the passcode you set.
 *
 * SETUP (about 5 minutes, see README.md for screenshots-free steps):
 *   1. Create a new Google Sheet.
 *   2. Extensions -> Apps Script. Delete the sample code, paste this whole file.
 *   3. Set your passcode: Project Settings (gear icon) -> Script Properties ->
 *      Add property: name ADMIN_KEY, value = a passcode only you know.
 *      (Alternative: edit setAdminKey() below, run it once, then delete it.)
 *   4. Deploy -> New deployment -> type "Web app".
 *        Execute as: Me.   Who has access: Anyone.   Click Deploy, authorize.
 *   5. Copy the Web app URL and paste it into config.js on the website.
 *   Any time you change this code: Deploy -> Manage deployments -> Edit -> New version.
 */

var SHEET_NAME = "Responses";
var HEADERS = ["Timestamp", "Topic", "Message", "Program", "Name", "Email", "Wants follow-up", "Page"];

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return respond({ ok: false, error: "Bad request" }); }
  var action = body.action || "submit";
  try {
    if (action === "submit") return respond(submit_(body));
    if (action === "list")   return respond(list_(body));
    return respond({ ok: false, error: "Unknown action" });
  } catch (err) {
    return respond({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return respond({ ok: true, service: "amber-for-hgse", time: new Date().toISOString() });
}

function submit_(b) {
  var message = clip_(b.message, 4000);
  if (!message) return { ok: false, error: "Message is required" };
  if (b.website) return { ok: true };            // honeypot filled: silently drop bots
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var email = clip_(b.email, 160);
    sheet_().appendRow([
      new Date(),
      clip_(b.category, 80),
      message,
      clip_(b.program, 80),
      clip_(b.name, 120),
      email,
      email ? "yes" : "no",
      clip_(b.page, 300)
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function list_(b) {
  var key = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!key) return { ok: false, error: "ADMIN_KEY is not set in Script Properties yet." };
  if (!b.key || String(b.key) !== key) return { ok: false, error: "Wrong passcode." };
  var values = sheet_().getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[2]) continue;
    rows.push({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      category: r[1], message: r[2], program: r[3], name: r[4], email: r[5]
    });
  }
  return { ok: true, rows: rows };
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function clip_(v, n) {
  return String(v == null ? "" : v).trim().slice(0, n);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Optional helper: edit the passcode below, run this once from the editor, then delete this function. */
function setAdminKey() {
  PropertiesService.getScriptProperties().setProperty("ADMIN_KEY", "change-this-passcode");
}
