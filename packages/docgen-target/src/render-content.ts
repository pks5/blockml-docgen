import type { BlockInstance, CompositionNode, CompositionTemplate } from "@blockml/bom";
import type { TypeRegistry } from "@blockml/framework";
import { getInstanceComposition, getPropertyText, registryHasDoc } from "./bom-walk.js";
import { highlightLanguageId } from "./highlight-assets.js";
import { escapeHtml, memberValueAsText, relativePath } from "./html.js";
import { PAGE_FQNS } from "./options.js";

export interface RenderContentContext {
  registry: TypeRegistry;
  pagePath: string;
  pathByPageFqn: Map<string, string>;
}

function walkNodes(nodes: CompositionNode[], ctx: RenderContentContext): string {
  return nodes.map((node) => renderNode(node, ctx)).join("\n");
}

function renderNode(node: CompositionNode, ctx: RenderContentContext): string {
  if (node.kind === "virtualContainer") {
    return walkNodes(node.children, ctx);
  }
  return renderInstance(node.instance, ctx);
}

function nested(instance: BlockInstance, name: string, ctx: RenderContentContext): string {
  const fill = getInstanceComposition(instance, name);
  if (!fill) {
    return "";
  }
  return walkNodes(fill.children, ctx);
}

function renderInstance(instance: BlockInstance, ctx: RenderContentContext): string {
  const type = instance.typeFqn;
  switch (type) {
    case PAGE_FQNS.section: {
      const heading = memberValueAsText(instance.memberValues.heading);
      const headingHtml = heading ? `<h2>${escapeHtml(heading)}</h2>\n` : "";
      return `<section>\n${headingHtml}${nested(instance, "content", ctx)}\n</section>`;
    }
    case PAGE_FQNS.paragraph: {
      const inner = nested(instance, "content", ctx);
      return `<p>${inner}</p>`;
    }
    case PAGE_FQNS.text: {
      const text = memberValueAsText(instance.memberValues.text) ?? "";
      return escapeHtml(text);
    }
    case PAGE_FQNS.codeBlock: {
      const code = memberValueAsText(instance.memberValues.code) ?? "";
      const language = highlightLanguageId(
        memberValueAsText(instance.memberValues.language),
      );
      return `<pre><code class="language-${escapeHtml(language)}">${escapeHtml(code)}</code></pre>`;
    }
    case PAGE_FQNS.list: {
      return `<ul>\n${nested(instance, "items", ctx)}\n</ul>`;
    }
    case PAGE_FQNS.listItem: {
      const text = memberValueAsText(instance.memberValues.text) ?? "";
      const nestedContent = nested(instance, "content", ctx);
      const lead = text ? escapeHtml(text) : "";
      return `<li>${lead}${nestedContent ? `\n${nestedContent}` : ""}</li>`;
    }
    case PAGE_FQNS.image: {
      const src = memberValueAsText(instance.memberValues.src) ?? "";
      const alt = memberValueAsText(instance.memberValues.alt) ?? "";
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
    }
    case PAGE_FQNS.navigation: {
      const title = memberValueAsText(instance.memberValues.title);
      const titleHtml = title ? `<h2>${escapeHtml(title)}</h2>\n` : "";
      return `<nav class="dg-nav-block">\n${titleHtml}<ul>\n${nested(instance, "items", ctx)}\n</ul>\n</nav>`;
    }
    case PAGE_FQNS.navigationItem: {
      return renderNavigationItem(instance, ctx);
    }
    default:
      // Unknown element: still recurse nested content aggregations
      const parts: string[] = [];
      for (const fill of instance.aggregationCompositions ?? []) {
        parts.push(walkNodes(fill.composition.children, ctx));
      }
      return parts.join("\n");
  }
}

function renderNavigationItem(instance: BlockInstance, ctx: RenderContentContext): string {
  const label = memberValueAsText(instance.memberValues.label) ?? "Untitled";
  const summary = memberValueAsText(instance.memberValues.summary);
  const target = memberValueAsText(instance.memberValues.target);
  const hrefPath = target ? ctx.pathByPageFqn.get(target) : undefined;
  const href = hrefPath ? relativePath(ctx.pagePath, hrefPath) : "#";
  const summaryHtml = summary
    ? ` <span class="dg-muted">— ${escapeHtml(summary)}</span>`
    : "";
  const children = nested(instance, "items", ctx);
  const childList = children ? `\n<ul>\n${children}\n</ul>` : "";
  return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a>${summaryHtml}${childList}</li>`;
}

export function renderPageBody(
  pageFqn: string,
  ctx: RenderContentContext,
): string {
  const page = registryHasDoc(ctx.registry, pageFqn);
  if (!page) {
    return `<p class="dg-muted">Missing page ${escapeHtml(pageFqn)}</p>`;
  }
  const title = getPropertyText(page, "title") ?? page.name;
  const content = page.compositions.find((c) => c.aggregationName === "content")
    ?? (page.members.find((m) => m.kind === "aggregation" && m.name === "content") as
      | { composition?: CompositionTemplate }
      | undefined)?.composition;

  const body = content ? walkNodes(content.children, ctx) : "";
  return `<h1>${escapeHtml(title)}</h1>\n${body}`;
}
