import type {
  AggregationDefinition,
  BlockDefinition,
  BlockInstance,
  CompositionNode,
  CompositionTemplate,
  MemberValue,
  PropertyDefinition,
} from "@blockml/bom";
import type { TypeRegistry } from "@blockml/framework";
import { TYPE_REF_ENTITY } from "./options.js";
import { memberValueAsText, kebabCase, simpleName } from "./html.js";

export function getBlockLevelComposition(
  block: BlockDefinition,
  name: string,
): CompositionTemplate | undefined {
  const fromCompositions = block.compositions.find((c) => c.aggregationName === name);
  if (fromCompositions) {
    return fromCompositions;
  }
  const member = block.members.find((m) => m.kind === "aggregation" && m.name === name) as
    | AggregationDefinition
    | undefined;
  return member?.composition;
}

export function getInstanceComposition(
  instance: BlockInstance,
  name: string,
): CompositionTemplate | undefined {
  return instance.aggregationCompositions?.find((c) => c.aggregationName === name)
    ?.composition;
}

export function getPropertyValue(
  block: BlockDefinition,
  name: string,
): MemberValue | undefined {
  const member = block.members.find((m) => m.kind === "property" && m.name === name) as
    | PropertyDefinition
    | undefined;
  return member?.value;
}

export function getPropertyText(block: BlockDefinition, name: string): string | undefined {
  return memberValueAsText(getPropertyValue(block, name));
}

export function walkCompositionNodes(
  nodes: CompositionNode[],
  visit: (instance: BlockInstance) => void,
): void {
  for (const node of nodes) {
    if (node.kind === "virtualContainer") {
      walkCompositionNodes(node.children, visit);
      continue;
    }
    visit(node.instance);
    for (const fill of node.instance.aggregationCompositions ?? []) {
      walkCompositionNodes(fill.composition.children, visit);
    }
  }
}

export function compositionInstanceFqns(composition: CompositionTemplate | undefined): string[] {
  if (!composition) {
    return [];
  }
  const fqns: string[] = [];
  for (const node of composition.children) {
    if (node.kind !== "blockInstance") {
      continue;
    }
    const fqn = resolveReferenceFqn(node.instance);
    if (fqn) {
      fqns.push(fqn);
    }
  }
  return fqns;
}

export function resolveReferenceFqn(instance: BlockInstance): string | undefined {
  if (instance.typeFqn === TYPE_REF_ENTITY) {
    return memberValueAsText(instance.memberValues.value);
  }
  return instance.typeFqn;
}

export function pageHtmlPathFromFqn(pageFqn: string): string {
  return `${kebabCase(simpleName(pageFqn))}.html`;
}

export function normalizeSitePath(path: string): string {
  let p = path.trim();
  if (p.startsWith("/")) {
    p = p.slice(1);
  }
  if (!p) {
    return "index.html";
  }
  if (!p.endsWith(".html")) {
    p = `${p.replace(/\/$/, "")}.html`;
  }
  return p;
}

export function buildPagePathMap(
  docSet: BlockDefinition,
  pageFqns: string[],
): Map<string, string> {
  const map = new Map<string, string>();
  const mappingComp = getBlockLevelComposition(docSet, "pageMapping");
  if (mappingComp) {
    for (const node of mappingComp.children) {
      if (node.kind !== "blockInstance") {
        continue;
      }
      const pageRef = memberValueAsText(node.instance.memberValues.page);
      const path = memberValueAsText(node.instance.memberValues.path);
      if (pageRef && path) {
        map.set(pageRef, normalizeSitePath(path));
      }
    }
  }
  for (const fqn of pageFqns) {
    if (!map.has(fqn)) {
      map.set(fqn, pageHtmlPathFromFqn(fqn));
    }
  }
  return map;
}

export function registryHasDoc(
  registry: TypeRegistry,
  fqn: string,
): BlockDefinition | undefined {
  return registry.get(fqn)?.block;
}
