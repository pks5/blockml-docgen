import type { BlockDefinition } from "@blockml/bom";
import type { TypeRegistry } from "@blockml/framework";
import {
  compositionInstanceFqns,
  getBlockLevelComposition,
  getPropertyText,
  registryHasDoc,
} from "./bom-walk.js";
import { simpleName } from "./html.js";
import { docSetRootPageGroup } from "./host.js";

export interface NavLink {
  label: string;
  href: string;
  current?: boolean;
}

export interface NavTreeNode {
  kind: "group" | "page";
  label: string;
  /** Present for pages and for groups that resolve to a landing/first page. */
  href?: string;
  current?: boolean;
  children?: NavTreeNode[];
}

export interface SiteNavModel {
  mainMenu: NavLink[];
  sideTree: NavTreeNode[];
}

/** Match TypeReference / QName / FQN to a known group FQN. */
export function refsGroup(ref: string | undefined, groupFqn: string): boolean {
  if (!ref) {
    return false;
  }
  if (ref === groupFqn) {
    return true;
  }
  const simple = simpleName(groupFqn);
  return (
    ref === simple ||
    ref.endsWith(`:${simple}`) ||
    ref.endsWith(`.${simple}`)
  );
}

function groupParentRef(group: BlockDefinition): string | undefined {
  return getPropertyText(group, "parentGroup");
}

function resolvePageHref(
  pageFqn: string | undefined,
  pathByPageFqn: Map<string, string>,
): string | undefined {
  if (!pageFqn) {
    return undefined;
  }
  return pathByPageFqn.get(pageFqn);
}

/** First reachable page path in a group subtree (landingPage, then pages, then children). */
function firstPageHrefInSubtree(
  groupFqn: string,
  childrenByParent: Map<string, string[]>,
  registry: TypeRegistry,
  pathByPageFqn: Map<string, string>,
): string | undefined {
  const group = registryHasDoc(registry, groupFqn);
  if (!group) {
    return undefined;
  }
  const landing = getPropertyText(group, "landingPage");
  const landingHref = resolvePageHref(landing, pathByPageFqn);
  if (landingHref) {
    return landingHref;
  }
  const pages = compositionInstanceFqns(getBlockLevelComposition(group, "pages"));
  for (const pageFqn of pages) {
    const href = pathByPageFqn.get(pageFqn);
    if (href) {
      return href;
    }
  }
  for (const childFqn of childrenByParent.get(groupFqn) ?? []) {
    const href = firstPageHrefInSubtree(
      childFqn,
      childrenByParent,
      registry,
      pathByPageFqn,
    );
    if (href) {
      return href;
    }
  }
  return undefined;
}

function subtreeContainsPage(
  groupFqn: string,
  pageFqn: string,
  childrenByParent: Map<string, string[]>,
  registry: TypeRegistry,
): boolean {
  const group = registryHasDoc(registry, groupFqn);
  if (!group) {
    return false;
  }
  const pages = compositionInstanceFqns(getBlockLevelComposition(group, "pages"));
  if (pages.includes(pageFqn)) {
    return true;
  }
  const landing = getPropertyText(group, "landingPage");
  if (landing === pageFqn) {
    return true;
  }
  for (const childFqn of childrenByParent.get(groupFqn) ?? []) {
    if (subtreeContainsPage(childFqn, pageFqn, childrenByParent, registry)) {
      return true;
    }
  }
  return false;
}

function buildChildrenByParent(
  groupFqns: string[],
  registry: TypeRegistry,
): Map<string, string[]> {
  const childrenByParent = new Map<string, string[]>();
  for (const groupFqn of groupFqns) {
    const group = registryHasDoc(registry, groupFqn);
    if (!group) {
      continue;
    }
    const parentRef = groupParentRef(group);
    if (!parentRef) {
      continue;
    }
    const parentFqn = groupFqns.find((g) => refsGroup(parentRef, g));
    if (!parentFqn) {
      continue;
    }
    const list = childrenByParent.get(parentFqn) ?? [];
    list.push(groupFqn);
    childrenByParent.set(parentFqn, list);
  }
  // Preserve DocSet.pageGroups order for each parent
  for (const [parent, kids] of childrenByParent) {
    kids.sort(
      (a, b) => groupFqns.indexOf(a) - groupFqns.indexOf(b),
    );
    childrenByParent.set(parent, kids);
  }
  return childrenByParent;
}

