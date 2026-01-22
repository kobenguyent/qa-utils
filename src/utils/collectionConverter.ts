/**
 * Collection Converter - Convert between different formats
 */
import {
  UnifiedCollection,
  CollectionFormat,
  PostmanCollection,
  PostmanEnvironment,
  InsomniaExport,
  ThunderClientCollection,
  CollectionFolder,
} from './types/collectionTypes';
import { postmanToInsomniaScript, insomniaToPostmanScript, postmanToThunderClientScript } from './scriptTranslator';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const toPostman = (collection: UnifiedCollection): PostmanCollection => {
  const convertFolder = (folder: CollectionFolder): any => {
    const events: any[] = [];
    if (folder.preRequestScript) {
      const script = collection.sourceFormat === 'insomnia'
        ? insomniaToPostmanScript(folder.preRequestScript)
        : folder.preRequestScript;
      events.push({
        listen: 'prerequest',
        script: {
          exec: script.split('\n'),
          type: 'text/javascript',
        },
      });
    }
    if (folder.testScript) {
      const script = collection.sourceFormat === 'insomnia'
        ? insomniaToPostmanScript(folder.testScript)
        : folder.testScript;
      events.push({
        listen: 'test',
        script: {
          exec: script.split('\n'),
          type: 'text/javascript',
        },
      });
    }

    return {
      name: folder.name,
      description: folder.description,
      event: events.length > 0 ? events : undefined,
      item: [
        ...folder.requests.map(r => {
          const reqEvents: any[] = [];
          if (r.preRequestScript) {
            const script = collection.sourceFormat === 'insomnia'
              ? insomniaToPostmanScript(r.preRequestScript)
              : r.preRequestScript;
            reqEvents.push({
              listen: 'prerequest',
              script: {
                exec: script.split('\n'),
                type: 'text/javascript',
              },
            });
          }
          if (r.testScript) {
            const script = collection.sourceFormat === 'insomnia'
              ? insomniaToPostmanScript(r.testScript)
              : r.testScript;
            reqEvents.push({
              listen: 'test',
              script: {
                exec: script.split('\n'),
                type: 'text/javascript',
              },
            });
          }
          
          return {
            name: r.name,
            request: {
              method: r.method,
              header: r.headers.map(h => ({
                key: h.key,
                value: h.value,
                disabled: !h.enabled,
              })),
              url: { raw: r.url },
              body: r.body ? { mode: 'raw', raw: r.body } : undefined,
            },
            description: r.description,
            event: reqEvents.length > 0 ? reqEvents : undefined,
          };
        }),
        ...folder.folders.map(convertFolder),
      ],
    };
  };

  const collectionEvents: any[] = [];
  if (collection.preRequestScript) {
    const script = collection.sourceFormat === 'insomnia'
      ? insomniaToPostmanScript(collection.preRequestScript)
      : collection.preRequestScript;
    collectionEvents.push({
      listen: 'prerequest',
      script: {
        exec: script.split('\n'),
        type: 'text/javascript',
      },
    });
  }
  if (collection.testScript) {
    const script = collection.sourceFormat === 'insomnia'
      ? insomniaToPostmanScript(collection.testScript)
      : collection.testScript;
    collectionEvents.push({
      listen: 'test',
      script: {
        exec: script.split('\n'),
        type: 'text/javascript',
      },
    });
  }

  return {
    info: {
      name: collection.name,
      description: collection.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _postman_id: generateId(),
    },
    variable: collection.variables.map(v => ({
      key: v.key,
      value: v.value,
      type: v.type === 'secret' ? 'secret' : 'default',
      enabled: v.enabled,
      description: v.description,
    })),
    event: collectionEvents.length > 0 ? collectionEvents : undefined,
    item: [
      ...collection.requests.map(r => {
        const events: any[] = [];
        if (r.preRequestScript) {
          const script = collection.sourceFormat === 'insomnia'
            ? insomniaToPostmanScript(r.preRequestScript)
            : r.preRequestScript;
          events.push({
            listen: 'prerequest',
            script: {
              exec: script.split('\n'),
              type: 'text/javascript',
            },
          });
        }
        if (r.testScript) {
          const script = collection.sourceFormat === 'insomnia'
            ? insomniaToPostmanScript(r.testScript)
            : r.testScript;
          events.push({
            listen: 'test',
            script: {
              exec: script.split('\n'),
              type: 'text/javascript',
            },
          });
        }
        
        return {
          name: r.name,
          request: {
            method: r.method,
            header: r.headers.map(h => ({
              key: h.key,
              value: h.value,
              disabled: !h.enabled,
            })),
            url: { raw: r.url },
            body: r.body ? { mode: 'raw', raw: r.body } : undefined,
          },
          description: r.description,
          event: events.length > 0 ? events : undefined,
        };
      }),
      ...collection.folders.map(convertFolder),
    ],
  };
};

