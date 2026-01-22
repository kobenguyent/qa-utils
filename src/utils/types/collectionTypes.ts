/**
 * Unified Collection Types
 * Supports Postman, Insomnia, Thunder Client, and generic formats
 */

export type CollectionFormat = 'postman' | 'insomnia' | 'thunderclient' | 'env' | 'csv' | 'json' | 'unknown';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type VariableType = 'string' | 'secret' | 'number' | 'boolean' | 'default';

export interface CollectionVariable {
  id: string;
  key: string;
  value: string;
  type: VariableType;
  description?: string;
  enabled: boolean;
}

export interface CollectionHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface CollectionRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: CollectionHeader[];
  body?: string;
  description?: string;
  preRequestScript?: string;
  testScript?: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  requests: CollectionRequest[];
  folders: CollectionFolder[];
  preRequestScript?: string;
  testScript?: string;
}

export interface UnifiedCollection {
  id: string;
  name: string;
  description?: string;
  version: string;
  variables: CollectionVariable[];
  folders: CollectionFolder[];
  requests: CollectionRequest[];
  sourceFormat: CollectionFormat;
  type: 'collection' | 'environment';
  preRequestScript?: string;
  testScript?: string;
}

// Postman Types
export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  enabled?: boolean;
  description?: string;
}

export interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

export interface PostmanRequest {
  method: string;
  header?: PostmanHeader[];
  url: string | { raw: string };
  body?: { mode: string; raw?: string };
  description?: string;
}

export interface PostmanEvent {
  listen: string;
  script: {
    exec: string[];
    type: string;
  };
}

export interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
  description?: string;
  event?: PostmanEvent[];
}

export interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
    _postman_id?: string;
  };
  variable?: PostmanVariable[];
  item: PostmanItem[];
  event?: PostmanEvent[];
}

export interface PostmanEnvironment {
  name: string;
  values: PostmanVariable[];
  _postman_variable_scope?: string;
}

// Insomnia Types
export interface InsomniaResource {
  _id: string;
  _type: string;
  name?: string;
  parentId?: string;
  method?: string;
  url?: string;
  headers?: Array<{ name: string; value: string; disabled?: boolean }>;
  body?: { text?: string };
  description?: string;
}

export interface InsomniaEnvironment {
  _id: string;
  _type: 'environment';
  name: string;
  data: Record<string, string>;
  parentId?: string;
}

export interface InsomniaExport {
  _type: 'export';
  __export_format: number;
  resources: (InsomniaResource | InsomniaEnvironment)[];
}

// Thunder Client Types
export interface ThunderClientVariable {
  name: string;
  value: string;
}

export interface ThunderClientRequest {
  _id: string;
  colId: string;
  name: string;
  url: string;
  method: string;
  headers?: Array<{ name: string; value: string; active?: boolean }>;
  body?: { type: string; raw?: string };
  description?: string;
}

export interface ThunderClientCollection {
  _id: string;
  colName: string;
  created: string;
  requests: ThunderClientRequest[];
  folders?: Array<{ _id: string; name: string; requests: ThunderClientRequest[] }>;
}

export interface ThunderClientEnv {
  name: string;
  default: boolean;
  data: ThunderClientVariable[];
}
