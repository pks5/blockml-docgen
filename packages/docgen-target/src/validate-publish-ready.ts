import type { Diagnostic } from "@blockml/bom";
import type { TypeRegistry } from "@blockml/framework";
import {
  compositionInstanceFqns,
  getBlockLevelComposition,
  getPropertyValue,
  registryHasDoc,
  walkCompositionNodes,
} from "./bom-walk.js";
import { memberValueAsText } from "./html.js";

const PAGE_FORBIDDEN_PROPS = new Set(["purpose"]);
const PAGE_FORBIDDEN_AGGS = new Set([
  "authoritativeSources",
  "scopes",
  "readerOutcomes",
  "learningObjectives",
  "exclusions",
  "supportingPoints",
  "audiences",
]);

const ELEMENT_FORBIDDEN_PROPS = new Set([
  "purpose",
  "message",
  "role",
  "weight",
  "detailLevel",
]);
const ELEMENT_FORBIDDEN_AGGS = new Set([
  "authoritativeSources",
  "scopes",
  "readerOutcomes",
  "learningObjectives",
  "exclusions",
  "supportingPoints",
  "audiences",
]);

function diag(file: string, message: string): Diagnostic {
  return {
    severity: "error",
    code: "BML_DOCGEN_PUBLISH_NOT_READY",
    message,
    source: { file, line: 1, column: 1 },
  };
}

function hasMemberValue(value: ReturnType<typeof getPropertyValue>): boolean {
  if (!value) {
    return false;
  }
  const text = memberValueAsText(value);
  return text !== undefined && text.trim().length > 0;
}

export function validatePublishReady(
  registry: TypeRegistry,
  docSetFqn: string,
): Diagnostic[] {
  const docSet = registryHasDoc(registry, docSetFqn);
  if (!docSet) {
    return [
      diag("<registry>", `DocSet ${docSetFqn} not found on TypeRegistry`),
    ];
  }

  const pageFqns = compositionInstanceFqns(getBlockLevelComposition(docSet, "pages"));
  const diagnostics: Diagnostic[] = [];

  for (const pageFqn of pageFqns) {
    const page = registryHasDoc(registry, pageFqn);
    const file = registry.get(pageFqn)?.source?.filePath ?? pageFqn;
    if (!page) {
      diagnostics.push(
        diag(file, `Page ${pageFqn} listed on DocSet.pages is missing from the registry`),
      );
      continue;
    }

    for (const prop of PAGE_FORBIDDEN_PROPS) {
      if (hasMemberValue(getPropertyValue(page, prop))) {
        diagnostics.push(
          diag(file, `${pageFqn}: remove page property '${prop}' before HTML render`),
        );
      }
    }
    for (const agg of PAGE_FORBIDDEN_AGGS) {
      const comp = getBlockLevelComposition(page, agg);
      if (comp && comp.children.length > 0) {
        diagnostics.push(
          diag(
            file,
            `${pageFqn}: remove page aggregation '${agg}' before HTML render`,
          ),
        );
      }
    }

    const content = getBlockLevelComposition(page, "content");
    if (!content) {
      continue;
    }
    walkCompositionNodes(content.children, (instance) => {
      for (const prop of ELEMENT_FORBIDDEN_PROPS) {
        if (hasMemberValue(instance.memberValues[prop])) {
          diagnostics.push(
            diag(
              file,
              `${pageFqn}: element ${instance.typeFqn} still has '${prop}' — strip claim/semantic altitude before HTML render`,
            ),
          );
        }
      }
      for (const fill of instance.aggregationCompositions ?? []) {
        if (
          ELEMENT_FORBIDDEN_AGGS.has(fill.aggregationName) &&
          fill.composition.children.length > 0
        ) {
          diagnostics.push(
            diag(
              file,
              `${pageFqn}: element ${instance.typeFqn} still has aggregation '${fill.aggregationName}'`,
            ),
          );
        }
      }
    });
  }

  return diagnostics;
}
