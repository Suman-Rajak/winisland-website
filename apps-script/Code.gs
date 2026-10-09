/**
 * Glyde waitlist: saves sign-ups from the website into this Google Sheet, then emails a
 * welcome to the person who signed up and a heads-up to you.
 *
 * Paste into Extensions → Apps Script of your sheet and deploy as a web app
 * (Execute as: Me, Who has access: Anyone). Setup steps: apps-script/README.md.
 *
 * The website POSTs form fields: email, source (which form), tz, lang, and "company",
 * a hidden field people never see. Bots fill it in, so anything with it is dropped.
 *
 * Welcome emails go out through Brevo (free: 300 a day) once its API key is set, and through
 * your Gmail before that or if Brevo fails (about 100 a day). Heads-ups to you always use
 * Gmail, so they don't use up Brevo's allowance.
 */

// ---- Settings ----------------------------------------------------------------------------

const SITE_URL = 'https://suman-rajak.github.io/winisland-website/'; // change to https://winisland.in once it's connected
const FROM_NAME = 'Glyde';
const FROM_EMAIL = 'hello@winisland.in'; // Brevo's sender, on a domain verified in Brevo (switch to the Glyde domain once you have it)
const REPLY_TO = '';                     // where replies to the welcome go; empty: your Gmail
const BREVO_LIST_ID = 0;                 // a Brevo contact list to add each sign-up to; 0: don't
const SEND_WELCOME = true;               // email each new sign-up a welcome
const NOTIFY_ME = true;                  // email you about each new sign-up

// The Brevo API key is NOT in this file, which is public on GitHub. It lives in this script's
// Project Settings → Script Properties, as BREVO_API_KEY.

// -------------------------------------------------------------------------------------------

const SHEET_NAME = 'Waitlist';
const HEADERS = ['Joined', 'Email', 'Form', 'Time zone', 'Language', 'Welcome email'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.company) return reply_({ ok: true }); // a bot: pretend it worked

  const email = String(p.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return reply_({ ok: false, error: 'invalid_email' });

  // One sign-up at a time, so two at once can't both pass the duplicate check.
  let sheet, row;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet = sheet_();
    const last = sheet.getLastRow();
    const emails = last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues().map(r => String(r[0]).toLowerCase()) : [];
    if (emails.includes(email)) return reply_({ ok: true, already: true }); // no second welcome
    sheet.appendRow([new Date(), cell_(email), cell_(p.source), cell_(p.tz), cell_(p.lang), '']);
    row = sheet.getLastRow();
  } finally {
    lock.releaseLock();
  }

  // Emails after the lock, so a slow send doesn't hold up other sign-ups. A failed email
  // never fails the sign-up: the row is saved, and the last column says what happened.
  const status = [SEND_WELCOME ? sendWelcome_(email) : 'off'];
  if (BREVO_LIST_ID && brevoKey_()) status.push(addToList_(email));
  sheet.getRange(row, HEADERS.length).setValue(status.join(' · '));
  if (NOTIFY_ME) notifyMe_(email, p, row - 1);

  return reply_({ ok: true, emailed: status[0].startsWith('sent') });
}

// Opening the web app's URL in a browser shows this, which is handy to check it's deployed.
function doGet() {
  return reply_({ ok: true, service: 'Glyde waitlist' });
}

// Run this from the editor (pick testEmail, click Run): the first time it asks for permission
// to send email and reach Brevo; then it sends you the welcome email, through Brevo if the key
// is set. The log (View → Logs, or the panel below) says how it went.
function testEmail() {
  console.log('Welcome email: ' + sendWelcome_(owner_()));
}

// ---- Emails --------------------------------------------------------------------------------

// Brevo first (when its key is set), Gmail otherwise or if Brevo fails. Returns what happened.
function sendWelcome_(to) {
  const message = welcome_();
  let brevoError = '';
  if (brevoKey_()) {
    try {
      brevo_('/smtp/email', {
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        replyTo: { email: REPLY_TO || owner_() },
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
        tags: ['waitlist-welcome'],
      });
      return 'sent via Brevo';
    } catch (err) {
      console.error(err);
      brevoError = ' (Brevo failed: ' + short_(err) + ')';
    }
  }
  if (MailApp.getRemainingDailyQuota() < 1) return 'skipped: daily email limit' + brevoError;
  try {
    MailApp.sendEmail({
      to: to,
      name: FROM_NAME,
      replyTo: REPLY_TO || undefined,
      subject: message.subject,
      body: message.text,
      htmlBody: message.html,
    });
    return 'sent via Gmail' + brevoError;
  } catch (err) {
    console.error(err);
    return 'failed: ' + short_(err) + brevoError;
  }
}

