/**
 * Search Data — derived from the single source of truth in navigationConfig.
 *
 * Do NOT add items directly here. Instead, add them to
 * `src/config/navigationConfig.ts` and they will automatically appear in
 * both the search index and the navigation header.
 */

import { navigationConfig } from '../config/navigationConfig';

export interface SearchItem {
  title: string;
  description: string;
  path: string;
  category: string;
  keywords: string[];
  icon: string;
}

/**
 * Searchable items derived from the navigation config.
 * Each item in navigationConfig contributes exactly one entry here
 * (de-duplicated by path so items in multiple nav groups appear only once).
 */
export const searchData: SearchItem[] = (() => {
  const seen = new Set<string>();
  const result: SearchItem[] = [];
  for (const item of navigationConfig) {
    if (!seen.has(item.path)) {
      seen.add(item.path);
      result.push({
        title: item.title,
        description: item.description,
        path: item.path,
        category: item.category,
        keywords: item.keywords,
        icon: item.icon,
      });
    }
  }
  return result;
})();

/**
 * Search function with fuzzy matching
 */
export const searchItems = (query: string): SearchItem[] => {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const tokens = lowerQuery.split(/\s+/);

  return searchData
    .map(item => {
      let score = 0;

      // Exact title match - highest priority
      if (item.title.toLowerCase() === lowerQuery) {
        score += 100;
      }

      // Title starts with query
      if (item.title.toLowerCase().startsWith(lowerQuery)) {
        score += 50;
      }

      // Title contains query
      if (item.title.toLowerCase().includes(lowerQuery)) {
        score += 30;
      }

      // Check each token
      tokens.forEach(token => {
        // Category match
        if (item.category.toLowerCase().includes(token)) {
          score += 10;
        }

        // Keyword match
        if (item.keywords.some(kw => kw.includes(token))) {
          score += 15;
        }

        // Description match
        if (item.description.toLowerCase().includes(token)) {
          score += 5;
        }
      });

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 10); // Return top 10 results
};
