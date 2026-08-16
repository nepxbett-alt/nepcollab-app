# NepCollab magic-link authentication

## Root cause of "We couldn't send the login link"

Direct calls to Supabase Auth return:

```
HTTP 500
error_code: unexpected_failure
msg: Error sending confirmation email
```

So `signInWithOtp()` is fine; **Supabase cannot send the email**.

Common fixes (Dashboard → Project `ntnbhnazqncszasmwjyw`):

1. **Authentication → Emails / SMTP**
   - If **Custom SMTP** is enabled with bad credentials, **disable it** so the built-in provider is used.
   - Confirm the default email provider is enabled (no empty SMTP host).

2. **Authentication → URL configuration**
   - Site URL: `https://nepcollab.vercel.app`
   - Redirect URLs must include:
     - `https://nepcollab.vercel.app/auth/callback`
     - `https://nepcollab-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (local)

3. **Rate limits** — free mailer is limited; wait and retry.

4. **Auth → Providers → Email** — enabled (already true on this project).

`admin/generate_link` works (auth DB OK). Only the **mailer** fails.

## App behavior after fix

- Login uses `signInWithOtp` with `emailRedirectTo = origin/auth/callback`
- Callback exchanges PKCE `code` via `exchangeCodeForSession`
- Optional 6-digit email code via `verifyOtp`
