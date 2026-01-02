# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 5.0.x   | :white_check_mark: |
| 4.5.x   | :white_check_mark: |
| 4.4.x   | :white_check_mark: |
| < 4.4   | :x:                |

## Reporting a Vulnerability

We take the security of AutoChat seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Preferred**: Use GitHub's Security Advisory feature
   - Navigate to https://github.com/sushiomsky/autochat/security/advisories
   - Click "Report a vulnerability"
   - Fill in the details

2. **Alternative**: Email the maintainers directly
   - Email: [security contact email - update this]
   - Subject: "[SECURITY] AutoChat Vulnerability Report"
   - Include as much information as possible (see below)

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Full path of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Validation**: Within 5 business days
- **Fix Development**: Depends on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 60 days
- **Public Disclosure**: After patch is released

## Security Update Process

1. Vulnerability reported via secure channel
2. Vulnerability validated and severity assessed
3. Fix developed in private repository
4. Patch tested thoroughly
5. Security advisory published
6. Patch released with security update
7. Public disclosure after users have time to update

## Security Best Practices for Users

When using AutoChat:

1. **Keep Updated**: Always use the latest version
2. **Verify Downloads**: Only download from official sources (Chrome Web Store, GitHub Releases)
3. **Review Permissions**: Check what permissions the extension requests
4. **Use Responsibly**: Follow platform terms of service
5. **Report Issues**: If you notice suspicious behavior, report it

## Security Features

AutoChat implements several security measures:

- **No External Data Collection**: All data stored locally
- **Content Security Policy**: Strict CSP for extension pages
- **Input Sanitization**: All user inputs are sanitized
- **Dependency Scanning**: Automated vulnerability scanning in CI/CD
- **Code Analysis**: Static analysis with CodeQL
- **Secret Scanning**: Automated secret detection

## Automated Security Scanning

Our CI/CD pipeline includes:

- **npm audit**: Dependency vulnerability scanning
- **CodeQL**: Static application security testing
- **Dependabot**: Automated dependency updates
- **TruffleHog**: Secret scanning
- **Dependency Review**: PR-based dependency analysis

## Security Compliance

- **OWASP Top 10**: Regular assessment against OWASP guidelines
- **CWE**: Common Weakness Enumeration analysis
- **CVSS**: Vulnerability scoring using CVSS v3.0

## Hall of Fame

We thank the following individuals for responsibly disclosing security vulnerabilities:

<!-- Names will be added here with permission from reporters -->

## Bug Bounty Program

At this time, AutoChat does not offer a paid bug bounty program. However, we deeply appreciate and acknowledge security researchers who help keep our users safe.

## Contact

For general security concerns or questions about this policy:
- GitHub Issues: https://github.com/sushiomsky/autochat/issues (non-sensitive only)
- Security Advisory: https://github.com/sushiomsky/autochat/security/advisories

---

**Last Updated**: January 2026  
**Policy Version**: 1.0
