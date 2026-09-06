# BlockML Docgen

Monorepo for **documentation generation** from BlockML libraries.

This workspace authors two publishable BML libraries:

| Package | Role |
|---|---|
| **[@blockml/docgen](packages/docgen)** | Reusable documentation-generation types and four-stage pipeline (DocSet, Page, Plan, manifestation stages) |
| **[@blockml/bmldocs](packages/bmldocs)** | blockml.org documentation set — DocSet, pages, page groups, and site rules |

BML is the source of truth. Companion artifacts (HTML, Markdown, site output, …) are generated from the model.

## Documentation (SSOT)

Start here for humans and LLMs:

| | |
|---|---|
| **Library** | [`blocks/org/blockml/bml/docgen/workspace/Library.bml`](blocks/org/blockml/bml/docgen/workspace/Library.bml) |
| **FQN** | `org.blockml.bml.docgen.workspace.Library` |

Read the library `README` → `documentation.Introduction`, then follow the linked package libraries. Package contracts live under `packages/*/blocks/`. This workspace library is the hub and links **workspace → packages only**.

## Repository layout

```text
blocks/           Workspace BML library (monorepo hub / SSOT entry)
packages/docgen   @blockml/docgen — generic document-generation tools
packages/bmldocs  @blockml/bmldocs — blockml.org documentation library
```

## CLI

Requires Node.js ≥ 20. Install dependencies, then use the `blockml` CLI from `@blockml/cli`.

```bash
npm install
npx blockml validate
```

| Script | Command |
|--------|---------|
| `npm run validate` | `blockml validate` |
| `npm run search:index` | `blockml search index` |

Exit codes: `0` success · `1` diagnostics · `2` config / unknown command / unsupported target.

Full CLI help: `npx blockml --help`.

## License

[Apache-2.0](LICENSE)
