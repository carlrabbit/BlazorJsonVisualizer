# Copilot Instructions

Follow `AGENTS.md` first.

Repository-local documents are the source of truth:

- behavior: `docs/SPECS.md` and referenced specs;
- terminology: `docs/TERMINOLOGY.md`;
- engineering commands and validation tiers: `docs/ENGINEERING.md` and `docs/engineering/command-contract.md`;
- public documentation rules: `docs/PUBLIC-DOCS.md`;
- durable architecture boundaries: `docs/ARCHITECTURE.md` and referenced architecture docs.

Use canonical `eng/` scripts only. Do not invent repository commands. Use Bun, not npm. Use Biome, not ESLint or Prettier.

Do not add non-root `README.md` files, TBPs, or issue templates unless a future repository-standard change explicitly reintroduces them.
