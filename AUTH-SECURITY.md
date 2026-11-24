# Login security update

Both admin and control sign-ins share these defaults: five failed attempts in a 15-minute window, a 15-minute lock, 30-minute idle cutoff, optional seven-day remember-me. These values can be changed from control after entering the current password. Session cookies are the default. Browsers may restore session cookies, so browser-close logout cannot be guaranteed.

Five additive tables are created automatically: auth_attempts, auth_activity, auth_sessions, auth_totp and auth_challenges. Existing admin/control sessions are intentionally not accepted by the new code. Customer sessions are unchanged. Back up the database before upgrading.

Optional Authenticator enrollment is available in each account's Settings. Enter the current password, add the displayed manual key in the authenticator and confirm a current code. Eight single-use recovery codes appear once. Save them securely. Enrollment and removal invalidate the account's sessions. No existing account is enrolled automatically. Login codes, keys and passwords are never written to the login log. The activity log keeps 90 days and displays its latest 100 entries in control.

The encryption key must persist across upgrades. Preferred: set AUTH_ENCRYPTION_KEY in the server environment to 64 random hex characters. A PHP constant of the same name is also supported from a private config file. If absent, the app generates a random 256-bit key in a .istore-auth-*.key file ONE LEVEL ABOVE the web document root, outside this release archive, with mode 0600. PHP needs write permission to that parent for first-time creation; if not writable, set the environment/config key instead. Back up the key with the database. Do not replace or delete it after enabling 2FA. Do not move it inside the public document root. The key file is never included in the downloadable zip.

PHP requires openssl, PDO MySQL, mbstring and random_bytes support. Host-specific permissions and HTTPS must be checked on the destination host. This package was validated locally, not deployed to a PHP host.

Forgot-password email is not implemented in this update. Resend must be configured and account email/recovery identity designed before enabling it. Do not expose a link that cannot complete the reset.