export const toPostmanEnvironment = (collection: UnifiedCollection): PostmanEnvironment => ({
  name: collection.name,
  values: collection.variables.map(v => ({
    key: v.key,
    value: v.value,
    type: v.type === 'secret' ? 'secret' : 'default',
    enabled: v.enabled,
    description: v.description,
  })),
  _postman_variable_scope: 'environment',
});

export const toInsomnia = (collection: UnifiedCollection): InsomniaExport => {
  const newWorkspaceId = generateId();
  const workspace: any = {
    _id: newWorkspaceId,
    _type: 'workspace',
    name: collection.name,
    description: collection.description,
  };
  if (collection.preRequestScript) {
    workspace.preRequestScript = collection.sourceFormat === 'postman' 
      ? postmanToInsomniaScript(collection.preRequestScript)
      : collection.preRequestScript;
  }
  if (collection.testScript) {
    workspace.afterResponseScript = collection.sourceFormat === 'postman'
      ? postmanToInsomniaScript(collection.testScript)
      : collection.testScript;
  }

  const resources: any[] = [workspace,
  ];

  if (collection.variables.length > 0) {
    const envData: Record<string, string> = {};
    collection.variables.forEach(v => {
      if (v.enabled) envData[v.key] = v.value;
    });
    
    resources.push({
      _id: generateId(),
      _type: 'environment',
      name: 'Base Environment',
      data: envData,
      parentId: newWorkspaceId,
    });
  }

  const addFolder = (folder: CollectionFolder, parentId: string) => {
    const newFolderId = generateId();
    const folderResource: any = {
      _id: newFolderId,
      _type: 'request_group',
      name: folder.name,
      description: folder.description,
      parentId,
    };
    if (folder.preRequestScript) {
      folderResource.preRequestScript = collection.sourceFormat === 'postman'
        ? postmanToInsomniaScript(folder.preRequestScript)
        : folder.preRequestScript;
    }
    if (folder.testScript) {
      folderResource.afterResponseScript = collection.sourceFormat === 'postman'
        ? postmanToInsomniaScript(folder.testScript)
        : folder.testScript;
    }
    resources.push(folderResource);

    folder.requests.forEach(r => {
      const requestResource: any = {
        _id: generateId(),
        _type: 'request',
        name: r.name,
        method: r.method,
        url: r.url,
        headers: r.headers.map(h => ({
          name: h.key,
          value: h.value,
          disabled: !h.enabled,
        })),
        body: r.body ? { text: r.body } : undefined,
        description: r.description,
        parentId: newFolderId,
      };
      if (r.preRequestScript) {
        requestResource.preRequestScript = collection.sourceFormat === 'postman'
          ? postmanToInsomniaScript(r.preRequestScript)
          : r.preRequestScript;
      }
      if (r.testScript) {
        requestResource.afterResponseScript = collection.sourceFormat === 'postman'
          ? postmanToInsomniaScript(r.testScript)
          : r.testScript;
      }
      resources.push(requestResource);
    });

    folder.folders.forEach(f => addFolder(f, folder.id));
  };

  collection.requests.forEach(r => {
    const requestResource: any = {
      _id: generateId(),
      _type: 'request',
      name: r.name,
      method: r.method,
      url: r.url,
      headers: r.headers.map(h => ({
        name: h.key,
        value: h.value,
        disabled: !h.enabled,
      })),
      body: r.body ? { text: r.body } : undefined,
      description: r.description,
      parentId: newWorkspaceId,
    };
    if (r.preRequestScript) {
      requestResource.preRequestScript = collection.sourceFormat === 'postman'
        ? postmanToInsomniaScript(r.preRequestScript)
        : r.preRequestScript;
    }
    if (r.testScript) {
      requestResource.afterResponseScript = collection.sourceFormat === 'postman'
        ? postmanToInsomniaScript(r.testScript)
        : r.testScript;
    }
    resources.push(requestResource);
  });

  collection.folders.forEach(f => addFolder(f, newWorkspaceId));

  return {
    _type: 'export',
    __export_format: 4,
    resources,
  };
};

