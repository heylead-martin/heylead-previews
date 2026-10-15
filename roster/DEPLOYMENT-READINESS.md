# Roster account release readiness

Updated 12 October 2026. Publication and the proposed saved-company migration are approved, subject to successful tests. No live publication or remote migration has happened yet.

## Prepared and checked

- Public Supabase configuration stored in ignored local environment and GitHub deployment settings, without keys in source or logs.
- Fixed-revision GitHub Pages workflow prepared at `.github/workflows/pages.yml`.
- Complete static artifact staging retains all committed preview folders and only adds the generated public account configuration.
- Artifact checker rejects local environment files, CLI state, dependencies, symlinks and unexpected public configuration fields.
- 87 JavaScript tests pass, including four deployment tests.
- The actual migration passes isolated PostgreSQL checks for private reads, guest denial, cross-account writes/deletes, duplicate saves, slug validation and account-deletion cleanup.
- Hosted read-only Auth connection passes. Email is enabled, sign-up is enabled, email confirmation is required and Google is disabled.
- Browser guest-save check passes: save a company, open Saved, reload, remove, and return to the empty list. The temporary test bookmark was removed.

## Blockers before release

The hosted saved-company table is absent. The CLI reports `AccessTokenRequiredError`, so it cannot link or apply the migration with only the public browser key.

The owner needs to run the following from the review worktree's `roster/` directory:

```sh
npm run supabase -- login
```

Complete login locally. Do not paste the login token or database password into chat. Once logged in, Codex can link and apply the already approved migration using the existing package scripts. A database password may be requested by Supabase during linking and should be entered locally.

After access is available, check the hosted Auth redirect and email-sender configuration and test real account creation, confirmation, sign-in, recovery, sign-out and cross-session private saves. The earlier request reserves Auth setting changes and Google OAuth activation for the owner. Google cannot be reported as working while its provider is disabled. A working configured email sender must be verified before public email registration is treated as ready.

## Release sequence

1. Link the supplied Supabase project with `npm run supabase:link`.
2. Run `npm run supabase -- db push --dry-run`, review only the approved migration, then `npm run supabase -- db push`.
3. Run `npm run check:supabase -- --schema` and hosted account tests with owner-controlled test accounts. Do not email unrelated recipients or weaken confirmation for testing.
4. Assemble a release from current `origin/main` so all other preview work is preserved. The latest main branch contains a separate `/keywords/` tool that must remain intact.
5. Rebuild/check the Roster pages and validate the complete deployment artifact.
6. Switch the existing Pages project from legacy branch publishing to the prepared Actions workflow, preserving `previews.heylead.com` and HTTPS.
7. Push the reviewed release to main. Wait for successful Pages deployment, then check the actual live homepage, guides, filters, account screens, saved companies and mobile layouts.

All pages remain noindex. Quote requests and listing claims remain previews. Publication approval does not make those forms send requests.
