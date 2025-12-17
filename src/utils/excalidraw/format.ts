import LZString from 'lz-string';
import type { ExcalidrawScene } from './types';

const EXCALIDRAW_FRONTMATTER = `---
excalidraw-plugin: parsed
tags:
  - excalidraw
---
`;

const DRAWING_HEADER = '## Drawing';
const ELEMENT_LINKS_HEADER = '## Element Links';

/**
 * Compress an Excalidraw scene to LZ-String Base64
 */
export function compressScene(scene: ExcalidrawScene): string {
  const json = JSON.stringify(scene);
  const compressed = LZString.compressToBase64(json);
  return compressed;
}

/**
 * Decompress LZ-String Base64 to Excalidraw scene
 */
export function decompressScene(compressed: string): ExcalidrawScene {
  const json = LZString.decompressFromBase64(compressed);
  if (!json) {
    throw new Error('Failed to decompress Excalidraw scene');
  }
  return JSON.parse(json) as ExcalidrawScene;
}

/**
 * Extract text elements from scene for the Text Elements section
 */
function extractTextElements(scene: ExcalidrawScene): string[] {
  const textElements: string[] = [];
  for (const element of scene.elements) {
    if (element.type === 'text' && 'text' in element) {
      const textEl = element as { text: string; id: string };
      if (textEl.text) {
        textElements.push(`${textEl.text} ^${textEl.id}`);
      }
    }
  }
  return textElements;
}

/**
 * Generate .excalidraw.md file content from a scene
 */
export function generateExcalidrawMd(scene: ExcalidrawScene): string {
  const compressed = compressScene(scene);

  // Extract text elements for searchability
  const textElements = extractTextElements(scene);
  const textElementsSection =
    textElements.length > 0
      ? `## Text Elements\n${textElements.join('\n\n')}\n\n`
      : '';

  return `${EXCALIDRAW_FRONTMATTER}
==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'


# Excalidraw Data

${textElementsSection}%%
${DRAWING_HEADER}
\`\`\`compressed-json
${compressed}
\`\`\`

${ELEMENT_LINKS_HEADER}

%%
`;
}

/**
 * Parse .excalidraw.md file content to extract the scene
 */
export function parseExcalidrawMd(content: string): ExcalidrawScene {
  // Find the compressed-json block
  const jsonBlockMatch = content.match(/```compressed-json\n([\s\S]*?)\n```/);
  if (!jsonBlockMatch) {
    throw new Error('Could not find compressed-json block in Excalidraw file');
  }

  // Remove newlines from the compressed data (we chunked it for readability)
  const compressed = jsonBlockMatch[1].replace(/\n/g, '');

  return decompressScene(compressed);
}

/**
 * Check if a file path looks like an Excalidraw file
 */
export function isExcalidrawFile(path: string): boolean {
  return path.endsWith('.excalidraw.md') || path.endsWith('.excalidraw');
}

/**
 * Ensure a file path has the .excalidraw.md extension
 */
export function ensureExcalidrawExtension(path: string): string {
  if (path.endsWith('.excalidraw.md')) {
    return path;
  }
  if (path.endsWith('.excalidraw')) {
    return `${path}.md`;
  }
  if (path.endsWith('.md')) {
    return path.replace(/\.md$/, '.excalidraw.md');
  }
  return `${path}.excalidraw.md`;
}
