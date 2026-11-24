# Next release notes

## 2026-11-24 Control credentials
Hash-only username/password, private setup CLI, conditional MFA change-credentials form, private-file persistence, session invalidation, no plaintext env fallback. See CONTROL-SECURITY-AR.md for setup, Render hash-only environment bootstrap and ephemeral-disk caveats. Local authentication, MFA, rotation and full process restart checks passed. Earlier security fixes remain in git history.

## 2026-11-24 Starter-account choice
Owner-selected behavior: existing default control credentials work on a fresh database with salted hashes only, no setup command and no forced first-login change. An approved amber warning asks for immediate change; it disappears after saving new credentials. Next now stores the authoritative hashes in control_credentials in SQLite; PHP uses control_users. Normal changes and process restarts never fall back to the starter account. Database deletion/restoration or ephemeral deployment can reset state; persistent storage and backups are required. Known defaults are unsafe while exposed online before changing them. Earlier instructions requiring setup before first login are superseded. Account/MFA/session protections remain.