function buildSideTreeForGroup(
  groupFqn: string,
  childrenByParent: Map<string, string[]>,
  registry: TypeRegistry,
  pathByPageFqn: Map<string, string>,
  currentPageFqn: string,
): NavTreeNode[] {
  const group = registryHasDoc(registry, groupFqn);
  if (!group) {
    return [];
  }
  const nodes: NavTreeNode[] = [];

  const pages = compositionInstanceFqns(getBlockLevelComposition(group, "pages"));
  for (const pageFqn of pages) {
    const page = registryHasDoc(registry, pageFqn);
    const href = pathByPageFqn.get(pageFqn);
    if (!page || !href) {
      continue;
    }
    nodes.push({
      kind: "page",
      label: getPropertyText(page, "title") ?? page.name,
      href,
      current: pageFqn === currentPageFqn,
    });
  }

  for (const childFqn of childrenByParent.get(groupFqn) ?? []) {
    const child = registryHasDoc(registry, childFqn);
    if (!child) {
      continue;
    }
    const childNodes = buildSideTreeForGroup(
      childFqn,
      childrenByParent,
      registry,
      pathByPageFqn,
      currentPageFqn,
    );
    const href = firstPageHrefInSubtree(
      childFqn,
      childrenByParent,
      registry,
      pathByPageFqn,
    );
    nodes.push({
      kind: "group",
      label: getPropertyText(child, "title") ?? child.name,
      href,
      current: subtreeContainsPage(
        childFqn,
        currentPageFqn,
        childrenByParent,
        registry,
      ),
      children: childNodes,
    });
  }

  return nodes;
}

function flatPageNav(
  docSet: BlockDefinition,
  pathByPageFqn: Map<string, string>,
  registry: TypeRegistry,
  currentPageFqn: string,
): SiteNavModel {
  const pageFqns = compositionInstanceFqns(getBlockLevelComposition(docSet, "pages"));
  const sideTree: NavTreeNode[] = [];
  for (const fqn of pageFqns) {
    const page = registryHasDoc(registry, fqn);
    const href = pathByPageFqn.get(fqn);
    if (!page || !href) {
      continue;
    }
    sideTree.push({
      kind: "page",
      label: getPropertyText(page, "title") ?? page.name,
      href,
      current: fqn === currentPageFqn,
    });
  }
  return { mainMenu: [], sideTree };
}

/**
 * Main menu = direct child PageGroups of rootPageGroup.
 * Side TOC = pages + nested groups under the active main section.
 */
export function buildSiteNav(
  registry: TypeRegistry,
  docSetFqn: string,
  pathByPageFqn: Map<string, string>,
  currentPageFqn: string,
): SiteNavModel {
  const docSet = registryHasDoc(registry, docSetFqn);
  if (!docSet) {
    return { mainMenu: [], sideTree: [] };
  }

  const rootGroupRef = docSetRootPageGroup(docSet);
  const groupFqns = compositionInstanceFqns(
    getBlockLevelComposition(docSet, "pageGroups"),
  );

  if (!rootGroupRef || groupFqns.length === 0) {
    return flatPageNav(docSet, pathByPageFqn, registry, currentPageFqn);
  }

  const rootGroupFqn = groupFqns.find((g) => refsGroup(rootGroupRef, g));
  if (!rootGroupFqn) {
    return flatPageNav(docSet, pathByPageFqn, registry, currentPageFqn);
  }

  const childrenByParent = buildChildrenByParent(groupFqns, registry);
  const mainGroupFqns = [...(childrenByParent.get(rootGroupFqn) ?? [])];

  if (mainGroupFqns.length === 0) {
    return flatPageNav(docSet, pathByPageFqn, registry, currentPageFqn);
  }

  let activeMain =
    mainGroupFqns.find((g) =>
      subtreeContainsPage(g, currentPageFqn, childrenByParent, registry),
    ) ?? mainGroupFqns[0]!;

  const mainMenu: NavLink[] = mainGroupFqns.map((gFqn) => {
    const g = registryHasDoc(registry, gFqn)!;
    return {
      label: getPropertyText(g, "title") ?? g.name,
      href:
        firstPageHrefInSubtree(gFqn, childrenByParent, registry, pathByPageFqn) ??
        "#",
      current: gFqn === activeMain,
    };
  });

  const sideTree = buildSideTreeForGroup(
    activeMain,
    childrenByParent,
    registry,
    pathByPageFqn,
    currentPageFqn,
  );

  return { mainMenu, sideTree };
}
