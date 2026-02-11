/**
 * Collection Parser - Parse multiple API client formats
 */
import {
  CollectionFormat,
  UnifiedCollection,
  PostmanCollection,
  PostmanEnvironment,
  InsomniaExport,
  InsomniaEnvironment,
  ThunderClientCollection,
  CollectionVariable,
  CollectionRequest,
  CollectionFolder,
  PostmanItem,
} from './types/collectionTypes';

export const detectFormat = (data: any): CollectionFormat => {
  if (!data || typeof data !== 'object') return 'unknown';

  // Postman Collection
  if (data.info?.schema?.includes('postman')) return 'postman';
  
  // Postman Environment
  if (data._postman_variable_scope || (data.values && Array.isArray(data.values))) return 'postman';
  
  // Insomnia
  if (data._type === 'export' && data.__export_format) return 'insomnia';
  
  // Thunder Client
  if (data.colName && data.requests) return 'thunderclient';
  
  return 'json';
};

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Check if a string is valid JSON
 */
const isJsonString = (str: string | undefined): boolean => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  
  // Check if it starts with { or [
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false;
  
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
};

/**
 * Normalize Content-Type header for JSON bodies
 * Adds application/json if missing, or replaces text/plain with application/json
 */
const normalizeJsonContentType = (headers: { key: string; value: string; enabled: boolean }[], body?: string): { key: string; value: string; enabled: boolean }[] => {
  // Check if body is JSON
  if (!isJsonString(body)) {
    return headers;
  }
  
  // Find existing Content-Type header (case-insensitive)
  const contentTypeIndex = headers.findIndex(h => 
    h.key.toLowerCase() === 'content-type'
  );
  
  if (contentTypeIndex === -1) {
    // No Content-Type header, add application/json
    return [...headers, { key: 'Content-Type', value: 'application/json', enabled: true }];
  }
  
  // Check if existing Content-Type is text/plain and body is JSON
  const existingContentType = headers[contentTypeIndex];
  const contentTypeValue = existingContentType.value.toLowerCase().split(';')[0].trim();
  
  if (contentTypeValue === 'text/plain') {
    // Replace text/plain with application/json for JSON bodies
    const updatedHeaders = [...headers];
    updatedHeaders[contentTypeIndex] = {
      ...existingContentType,
      value: 'application/json'
    };
    return updatedHeaders;
  }
  
  return headers;
};

export const parsePostman = (data: PostmanCollection | PostmanEnvironment): UnifiedCollection => {
  const isEnvironment = '_postman_variable_scope' in data || 'values' in data;
  
  if (isEnvironment) {
    const env = data as PostmanEnvironment;
    return {
      id: generateId(),
      name: env.name,
      version: '1.0',
      variables: (env.values || []).map(v => ({
        id: generateId(),
        key: v.key,
        value: v.value || '',
        type: v.type === 'secret' ? 'secret' : 'default',
        description: v.description,
        enabled: v.enabled !== false,
      })),
      folders: [],
      requests: [],
      sourceFormat: 'postman',
      type: 'environment',
    };
  }

  const collection = data as PostmanCollection;
  const variables: CollectionVariable[] = (collection.variable || []).map(v => ({
    id: generateId(),
    key: v.key,
    value: v.value || '',
    type: v.type === 'secret' ? 'secret' : 'default',
    description: v.description,
    enabled: v.enabled !== false,
  }));

  const parseItems = (items: PostmanItem[]): { folders: CollectionFolder[]; requests: CollectionRequest[] } => {
    const folders: CollectionFolder[] = [];
    const requests: CollectionRequest[] = [];

    items.forEach(item => {
      if (item.item) {
        const parsed = parseItems(item.item);
        const preRequestScript = item.event?.find(e => e.listen === 'prerequest')?.script.exec.join('\n');
        const testScript = item.event?.find(e => e.listen === 'test')?.script.exec.join('\n');
        
        folders.push({
          id: generateId(),
          name: item.name,
          description: item.description,
          folders: parsed.folders,
          requests: parsed.requests,
          preRequestScript,
          testScript,
        });
      } else if (item.request) {
        const req = item.request;
        const preRequestScript = item.event?.find(e => e.listen === 'prerequest')?.script.exec.join('\n');
        const testScript = item.event?.find(e => e.listen === 'test')?.script.exec.join('\n');
        
        const body = req.body?.raw;
        const headers = (req.header || []).map(h => ({
          key: h.key,
          value: h.value,
          enabled: !h.disabled,
        }));
        
        requests.push({
          id: generateId(),
          name: item.name,
          method: req.method as any,
          url: typeof req.url === 'string' ? req.url : req.url.raw,
          headers: normalizeJsonContentType(headers, body),
          body,
          description: item.description,
          preRequestScript,
          testScript,
        });
      }
    });

    return { folders, requests };
  };

  const parsed = parseItems(collection.item);

  const collectionPreRequestScript = collection.event?.find((e: any) => e.listen === 'prerequest')?.script.exec.join('\n');
  const collectionTestScript = collection.event?.find((e: any) => e.listen === 'test')?.script.exec.join('\n');

  return {
    id: collection.info._postman_id || generateId(),
    name: collection.info.name,
    description: collection.info.description,
    version: '1.0',
    variables,
    folders: parsed.folders,
    requests: parsed.requests,
    sourceFormat: 'postman',
    type: 'collection',
    preRequestScript: collectionPreRequestScript,
    testScript: collectionTestScript,
  };
};

