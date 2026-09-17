export { DocgenTarget, type DocgenRenderOutput } from "./docgen-target.js";
export {
  type DocgenOptions,
  resolveDocgenOptions,
  DEFAULT_DOCGEN_OPTIONS,
  DOCSET_BASE_TYPE,
} from "./options.js";
export { validatePublishReady } from "./validate-publish-ready.js";
export { assembleSite } from "./assemble-site.js";
export { renderPageBody } from "./render-content.js";
export { buildSiteNav, type SiteNavModel, type NavLink, type NavTreeNode } from "./navigation.js";
export { wrapMainLayout } from "./layout/default-main-layout.js";
export { DEFAULT_THEME_CSS } from "./theme/default-theme.js";
export { lookupByTypeRef, matchesTypeRef } from "./html.js";
export {
  DEFAULT_CODE_LANGUAGE,
  HIGHLIGHT_BLOCKML_GRAMMAR,
  HIGHLIGHT_CORE_SCRIPT,
  HIGHLIGHT_STYLESHEET,
  highlightLanguageId,
  highlightSiteFiles,
} from "./highlight-assets.js";
export { resolveHostDocSetFqn, isDocSetType } from "./host.js";

export { DocgenTarget as default } from "./docgen-target.js";
