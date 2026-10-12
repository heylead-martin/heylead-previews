# Roster account setup

## Current status

The frontend integration is implemented on `service-areas-1253`. No Supabase project, Google OAuth client or email sender has been configured. `accounts.json` is deliberately empty. Account forms show a connection-pending message and cannot submit until configuration is supplied. Guest saved companies work now. This branch has not been published.

The integration covers email/password sign-up and sign-in, verification email resend, password recovery, Google OAuth, sign-out, account navigation and a dedicated Saved page. Guest bookmarks can be explicitly imported into a signed-in account. Quote requests and listing claims remain previews.

## Cost

As checked on 12 October 2026, Supabase Free costs US$0/month and includes social OAuth, 50,000 monthly active users and a 500 MB database. Free projects can pause after one week of inactivity. Pro starts at US$25/month and includes daily database backups. Start with Free for this preview. No plan has been purchased. See [Supabase pricing](https://supabase.com/pricing).

Verification and reset emails need a configured email sender. Its cost depends on the chosen provider. Supabase's default sender is for testing, currently limited to project-team email addresses and two messages per hour. See [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Connect the project

1. Create a Supabase project on the Free plan in the owner's account. Keep the database password outside this public repository.
2. Apply `supabase/migrations/202610120001_saved_companies.sql` once through Supabase's SQL editor or normal migration tooling. It creates the saved-company table and its private row policies. Do not disable RLS to work around errors.
3. Copy the project URL and **publishable** key into `roster/accounts.json`. A legacy `anon` key is also accepted. These are public browser configuration. Never use a secret key, service-role key, database password or Google client secret here.

```json
{
  "url": "https://YOUR_PROJECT_REF.supabase.co",
  "publishableKey": "YOUR_PUBLIC_PUBLISHABLE_KEY",
  "googleEnabled": false
}
```

The build rejects incomplete configuration and secret/service-role key types. RLS provides access control; a public key alone does not authorize reading other accounts' saved companies.

## Email and redirect settings

In Supabase Auth:

- Enable email/password sign-in and email confirmation. Set the minimum password length to 12 characters to match the forms.
- Set Site URL to `https://previews.heylead.com/roster/`.
- Allow these exact redirect URLs:
  - `https://previews.heylead.com/roster/auth/callback/`
  - `https://previews.heylead.com/roster/reset-password/`
  - `http://127.0.0.1:8881/roster/auth/callback/`
  - `http://127.0.0.1:8881/roster/reset-password/`
- Add an exact localhost callback/reset pair only if testing with a different hostname or port. Avoid broad production wildcards.
- Keep confirmation and recovery email templates using Supabase's `{{ .ConfirmationURL }}`. The client passes the appropriate redirect URL for each flow.
- Configure an SMTP sender and its verified sending domain before opening email sign-up to visitors. Store SMTP credentials in Supabase, not the repository. Review sender and Auth rate limits there.

The client uses PKCE. Verification and recovery links must be opened in the same browser that requested them. Supabase callback codes are single-use and expire quickly. Callback credentials are removed from the address bar before errors or redirects are rendered. Account pages use a `no-referrer` policy.

The existing shared HeyLead preview gate is separate from Roster accounts. Testers still need access to the preview site. Complete that gate before starting OAuth or email-link tests so it does not delay a short-lived callback.

## Google OAuth

1. Create or select the owner's Google Cloud project and configure its OAuth consent screen for Roster.
2. Create a Web application OAuth client. Use the Supabase callback URL shown in the Google provider panel, normally `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`, as Google's authorized redirect URI.
3. Enter the Google client ID and client secret into Supabase Auth's Google provider configuration and enable it. Keep the secret out of source files, chat and frontend configuration.
4. Use only normal sign-in scopes: `openid`, `email` and `profile`. If the Google app is in testing mode, add the intended test users in Google Cloud.
5. Set `googleEnabled` to `true` in `accounts.json` after the provider is ready, then rebuild.

The Google button redirects to Google's account chooser. It never accepts a Google password inside Roster. Follow [Supabase's Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google) for current console steps.

## Saved data and sessions

- `public.roster_saved_companies` contains a user ID, company slug and created timestamp. Its composite primary key prevents duplicate bookmarks.
- Authenticated users can read, insert and delete only their own rows. Anonymous access and updates are denied. Account deletion cascades to bookmarks.
- The Supabase SDK handles sessions and refresh tokens under the browser key `roster-auth-v1`. Keep third-party scripts on this static origin trusted, since browser scripts can access local sessions.
- Signed-in bookmark lists are held in memory and fetched from the database. Signing out clears that account's list from the UI.
- Guest bookmarks retain the existing `roster-saved` browser key. They do not silently upload at sign-in. The Saved page offers an explicit import, deduplicates and clears imported guest entries only after the database write succeeds.
- Failed saves roll back the affected bookmark and show an error. Stale requests from a previous account cannot restore its bookmarks in a different session.
- Each list displays up to 1,000 saves. This is a frontend limit, not an anti-abuse database quota.
- Sign-out of all devices revokes refresh sessions. Already-issued access tokens can remain valid until expiry, as documented by Supabase.

## Build and verify

From the repository root:

```sh
npm --prefix roster ci --ignore-scripts
node roster/build.mjs
node --test roster/scripts/*.test.mjs
node roster/scripts/check-site.mjs
```

Every site build regenerates `assets/accounts.js` with the current public configuration. Commit the generated bundle and HTML alongside source changes. Future imports do not modify account settings.

To exercise the exact row policies using a local PostgreSQL installation:

```sh
python3 roster/scripts/check-account-rls.py
```

That test creates and removes an isolated temporary cluster with a Unix socket only. It never connects to an existing database. It checks private reads, guest denial, cross-account writes/deletes, duplicate saves, slug constraints and account-deletion cleanup.

After configuring Supabase, complete these checks with owner-controlled test accounts before publishing:

1. Sign up, receive and open verification, then sign in. Confirm existing-address messages do not expose account registration status.
2. Test Google success and cancellation. Confirm return navigation stays within Roster.
3. Request password recovery, test an expired link, set a new password through a valid link, then sign in again.
4. Save a company on desktop, open the same account on mobile and confirm it appears. Remove it and refresh the other device.
5. Import browser saves, including one already saved to the account. Confirm no duplicates.
6. Sign out and switch accounts. Confirm private saved lists never carry over. Verify database policies with two real test users as well as the local SQL test.
7. Test a lost connection, reload and both sign-out actions. Review Supabase Auth logs for provider errors without copying tokens into reports.

Local model and SQL tests cannot verify actual email delivery, Google consent or hosted project settings. Those activation checks remain pending until the project exists. Do not describe accounts as live before they pass.

## Local validation on 12 October 2026

All 76 JavaScript tests passed, including eight account-state tests. The actual SQL migration passed the isolated PostgreSQL permission checks. The build generated 744 pages and passed the site link, metadata, schema and publication checks. Browser checks at desktop and 390-pixel mobile widths covered saving, reload persistence, removal, the empty list, loaded logos and disabled account forms before configuration. There were no console errors in those checks. Test bookmarks were removed afterward.
