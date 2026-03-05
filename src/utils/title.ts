// Generate a human-readable title from a vault file path

const ACRONYMS = ['adk', 'api', 'cli', 'sdk', 'llm', 'llmz', 'ai', 'ml', 'ui', 'ux', 'db', 'sql', 'rest', 'http', 'https', 'json', 'yaml', 'xml', 'html', 'css', 'js', 'ts', 'e2e', 'poc', 'mvp', 'url', 'uri', 'jwt', 'oauth', 'sso', 'aws', 'gcp', 'ci', 'cd'];

export function generateTitleFromFilename(filepath: string): string {
  // Extract basename and remove .md extension
  const parts = filepath.split('/');
  let baseName = parts[parts.length - 1].replace(/\.md$/, '');

  // Strip leading underscores and special characters
  baseName = baseName.replace(/^[_\-\.]+/, '');

  // Split by hyphens and capitalize each word
  const words = baseName.split('-').map(word => {
    if (ACRONYMS.includes(word.toLowerCase())) {
      return word.toUpperCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return words.join(' ');
}
