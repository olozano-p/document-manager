/**
 * CSS loader utility for Web Components
 * Loads external CSS files and injects them into shadow DOM
 */

const cssCache = new Map<string, string>();

export async function loadCSS(path: string): Promise<string> {
  // Check cache first
  if (cssCache.has(path)) {
    return cssCache.get(path)!;
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load CSS: ${response.statusText}`);
    }

    const css = await response.text();
    cssCache.set(path, css);
    return css;
  } catch (error) {
    console.warn(`Failed to load CSS from ${path}:`, error);
    return '';
  }
}

export function createStyleElement(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  return style;
}

export async function loadAndInjectCSS(shadowRoot: ShadowRoot, path: string): Promise<void> {
  const css = await loadCSS(path);
  if (css) {
    const style = createStyleElement(css);
    shadowRoot.appendChild(style);
  }
}