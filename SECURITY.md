# Security policy

## Supported versions

Wobnimo is pre-1.0. Security fixes land in the latest `0.x` release on npm.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a vulnerability

Please **don't open a public issue** for security problems.

Report it privately through GitHub instead: go to the
[Security tab](https://github.com/Pouryaak/wobnimo/security) and choose
**Report a vulnerability**. Include what you found, how to reproduce it, and the
version you tested.

You'll get an acknowledgement within a few days, and a fix or a plan soon after.
Once a fix is released, you'll be credited in the release notes unless you'd
rather not be.

## Scope

- The `wobnimo` npm package (engine, characters, element, React wrapper).
- The playground at https://pouryaak.github.io/wobnimo/.
- This repository's GitHub Actions workflows.

The package has no runtime dependencies and makes no network requests. Every
release is published from GitHub Actions with an npm provenance statement, so
you can check that a version was built from this repository.