export const parseInsomnia = (data: InsomniaExport): UnifiedCollection => {
  const resources = data.resources;
  const workspace = resources.find(r => r._type === 'workspace');
  const environments = resources.filter(r => r._type === 'environment') as InsomniaEnvironment[];
  const requests = resources.filter(r => r._type === 'request');
  const folders = resources.filter(r => r._type === 'request_group');

  const variables: CollectionVariable[] = [];
  environments.forEach(env => {
    if (env.data) {
      Object.entries(env.data).forEach(([key, value]) => {
        variables.push({
          id: generateId(),
          key,
          value: String(value),
          type: 'default',
          enabled: true,
        });
      });
    }
  });

  const buildFolder = (folderId: string): CollectionFolder => {
    const folder = folders.find(f => f._id === folderId);
    const childRequests = requests.filter(r => r.parentId === folderId);
    const childFolders = folders.filter(f => f.parentId === folderId);

    return {
      id: folderId,
      name: folder?.name || 'Folder',
      description: (folder as any)?.description,
      requests: childRequests.map(r => {
        const body = (r as any).body?.text;
        const headers = ((r as any).headers || []).map((h: any) => ({
          key: h.name,
          value: h.value,
          enabled: !h.disabled,
        }));
        
        return {
          id: r._id,
          name: r.name || 'Request',
          method: ((r as any).method || 'GET') as any,
          url: (r as any).url || '',
          headers: normalizeJsonContentType(headers, body),
          body,
          description: (r as any).description,
          preRequestScript: (r as any).preRequestScript,
          testScript: (r as any).afterResponseScript,
        };
      }),
      folders: childFolders.map(f => buildFolder(f._id)),
      preRequestScript: (folder as any)?.preRequestScript,
      testScript: (folder as any)?.afterResponseScript,
    };
  };

  const rootFolders = folders.filter(f => !f.parentId || f.parentId === workspace?._id);
  const rootRequests = requests.filter(r => !r.parentId || r.parentId === workspace?._id);

  return {
    id: workspace?._id || generateId(),
    name: workspace?.name || 'Insomnia Collection',
    version: '1.0',
    variables,
    folders: rootFolders.map(f => buildFolder(f._id)),
    requests: rootRequests.map(r => {
      const body = (r as any).body?.text;
      const headers = ((r as any).headers || []).map((h: any) => ({
        key: h.name,
        value: h.value,
        enabled: !h.disabled,
      }));
      
      return {
        id: r._id,
        name: r.name || 'Request',
        method: ((r as any).method || 'GET') as any,
        url: (r as any).url || '',
        headers: normalizeJsonContentType(headers, body),
        body,
        description: (r as any).description,
        preRequestScript: (r as any).preRequestScript,
        testScript: (r as any).afterResponseScript,
      };
    }),
    sourceFormat: 'insomnia',
    type: environments.length > 0 && requests.length === 0 ? 'environment' : 'collection',
    preRequestScript: (workspace as any)?.preRequestScript,
    testScript: (workspace as any)?.afterResponseScript,
  };
};

