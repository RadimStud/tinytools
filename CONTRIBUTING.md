# Contributing to MiniKit

MiniKit is an early project for small, focused software tools. Useful contributions
include a reproducible bug, a better example, clearer documentation, accessibility
improvements and narrowly scoped tool proposals. No coding is required to suggest
a problem worth solving.

## Start with the task

Use the [issue templates](https://github.com/RadimStud/tinytools/issues/new/choose).
Include who needs the tool, the current workaround, frequency, and synthetic input
and output. Search existing issues first and add concrete context to a related one.
An issue is a proposal, not an accepted feature or promised release date.

## Small code changes

Discuss substantial work in an issue before investing time. Keep domain logic
separate from UI, do not add tracking or third-party data uploads to local tools,
and keep tests focused on observable behavior and edge cases.

Run `npm ci`, `npm run lint`, `npm test`, and `npm run build`. Build environment
requirements are documented in README and `.github/workflows/ci.yml`. Use your own
test environment for database/auth/storage changes. Production credentials are
not needed for pure CSV unit tests. Include screenshots for UI changes and explain
what you tested. Maintainers review changes before merging.

Public repository visibility does not by itself grant a software license. Do not
add third-party code or relicense existing code without the necessary permission.

## Community expectations

Be respectful, focus on the task, and avoid harassment, spam and unsolicited
promotion. Do not post secrets, private vault links, personal data, or proprietary
work files. Maintainers may edit or remove inappropriate content using GitHub's
moderation tools. Do not publish exploit details or credentials in public issues.

Follow repository activity with GitHub Watch if you want updates. We do not add
contributors or tool users to mailing lists automatically.
