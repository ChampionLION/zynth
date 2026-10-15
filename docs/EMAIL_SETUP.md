# Free SMTP for Zynth without a custom domain

Checked 15 October 2026. The app's production address is https://zynth-skillforge.vercel.app.

Use an existing free Gmail account and a Google App Password for an initial, low-volume setup. This uses Google's SMTP server, so there is no mail server to install or host. Prefer an account you control for the project because recipients will see that Gmail sender address. A Vercel address is a website address; it does not give you a mailbox or an address such as `noreply@zynth-skillforge.vercel.app`.

## 1. Prepare Gmail

1. Sign into the Google account that will send Zynth's account emails.
2. Enable [2-Step Verification](https://myaccount.google.com/security).
3. Open [App Passwords](https://myaccount.google.com/apppasswords), enter `Zynth Supabase` as the app name, and create a password.
4. Keep the generated password private. Enter it directly into Supabase; do not put it in GitHub, Vercel public variables, or chat. Use the app password rather than your normal Gmail password.

App Passwords require 2-Step Verification. Some managed, Advanced Protection, or security-key-only accounts do not offer them. [Google's instructions](https://support.google.com/accounts/answer/185833).

## 2. Configure Supabase

Open the Zynth project's [email/SMTP settings](https://supabase.com/dashboard/project/khvzjbhmozvpwidaxbah/auth/smtp), enable custom SMTP, and enter:

```
Sender email:  the full Gmail address you chose
Sender name:   Zynth
Host:          smtp.gmail.com
Port:          587
Username:      the same full Gmail address
Password:      the Google App Password, without formatting spaces
```

If the form offers an encryption setting, use STARTTLS/TLS for port 587. Save the settings. Supabase sends these emails directly; SMTP credentials do not belong in the app or Vercel. Keep email confirmations enabled. Supabase's default email templates can remain in place.

Sources: [Google SMTP settings](https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app), [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Update the website URLs

In [Supabase URL Configuration](https://supabase.com/dashboard/project/khvzjbhmozvpwidaxbah/auth/url-configuration), replace the deleted project's production URL with:

```
Site URL:
https://zynth-skillforge.vercel.app

Redirect URLs:
https://zynth-skillforge.vercel.app/auth/callback
https://zynth-skillforge.vercel.app/auth/reset-password
```

The new Vercel project uses the same Supabase project, so existing cloud accounts and progress remain there. Request fresh confirmation/reset emails after changing the URL configuration; old email links can still point at the deleted site.

## 4. Test the account flow

1. Open the live site and create an account using an inbox you can access.
2. Open the new confirmation email in the browser where you signed up, then complete onboarding.
3. Sign out and sign back in. Your saved profile should return without repeating onboarding.
4. Try Forgot password and confirm the new email returns to the live reset-password page.

If no email arrives, check spam and Supabase's Authentication logs. An authentication/535 error usually means the SMTP username or App Password is wrong. A delivery/rate-limit error may be from Google or Supabase; do not repeatedly request links while a limit is active.

## Limits and future growth

Gmail is a free starter setup, not a dedicated transactional-email service. Google's consumer Gmail guidance warns about limits above 500 emails per day, and spam/abuse controls can stop delivery sooner. This is not a guaranteed application allowance. Supabase imposes separate authentication email limits; its custom SMTP guide currently notes an initial 30 emails per hour. Start within those limits. [Gmail limits](https://support.google.com/mail/answer/22839), [Supabase SMTP limits](https://supabase.com/docs/guides/auth/auth-smtp).

When you own a domain, Brevo is an alternative with 300 free emails per day and SMTP access. Authenticate a domain you control before using it for Zynth's public email. [Brevo free plan](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans), [domain requirements](https://help.brevo.com/hc/en-us/articles/35852083084178-Domain-setup-for-better-email-deliverability).

This guide does not configure Gmail credentials or send email. SMTP delivery and the new auth redirects must be verified after those settings are saved in Supabase.