export const toThunderClient = (collection: UnifiedCollection): ThunderClientCollection => {
  const newCollectionId = generateId();
  const allRequests: any[] = [];

  const processFolder = (folder: CollectionFolder) => {
    folder.requests.forEach(r => {
      allRequests.push({
        _id: generateId(),
        colId: newCollectionId,
        name: r.name,
        url: r.url,
        method: r.method,
        headers: r.headers.map(h => ({
          name: h.key,
          value: h.value,
          active: h.enabled,
        })),
        body: r.body ? { type: 'raw', raw: r.body } : undefined,
        description: r.description,
        tests: r.testScript ? [
          collection.sourceFormat === 'postman'
            ? postmanToThunderClientScript(r.testScript)
            : r.testScript
        ] : undefined,
      });
    });
    folder.folders.forEach(processFolder);
  };

  collection.requests.forEach(r => {
    allRequests.push({
      _id: generateId(),
      colId: newCollectionId,
      name: r.name,
      url: r.url,
      method: r.method,
      headers: r.headers.map(h => ({
        name: h.key,
        value: h.value,
        active: h.enabled,
      })),
      body: r.body ? { type: 'raw', raw: r.body } : undefined,
      description: r.description,
      tests: r.testScript ? [
        collection.sourceFormat === 'postman'
          ? postmanToThunderClientScript(r.testScript)
          : r.testScript
      ] : undefined,
    });
  });

  collection.folders.forEach(processFolder);

  return {
    _id: newCollectionId,
    colName: collection.name,
    created: new Date().toISOString(),
    requests: allRequests,
  };
};

export const toEnv = (collection: UnifiedCollection): string => {
  return collection.variables
    .filter(v => v.enabled)
    .map(v => {
      const value = v.value.includes(' ') ? `"${v.value}"` : v.value;
      return v.description ? `# ${v.description}\n${v.key}=${value}` : `${v.key}=${value}`;
    })
    .join('\n');
};

export const toCsv = (collection: UnifiedCollection): string => {
  const header = 'key,value,type,description,enabled';
  const rows = collection.variables.map(v => 
    `"${v.key}","${v.value}","${v.type}","${v.description || ''}","${v.enabled}"`
  );
  return [header, ...rows].join('\n');
};

export const toGenericJson = (collection: UnifiedCollection): Record<string, any> => {
  const result: Record<string, any> = {};
  collection.variables.forEach(v => {
    if (v.enabled) result[v.key] = v.value;
  });
  return result;
};

export const convertCollection = (
  collection: UnifiedCollection,
  targetFormat: CollectionFormat
): string => {
  let result: any;

  switch (targetFormat) {
    case 'postman':
      result = toPostman(collection);
      break;
    case 'insomnia':
      result = toInsomnia(collection);
      break;
    case 'thunderclient':
      result = toThunderClient(collection);
      break;
    case 'env':
      return toEnv(collection);
    case 'csv':
      return toCsv(collection);
    case 'json':
      result = toGenericJson(collection);
      break;
    default:
      throw new Error(`Unsupported target format: ${targetFormat}`);
  }

  return JSON.stringify(result, null, 2);
};
