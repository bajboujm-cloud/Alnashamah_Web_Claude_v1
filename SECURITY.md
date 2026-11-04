# Security

Please report security problems privately to the owner (security contact on alnashamah.ae, to be added)
— do not open a public issue.

## How this project stays safe

- Secrets live only in `.env.local` (laptop) or the hosting provider's environment settings — never in git.
- Every pull request runs: lint, type checks, unit and browser tests, a secret scan (gitleaks),
  a code security scan (Semgrep), and a dependency vulnerability audit. Dependabot proposes updates weekly.
- All prices and stock are checked on the server; the browser is never trusted.
- Customer login uses one-time codes with rate limits and bot protection; staff use password + authenticator app (Phase 2/4).
