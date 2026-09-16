import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapTypeRegistry } from "@blockml/framework";
import { validatePublishReady } from "../src/validate-publish-ready.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const repoRoot = join(pkgRoot, "../..");
const docgenLibrary = join(
  repoRoot,
  "packages/docgen/blocks/org/blockml/bml/docgen/Library.bml",
);

describe("semantic-gate", () => {
  it("fails DirtyDocSet with BML_DOCGEN_PUBLISH_NOT_READY", () => {
    const fixtureDir = join(__dirname, "fixtures/dirty-docset");
    const { registry, diagnostics } = bootstrapTypeRegistry({
      rootDir: repoRoot,
      libraryPaths: [docgenLibrary],
      paths: [fixtureDir],
    });
    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    const diags = validatePublishReady(
      registry,
      "org.blockml.bml.target.docgen.fixture.dirty.DirtyDocSet",
    );
    expect(diags.some((d) => d.code === "BML_DOCGEN_PUBLISH_NOT_READY")).toBe(
      true,
    );
  });
});
