# Security Policy

## Reporting a vulnerability

Please **do not open a public issue**. Report privately via GitHub's
[private vulnerability reporting](https://github.com/tanujtp/ui-assistant/security/advisories/new).
You can expect an acknowledgement within 5 business days.

## Scope and design notes

- The library is advisory only and never performs actions on the page.
- API keys must not be shipped to browsers; use `createProxyProvider` in production.
- Page content is treated as untrusted input; model output is validated and rendered as text.

Supported versions: the latest minor release.
