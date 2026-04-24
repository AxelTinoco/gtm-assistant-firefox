# Security Policy

## Supported versions

Only the latest released version receives security patches.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a vulnerability

If you discover a security vulnerability, **please do not open a public issue**. Instead:

1. Report it privately through [GitHub Security Advisories](https://github.com/AxelTinoco/tag-assistant-firefox/security/advisories/new)
2. Or email **axeltm8@gmail.com** with the subject `[SECURITY] tag-assistant-firefox`

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- A suggested mitigation if you have one

## What to expect

- **Acknowledgment** within 72 hours of the report
- **Initial assessment** within 7 days
- **Coordinated disclosure**: we'll work with you on a reasonable timeline before disclosing publicly

## Scope

This policy covers the extension's code, its permissions, and its interaction with the browser.

### Areas of special interest

Given the extension uses sensitive permissions (`<all_urls>`, `webRequest`), we pay particular attention to:

- Leakage of sensitive data (tokens, cookies, hit payloads)
- Code injection into third-party pages
- Privilege escalation between scripts (`content` ↔ `background` ↔ `injected`)
- Insufficient validation of inter-script messages
- Accidental exposure of data to websites

## Project best practices

- No data is sent to external servers — all processing is local
- No user credentials or tokens are stored
- Content scripts use `window.postMessage` with origin validation
