# Changelog

All notable changes to this project are documented in this file.

The format follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where practical.

## [Unreleased]

### Changed

- Redesigned the mini program around a strawberry-cream visual system with consistent primary, secondary, disabled, and status colors.
- Replaced the role-selection landing page with a shared dining table that leads directly to ordering or the kitchen.
- Updated role navigation to keep the shared table, role workspace, orders, and profile within reach.
- Clarified guest and chef order feedback with semantic status colors and state-specific primary actions.

## [0.1.0] - 2026-07-14

### Added

- Initial WeChat mini program for couple-focused private kitchen ordering.
- Role-based home flow for guest ordering and chef management.
- Couple invitation flow with invite creation, invite detail loading, and invite acceptance.
- Cloud-backed user initialization and profile saving.
- Shared couple menu with default categories and dishes.
- Menu management for dish creation, editing, status updates, category creation, and soft deletion.
- Cart behavior with quantity updates, taste option combinations, clearing, and draft persistence.
- Order creation, active order lookup, guest history, chef desk actions, cancellation, completion, and review submission.
- Monthly report generation based on completed and reviewed orders.
- Recipe library generated from HowToCook markdown data, including search, category filtering, and recipe-to-dish conversion.
- Cloud functions for users, couples, invites, menu data, dish management, orders, reviews, reports, and reset flows.
- Node.js automated test suite covering domain logic, cloud behavior, and key UI structure.
- Product and UI design documentation under `docs/`.

### Documentation

- Added repository README with setup, deployment, cloud database, testing, recipe data, and security notes.
- Added cloud function reference and deployment guide.
- Added contribution guide and sensitive information checklist.
- Added environment variable example file.

### Security

- Added ignore rules for local tooling state, environment files, private WeChat DevTools config, logs, dependencies, and generated coverage output.
- Documented AppID, CloudBase environment ID, and subscribe template ID handling for public repositories.