// Puts the sign-up on your Brevo list, so the launch email can go out as a Brevo campaign
// (with Brevo's own unsubscribe link).
function addToList_(email) {
  try {
    brevo_('/contacts', { email: email, listIds: [BREVO_LIST_ID], updateEnabled: true });
    return 'on Brevo list';
  } catch (err) {
    console.error(err);
    return 'Brevo list failed: ' + short_(err);
  }
}

function notifyMe_(email, p, total) {
  if (MailApp.getRemainingDailyQuota() < 1) return;
  try {
    MailApp.sendEmail({
      to: owner_(),
      name: FROM_NAME + ' waitlist',
      subject: 'New sign-up #' + total + ': ' + email,
      body: [
        email + ' joined the Glyde waitlist.',
        '',
        'Form: ' + (p.source || '-'),
        'Time zone: ' + (p.tz || '-'),
        'Language: ' + (p.lang || '-'),
        'Total sign-ups: ' + total,
        '',
        SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join('\n'),
    });
  } catch (err) {
    console.error(err);
  }
}

function welcome_() {
  const site = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const text = [
    'Hi there,',
    '',
    'Thanks for joining the Glyde waitlist. Glyde is a voice island for Windows: music, timers, messages, ' +
      'earbuds and your clipboard at the top of your screen, right where you glance. And it answers to "Hey Glyde".',
    '',
    "We'll send you one email the day it launches, with the early-bird price on Pro.",
    '',
    'Suman',
    'Founder, Glyde',
    SITE_URL,
    '',
    '--',
    "You're getting this because this address joined the waitlist at " + site +
      '. Not you, or changed your mind? Reply "remove" and you\'ll be taken off the list.',
  ].join('\n');

  const font = "font-family:'Segoe UI',Inter,Arial,sans-serif;";
  const p = 'margin:0 0 16px;font-size:15px;line-height:1.65;color:#474d6a;';
  const html =
    '<div style="background:#f4efff;padding:36px 16px;' + font + '">' +
      '<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:22px;padding:34px 30px;border:1px solid #efe6d2;">' +
        '<div style="text-align:center;margin-bottom:26px;">' +
          '<div style="display:inline-block;width:34px;height:9px;border:2px solid #f2b544;border-radius:50%;margin-bottom:5px;"></div><br>' +
          '<div style="display:inline-block;width:64px;height:24px;border-radius:12px;background:#14162b;"></div>' +
        '</div>' +
        '<h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#0d1024;text-align:center;">You\'re on the list ✨</h1>' +
        '<p style="' + p + '">Thanks for joining the Glyde waitlist. Glyde is a voice island for Windows: music, timers, messages, ' +
          'earbuds and your clipboard at the top of your screen, right where you glance. And it answers to “Hey Glyde”.</p>' +
        '<p style="' + p + '">We\'ll send you <b style="color:#0d1024;">one email the day it launches</b>, with the early-bird price on Pro.</p>' +
        '<p style="margin:28px 0;text-align:center;">' +
          '<a href="' + SITE_URL + '" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#14162b;color:#ffffff;' +
            'font-size:15px;font-weight:600;text-decoration:none;">See what\'s coming</a></p>' +
        '<p style="margin:0;font-size:15px;line-height:1.5;color:#0d1024;">Suman<br>' +
          '<span style="color:#7b8199;font-size:13px;">Founder, Glyde</span></p>' +
      '</div>' +
      '<p style="max-width:520px;margin:18px auto 0;font-size:12px;line-height:1.5;color:#7b8199;text-align:center;">' +
        'You\'re getting this because this address joined the waitlist at <a href="' + SITE_URL + '" style="color:#7b8199;">' +
        site + '</a>. Not you, or changed your mind? Reply “remove”.</p>' +
    '</div>';

  return { subject: "You're on the Glyde waitlist ✨", text: text, html: html };
}

// ---- Brevo ---------------------------------------------------------------------------------

function brevoKey_() {
  return PropertiesService.getScriptProperties().getProperty('BREVO_API_KEY') || '';
}

function brevo_(path, payload) {
  const response = UrlFetchApp.fetch('https://api.brevo.com/v3' + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': brevoKey_(), accept: 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code >= 300) throw new Error('HTTP ' + code + ' ' + response.getContentText().slice(0, 140));
}

// ---- Helpers -------------------------------------------------------------------------------

function owner_() {
  return Session.getEffectiveUser().getEmail();
}

function short_(err) {
  return String((err && err.message) || err).slice(0, 90);
}

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Short, and never a formula: a value starting with = + - @ would otherwise run in the sheet.
function cell_(value) {
  const text = String(value || '').slice(0, 120);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function reply_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
