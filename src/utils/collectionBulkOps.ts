/**
 * Collection Bulk Operations - Find, replace, and bulk edit
 */
import {
  UnifiedCollection,
  CollectionVariable,
  CollectionFolder,
  CollectionRequest,
} from './types/collectionTypes';

export type SearchScope = 'variables' | 'requests' | 'all';

export interface SearchResult {
  type: 'variable' | 'request' | 'url' | 'header' | 'body';
  path: string;
  field: string;
  value: string;
  match: string;
}

export interface ReplaceOptions {
  find: string;
  replace: string;
  scope: SearchScope;
  caseSensitive?: boolean;
  regex?: boolean;
}

export const findInCollection = (
  collection: UnifiedCollection,
  searchTerm: string,
  scope: SearchScope = 'all',
  caseSensitive = false
): SearchResult[] => {
  const results: SearchResult[] = [];
  const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  const matches = (text: string) => {
    const target = caseSensitive ? text : text.toLowerCase();
    return target.includes(search);
  };

  if (scope === 'variables' || scope === 'all') {
    collection.variables.forEach(v => {
      if (matches(v.key)) {
        results.push({
          type: 'variable',
          path: `Variables / ${v.key}`,
          field: 'key',
          value: v.key,
          match: searchTerm,
        });
      }
      if (matches(v.value)) {
        results.push({
          type: 'variable',
          path: `Variables / ${v.key}`,
          field: 'value',
          value: v.value,
          match: searchTerm,
        });
      }
    });
  }

  if (scope === 'requests' || scope === 'all') {
    const searchRequests = (requests: CollectionRequest[], path: string) => {
      requests.forEach(r => {
        const reqPath = `${path} / ${r.name}`;
        
        if (matches(r.url)) {
          results.push({
            type: 'url',
            path: reqPath,
            field: 'url',
            value: r.url,
            match: searchTerm,
          });
        }

        r.headers.forEach(h => {
          if (matches(h.key) || matches(h.value)) {
            results.push({
              type: 'header',
              path: reqPath,
              field: `header.${h.key}`,
              value: h.value,
              match: searchTerm,
            });
          }
        });

        if (r.body && matches(r.body)) {
          results.push({
            type: 'body',
            path: reqPath,
            field: 'body',
            value: r.body.substring(0, 100),
            match: searchTerm,
          });
        }
      });
    };

    const searchFolders = (folders: CollectionFolder[], path: string) => {
      folders.forEach(f => {
        const folderPath = `${path} / ${f.name}`;
        searchRequests(f.requests, folderPath);
        searchFolders(f.folders, folderPath);
      });
    };

    searchRequests(collection.requests, collection.name);
    searchFolders(collection.folders, collection.name);
  }

  return results;
};

export const replaceInCollection = (
  collection: UnifiedCollection,
  options: ReplaceOptions
): { collection: UnifiedCollection; count: number } => {
  let count = 0;
  const newCollection = JSON.parse(JSON.stringify(collection)) as UnifiedCollection;

  const replace = (text: string): string => {
    if (options.regex) {
      const flags = options.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(options.find, flags);
      const matches = text.match(regex);
      if (matches) count += matches.length;
      return text.replace(regex, options.replace);
    } else {
      const flags = options.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(options.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const matches = text.match(regex);
      if (matches) count += matches.length;
      return text.replace(regex, options.replace);
    }
  };

  if (options.scope === 'variables' || options.scope === 'all') {
    newCollection.variables.forEach(v => {
      v.key = replace(v.key);
      v.value = replace(v.value);
      if (v.description) v.description = replace(v.description);
    });
  }

  if (options.scope === 'requests' || options.scope === 'all') {
    const replaceInRequests = (requests: CollectionRequest[]) => {
      requests.forEach(r => {
        r.url = replace(r.url);
        r.name = replace(r.name);
        if (r.description) r.description = replace(r.description);
        
        r.headers.forEach(h => {
          h.key = replace(h.key);
          h.value = replace(h.value);
        });

        if (r.body) r.body = replace(r.body);
      });
    };

    const replaceInFolders = (folders: CollectionFolder[]) => {
      folders.forEach(f => {
        f.name = replace(f.name);
        if (f.description) f.description = replace(f.description);
        replaceInRequests(f.requests);
        replaceInFolders(f.folders);
      });
    };

    replaceInRequests(newCollection.requests);
    replaceInFolders(newCollection.folders);
  }

  return { collection: newCollection, count };
};

export const bulkEditVariables = (
  collection: UnifiedCollection,
  updates: Partial<CollectionVariable>[]
): UnifiedCollection => {
  const newCollection = JSON.parse(JSON.stringify(collection)) as UnifiedCollection;
  
  updates.forEach(update => {
    const variable = newCollection.variables.find(v => v.id === update.id);
    if (variable) {
      Object.assign(variable, update);
    }
  });

  return newCollection;
};

export const exportVariables = (
  collection: UnifiedCollection,
  format: 'json' | 'csv'
): string => {
  if (format === 'csv') {
    const header = 'key,value,type,description,enabled';
    const rows = collection.variables.map(v =>
      `"${v.key}","${v.value}","${v.type}","${v.description || ''}","${v.enabled}"`
    );
    return [header, ...rows].join('\n');
  }

  return JSON.stringify(
    collection.variables.map(v => ({
      key: v.key,
      value: v.value,
      type: v.type,
      description: v.description,
      enabled: v.enabled,
    })),
    null,
    2
  );
};

export const importVariables = (
  collection: UnifiedCollection,
  content: string,
  format: 'json' | 'csv'
): UnifiedCollection => {
  const newCollection = JSON.parse(JSON.stringify(collection)) as UnifiedCollection;
  const generateId = () => Math.random().toString(36).substr(2, 9);

  if (format === 'csv') {
    const lines = content.split('\n').filter(l => l.trim());
    lines.forEach((line, idx) => {
      if (idx === 0) return; // Skip header
      
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        newCollection.variables.push({
          id: generateId(),
          key: parts[0],
          value: parts[1],
          type: (parts[2] as any) || 'default',
          description: parts[3],
          enabled: parts[4] !== 'false',
        });
      }
    });
  } else {
    const variables = JSON.parse(content);
    if (Array.isArray(variables)) {
      variables.forEach(v => {
        newCollection.variables.push({
          id: generateId(),
          key: v.key,
          value: v.value,
          type: v.type || 'default',
          description: v.description,
          enabled: v.enabled !== false,
        });
      });
    }
  }

  return newCollection;
};
