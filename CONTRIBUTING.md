# Contributing

Thanks for helping! Quick start:

```bash
npm install
npm run typecheck && npm run lint && npm test
npm run dev        # demo at http://localhost:5173
```

## Guidelines

- Keep **zero runtime dependencies**.
- Add tests for behavior changes (`tests/`, Vitest + jsdom).
- Preserve the security principles in [docs/architecture.md](docs/architecture.md): advisory-only, untrusted-data framing, no value reading, `textContent` rendering.
- Use conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- For UI changes, regenerate media with `npm run media` and include updated screenshots in the PR.

## Pull requests

1. Fork and branch from `main`.
2. Make sure CI passes (typecheck, lint, test, build).
3. Describe the *why*, not just the *what*.

By contributing you agree your work is licensed under the MIT License.
