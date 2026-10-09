# Contributing

Thanks for helping improve 情侣私厨点餐小程序. This project is small, but it touches user identity, shared couple data, orders, and cloud functions, so changes should stay careful and easy to review.

## Development Workflow

1. Create a branch for your work.
2. Make focused changes.
3. Run the relevant tests.
4. Check for sensitive information before committing.
5. Open a pull request or push the branch for review.

Recommended branch names:

```text
feat/<short-feature>
fix/<short-bug>
docs/<short-topic>
chore/<short-task>
```

## Commit Style

Use Conventional Commits:

```text
feat(menu): add recipe import flow
fix(order): prevent duplicate active orders
docs(readme): describe cloud deployment
test(invite): cover already-bound user flow
chore(config): update ignore rules
```

Keep commits focused. A cloud function behavior change, frontend page change, and documentation update can be in one commit only when they are part of the same user-facing behavior.

## Tests

Run the full suite before pushing:

```bash
npm test
```

Add or update tests when changing:

- order state transitions
- invite acceptance behavior
- couple data access rules
- menu/category/dish management
- recipe parsing and recipe-to-dish conversion
- cloud error normalization
- page structure or key UI state

The project uses Node.js built-in tests. Tests should be deterministic and should not require a real WeChat cloud environment.

## Cloud Function Guidelines

- Always derive the current user from `cloud.getWXContext().OPENID`.
- Do not trust `openid`, `userId`, or `coupleId` passed from the frontend unless the function validates ownership.
- Check order status before changing it. For example, only pending orders should be accepted, and only accepted orders should be completed.
- Prefer soft delete for dishes so existing order snapshots remain meaningful.
- Keep cloud function responses small and shaped for the page that calls them.
- If a cloud function writes a new collection or field, update `cloudfunctions/README.md`.

## Frontend Guidelines

- Keep page files focused on UI state and user interactions.
- Put cloud calls in `miniprogram/services/`.
- Put reusable business logic in `miniprogram/utils/`.
- Show user-facing errors through clear Chinese messages.
- Avoid duplicating order, menu, or invite rules in multiple pages when a shared helper is practical.

## Recipe Data Guidelines

The recipe library is generated from HowToCook markdown files:

```bash
npm run sync:recipes
```

After syncing:

1. Review the generated `miniprogram/data/howtocook-recipes.js` size.
2. Run `npm test`.
3. Confirm source attribution is still present in generated records.

Do not bulk copy recipe text from websites unless the license and terms allow it.

## Sensitive Information Checklist

Before committing, check that you are not adding:

- `.env` or `.env.*` files, except `.env.example`
- `project.private.config.json`
- API keys
- cloud secret keys
- private keys or certificates
- cookies, sessions, or bearer tokens
- database usernames and passwords
- personal test data that should not be public

These identifiers may appear in configuration but should be reviewed before public release:

- WeChat AppID
- CloudBase environment ID
- subscribe message template ID

They are not passwords, but they reveal project-specific metadata. Replace them if the repository is intended to be a reusable public template.

## Documentation

Update documentation when changing setup or behavior:

- `README.md` for user-facing setup, commands, and project overview.
- `cloudfunctions/README.md` for cloud function responsibilities and database collections.
- `CHANGELOG.md` for notable user-facing or operational changes.
- `docs/` for product and design decisions.
