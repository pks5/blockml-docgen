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

## Rebuild the sectors

`@blockml/bmldocs` is a sector model. Each numbered sector is an autonomous sub-model. A later sector is produced from the earlier one by a `ModelTransformation` template under `org.blockml.bml.bmldocs.program`:

| Program | FQN | What it rebuilds |
|---|---|---|
| `BuildA01` | `org.blockml.bml.bmldocs.program.BuildA01` | A01 plan (`BmlDocSetPlan`) |
| `BuildA02` | `org.blockml.bml.bmldocs.program.BuildA02` | A02 DocSet, page skeletons, and page groups |
| `BuildA03` | `org.blockml.bml.bmldocs.program.BuildA03` | Copy A02 into A03, then author the pages |
| `BuildA04` | `org.blockml.bml.bmldocs.program.BuildA04` | Copy A03 into A04, then render the page content in BML |
| `BuildAll` | `org.blockml.bml.bmldocs.program.BuildAll` | The full pipeline, A01 through A04 |

Run them with `blockml transform apply`. The root `package.json` points `blockml.library` at the workspace hub, so pass the bmldocs library explicitly:

```bash
npx blockml transform apply org.blockml.bml.bmldocs.program.BuildA01 \
  --library packages/bmldocs/blocks/org/blockml/bml/bmldocs/Library.bml
```

The same `--library` flag applies to `BuildA02`, `BuildA03`, `BuildA04`, and `BuildAll`. From `packages/bmldocs` the flag can be omitted: that package's `blockml.library` is already the bmldocs library.

`BuildAll` is the only program with run parameters (`targetBlock`). Override them with `--parameters`:

```bash
npx blockml transform apply org.blockml.bml.bmldocs.program.BuildAll \
  --library packages/bmldocs/blocks/org/blockml/bml/bmldocs/Library.bml \
  --parameters '{"targetBlock":"org.blockml.bml.workspace.program.RandomBlock"}'
```

One transform may run at a time in a worktree. The worktree must be clean at the start and before each operation. `A04_02_RenderPages` writes BML page content; it does not emit HTML.

## Build the HTML site from A04

The HTML site is a compile companion of the A04 DocSet. The host file is `BmlDocSet_A04.bml`. The target name `docgen` is registered in [`blockml.config.json`](blockml.config.json) and implemented by `@blockml/docgen-target`.

```bash
npx blockml compile \
  packages/bmldocs/blocks/org/blockml/bml/bmldocs/a04_rendering/data/BmlDocSet_A04.bml \
  docgen \
  --out docs-site
```

`docs-site` is the target default. The DocSet home page is written as `index.html`; other pages follow `pageMapping` or the page simple name. Rebuild A04 (or `BuildAll`) first when the authored pages have changed, then compile.

## License

[Apache-2.0](LICENSE)