export const parseThunderClient = (data: ThunderClientCollection): UnifiedCollection => {
  const folders: CollectionFolder[] = (data.folders || []).map(folder => ({
    id: folder._id,
    name: folder.name,
    requests: folder.requests.map(r => {
      const body = r.body?.raw;
      const headers = (r.headers || []).map(h => ({
        key: h.name,
        value: h.value,
        enabled: h.active !== false,
      }));
      
      return {
        id: r._id,
        name: r.name,
        method: r.method as any,
        url: r.url,
        headers: normalizeJsonContentType(headers, body),
        body,
        description: r.description,
      };
    }),
    folders: [],
  }));

  const requests: CollectionRequest[] = data.requests.map(r => {
    const body = r.body?.raw;
    const headers = (r.headers || []).map(h => ({
      key: h.name,
      value: h.value,
      enabled: h.active !== false,
    }));
    
    return {
      id: r._id,
      name: r.name,
      method: r.method as any,
      url: r.url,
      headers: normalizeJsonContentType(headers, body),
      body,
      description: r.description,
    };
  });

  return {
    id: data._id,
    name: data.colName,
    version: '1.0',
    variables: [],
    folders,
    requests,
    sourceFormat: 'thunderclient',
    type: 'collection',
  };
};

export const parseEnv = (content: string): UnifiedCollection => {
  const lines = content.split('\n');
  const variables: CollectionVariable[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      variables.push({
        id: generateId(),
        key: match[1].trim(),
        value: match[2].trim().replace(/^["']|["']$/g, ''),
        type: 'default',
        enabled: true,
      });
    }
  });

  return {
    id: generateId(),
    name: 'Environment Variables',
    version: '1.0',
    variables,
    folders: [],
    requests: [],
    sourceFormat: 'env',
    type: 'environment',
  };
};

export const parseCsv = (content: string): UnifiedCollection => {
  const lines = content.split('\n').filter(l => l.trim());
  const variables: CollectionVariable[] = [];

  lines.forEach((line, idx) => {
    if (idx === 0 && line.toLowerCase().includes('key')) return; // Skip header
    
    const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      variables.push({
        id: generateId(),
        key: parts[0],
        value: parts[1],
        type: parts[2] as any || 'default',
        description: parts[3],
        enabled: parts[4] !== 'false',
      });
    }
  });

  return {
    id: generateId(),
    name: 'CSV Variables',
    version: '1.0',
    variables,
    folders: [],
    requests: [],
    sourceFormat: 'csv',
    type: 'environment',
  };
};

export const parseGenericJson = (data: any): UnifiedCollection => {
  const variables: CollectionVariable[] = [];

  if (typeof data === 'object' && !Array.isArray(data)) {
    Object.entries(data).forEach(([key, value]) => {
      variables.push({
        id: generateId(),
        key,
        value: String(value),
        type: 'default',
        enabled: true,
      });
    });
  }

  return {
    id: generateId(),
    name: 'Generic Collection',
    version: '1.0',
    variables,
    folders: [],
    requests: [],
    sourceFormat: 'json',
    type: 'environment',
  };
};

export const parseCollection = (data: any, format?: CollectionFormat): UnifiedCollection => {
  const detectedFormat = format || detectFormat(data);

  switch (detectedFormat) {
    case 'postman':
      return parsePostman(data);
    case 'insomnia':
      return parseInsomnia(data);
    case 'thunderclient':
      return parseThunderClient(data);
    case 'json':
      return parseGenericJson(data);
    default:
      throw new Error(`Unsupported format: ${detectedFormat}`);
  }
};

export const parseCollectionFromFile = async (file: File): Promise<UnifiedCollection> => {
  const content = await file.text();
  
  if (file.name.endsWith('.env')) {
    return parseEnv(content);
  }
  
  if (file.name.endsWith('.csv')) {
    return parseCsv(content);
  }
  
  const data = JSON.parse(content);
  return parseCollection(data);
};
