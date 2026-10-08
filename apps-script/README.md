# Waitlist → Google Sheet + welcome emails

Every email entered in the website's waitlist forms lands as a new row in a Google Sheet you own:
when they joined, the email, which form (hero or the one at the bottom), their time zone and language.
Repeat sign-ups are ignored, and bots are filtered out with a hidden field.

Each new sign-up also triggers two emails:
- **a welcome email to them** ("You're on the list ✨"), signed by you, with a link to the site. It's sent through **Brevo** (free: 300 a day) once you've set it up (part 2), and through **your Gmail** until then, or whenever Brevo fails (about 100 a day).
- **a heads-up to you**: who signed up, from which form, and the running total. Always through Gmail, so it doesn't use Brevo's allowance.

The sheet's last column says what happened, e.g. `sent via Brevo · on Brevo list`, `sent via Gmail`, or `sent via Gmail (Brevo failed: …)`.

## Part 1: the sheet and the script (about 5 minutes)

This works on its own, with welcome emails from your Gmail.

1. **Create the sheet.** Go to [sheets.new](https://sheets.new) and name it, for example, *WinIsland waitlist*.
2. **Add the script.** In the sheet: **Extensions → Apps Script**. Delete what's in `Code.gs`, paste in everything from [`Code.gs`](Code.gs) in this folder, and click **Save** (the disk icon).
3. **Allow it and preview the welcome.** At the top of the editor, pick **testEmail** in the function list and click **Run**. Google asks for permission (to manage the sheet, send email as you, and connect to Brevo): **Review permissions**, choose your account, then **Advanced → Go to … (unsafe) → Allow**. The script is your own, which is why Google calls it unverified. The welcome email arrives in your inbox.
4. **Deploy it.** Click **Deploy → New deployment**. Next to "Select type", click the gear and pick **Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**.
5. **Connect the website.** Copy the **Web app URL** (it ends in `/exec`), paste it into the website's `config.js` as `waitlistUrl: 'https://script.google.com/macros/s/…/exec'`, then commit and push.

**Check it:** open the `/exec` URL in your browser; it should show `{"ok":true,"service":"WinIsland waitlist"}`. Then sign up on the site with an email you can read: a **Waitlist** tab appears in the sheet with the row, the welcome arrives, and you get the heads-up.

## Part 2: Brevo (about 15 minutes, plus waiting for DNS)

Brevo sends the welcomes from **hello@winisland.in** instead of your Gmail, 300 a day for free. Do this once `winisland.in` has finished registering. Brevo's menu names change now and then; look for the closest match.

1. **Create a free account** at [brevo.com](https://www.brevo.com).
2. **Verify your domain.** In Brevo: **Settings → Senders, domains & dedicated IPs → Domains → Add a domain**, enter `winisland.in`, and choose to authenticate it yourself. Brevo shows a few DNS records: a Brevo code, DKIM and DMARC.
   - In Wix: **Domains → ⋯ next to winisland.in → Manage DNS records**, and add each record exactly as Brevo shows it.
   - Back in Brevo, click **Authenticate**. DNS can take from minutes to a day to show up.

   This is what keeps the welcome emails out of spam.
3. **Add the sender.** In **Senders**, add **WinIsland**, `hello@winisland.in`. With the domain verified this is usually accepted straight away. If Brevo insists on emailing a code to that address, you'll need a mailbox for it first; Zoho Mail's free plan works with Wix domains.
4. **Create an API key.** **Settings → SMTP & API → API keys → Generate a new API key**. Copy it (it starts with `xkeysib-`).
5. **Give the key to the script, privately.** In Apps Script: **Project Settings** (the gear on the left) **→ Script Properties → Add script property**: name `BREVO_API_KEY`, value the key. **Save**.

   **Never paste the key into `Code.gs` or `config.js`.** Both are public on GitHub, and anyone could use it to send email as you.
6. **Test it.** Run **testEmail** again (allow the new permission if asked). The log at the bottom should say `Welcome email: sent via Brevo`. If it says `sent via Gmail (Brevo failed: …)`, the message after "failed" tells you what Brevo didn't like; usually it's the sender or the domain not being verified yet.
7. **Publish the change.** **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The URL stays the same.

### Optional: a Brevo list for the launch email

If every sign-up also goes onto a Brevo contact list, the launch email can be a Brevo campaign, with a proper unsubscribe link handled for you.

1. In Brevo: **Contacts → Lists → Create a list**, e.g. *WinIsland waitlist*, and note its **ID** (a number, shown in the list of lists).
2. In `Code.gs`, set `const BREVO_LIST_ID = <that number>;`, save, and publish a new version (step 7 above).
3. People who signed up earlier aren't on it yet: download the sheet as CSV (**File → Download → CSV**) and import it in **Contacts → Import contacts** into the same list.

A campaign to more than 300 people goes out over several days on the free plan: Brevo sends 300 a day, and you use **Requeue** to continue the next day.

## Settings at the top of `Code.gs`

| Setting | |
|---|---|
| `SITE_URL` | The link in the welcome email. Change it to `https://winisland.in` once the domain points at the site. |
| `FROM_NAME` | The sender name people see. |
| `FROM_EMAIL` | Brevo's sender address. It must be on your verified domain. |
| `REPLY_TO` | Where replies to the welcome go. Empty: your Gmail. |
| `BREVO_LIST_ID` | The Brevo list each sign-up joins. `0`: none. |
| `SEND_WELCOME` | `false` to stop welcome emails. |
| `NOTIFY_ME` | `false` to stop the heads-ups to you. |

The welcome's wording is in `welcome_()`: a plain-text version and a designed one. Keep the two in step.

After any change: save, then **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.

## Limits

- **Brevo free:** 300 emails a day, shared by welcomes and campaigns.
- **Gmail:** about 100 recipients a day from scripts, used by your heads-ups and by welcomes when Brevo isn't set up or fails. On a big day, set `NOTIFY_ME = false`.
- Past a limit, sign-ups are still saved; only the email is skipped, and the sheet says so.

## Privacy

Only the fields above are stored, plus the email in Brevo if you use a list. The welcome tells people to reply "remove" to leave the list: when someone does, delete their row (and their Brevo contact).
