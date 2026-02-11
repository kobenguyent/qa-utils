/**
 * Collection Manager - Parse, edit, convert API collections
 */
import React, { useState, useRef, useEffect } from 'react';
import { Container, Card, Tabs, Tab, Button, Form, Alert, Modal, Table, Badge, Accordion } from 'react-bootstrap';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { parseCollectionFromFile } from '../../utils/collectionParser';
import { convertCollection } from '../../utils/collectionConverter';
import { replaceInCollection, exportVariables, importVariables, SearchScope, ReplaceOptions } from '../../utils/collectionBulkOps';
import { UnifiedCollection, CollectionFormat, CollectionVariable, CollectionRequest, CollectionFolder } from '../../utils/types/collectionTypes';
import { collectionDB } from '../../utils/collectionDB';

export const CollectionManager: React.FC = () => {
  const [collections, setCollections] = useState<UnifiedCollection[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<CollectionFormat>('postman');
  const [convertedOutput, setConvertedOutput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFind, setBulkFind] = useState('');
  const [bulkReplace, setBulkReplace] = useState('');
  const [bulkScope, setBulkScope] = useState<SearchScope>('all');
  const [replacePreview, setReplacePreview] = useState<{ count: number } | null>(null);
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [scriptMode, setScriptMode] = useState<'edit' | 'preview'>('edit');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [runningRequests, setRunningRequests] = useState<Set<string>>(new Set());
  const [requestResults, setRequestResults] = useState<Map<string, any>>(new Map());
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'request' | 'folder' } | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCollection = collections[activeIndex] || null;

  // Get all variables from all collections for autocomplete
  const allVariables = collections.flatMap(c => c.variables.map(v => v.key));

  // Load collections from IndexedDB on mount
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const saved = await collectionDB.loadCollections();
        if (saved.length > 0) {
          setCollections(saved);
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB:', err);
      }
    };
    loadFromDB();
  }, []);

  // Save collections to IndexedDB whenever they change
  useEffect(() => {
    if (collections.length > 0) {
      collectionDB.saveCollections(collections).catch(err => {
        console.error('Failed to save to IndexedDB:', err);
      });
    }
  }, [collections]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setError('');
      const parsed: UnifiedCollection[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const collection = await parseCollectionFromFile(file);
        parsed.push(collection);
      }
      
      setCollections(prev => [...prev, ...parsed]);
      setActiveIndex(collections.length); // Switch to first newly added
      setConvertedOutput('');
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleConvert = () => {
    if (!activeCollection) return;
    try {
      const output = convertCollection(activeCollection, targetFormat);
      setConvertedOutput(output);
    } catch (err) {
      setError(`Conversion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const executeRequest = async (request: CollectionRequest) => {
    setRunningRequests(prev => new Set(prev).add(request.id));
    try {
      // Render variables in URL and headers
      let url = request.url;
      const headers: Record<string, string> = {};
      
      // Collect variables from all loaded collections (including environments)
      const allVariables = collections.flatMap(c => c.variables);
      
      // Replace variables with values from all collections
      allVariables.forEach(v => {
        if (v.enabled) {
          const placeholder = `{{${v.key}}}`;
          url = url.split(placeholder).join(v.value);
        }
      });
      
      request.headers.forEach(h => {
        if (h.enabled) {
          let value = h.value;
          allVariables.forEach(v => {
            if (v.enabled) {
              const placeholder = `{{${v.key}}}`;
              value = value.split(placeholder).join(v.value);
            }
          });
          headers[h.key] = value;
        }
      });

      // Substitute variables in body
      let body = request.body;
      if (body) {
        allVariables.forEach(v => {
          if (v.enabled) {
            const placeholder = `{{${v.key}}}`;
            body = body!.split(placeholder).join(v.value);
          }
        });
      }

      const startTime = Date.now();
      const response = await fetch(url, {
        method: request.method,
        headers,
        body: body && request.method !== 'GET' && request.method !== 'HEAD' ? body : undefined,
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        duration,
        timestamp: new Date().toISOString(),
      };

      setRequestResults(prev => new Map(prev).set(request.id, result));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      const isCorsError = errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch');
      
      setRequestResults(prev => new Map(prev).set(request.id, {
        error: errorMessage,
        isCorsError,
        timestamp: new Date().toISOString(),
      }));
    } finally {
      setRunningRequests(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const executeFolder = async (folder: CollectionFolder) => {
    for (const request of folder.requests) {
      await executeRequest(request);
    }
    for (const subFolder of folder.folders) {
      await executeFolder(subFolder);
    }
  };

  const executeCollection = async () => {
    if (!activeCollection) return;
    for (const request of activeCollection.requests) {
      await executeRequest(request);
    }
    for (const folder of activeCollection.folders) {
      await executeFolder(folder);
    }
  };

  const handleBulkReplace = () => {
    if (!activeCollection || !bulkFind) return;

    const options: ReplaceOptions = {
      find: bulkFind,
      replace: bulkReplace,
      scope: bulkScope,
      caseSensitive: false,
    };

    const result = replaceInCollection(activeCollection, options);
    setReplacePreview({ count: result.count });
    
    if (result.count > 0) {
      const newCollections = [...collections];
      newCollections[activeIndex] = result.collection;
      setCollections(newCollections);
    }
  };

  const handleVariableChange = (id: string, field: keyof CollectionVariable, value: any) => {
    if (!activeCollection) return;
    const newCollection = { ...activeCollection };
    const variable = newCollection.variables.find(v => v.id === id);
    if (variable) {
      (variable as any)[field] = value;
      const newCollections = [...collections];
      newCollections[activeIndex] = newCollection;
      setCollections(newCollections);
    }
  };

  const handleAddVariable = () => {
    if (!activeCollection) return;
    const newVariable: CollectionVariable = {
      id: Math.random().toString(36).substr(2, 9),
      key: 'NEW_VAR',
      value: '',
      type: 'default',
      enabled: true,
    };
    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      variables: [...activeCollection.variables, newVariable],
    };
    setCollections(newCollections);
  };

  const handleDeleteVariable = (id: string) => {
    if (!activeCollection) return;
    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      variables: activeCollection.variables.filter(v => v.id !== id),
    };
    setCollections(newCollections);
  };

  const handleRemoveCollection = (index: number) => {
    const newCollections = collections.filter((_, i) => i !== index);
    setCollections(newCollections);
    if (activeIndex >= newCollections.length) {
      setActiveIndex(Math.max(0, newCollections.length - 1));
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all collections? This cannot be undone.')) {
      await collectionDB.clearAll();
      setCollections([]);
      setActiveIndex(0);
    }
  };

  const handleRequestChange = (requestId: string, field: keyof CollectionRequest, value: any) => {
    if (!activeCollection) return;
    
    const updateRequests = (requests: CollectionRequest[]): CollectionRequest[] => {
      return requests.map(r => r.id === requestId ? { ...r, [field]: value } : r);
    };
    
    const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => ({
        ...f,
        requests: updateRequests(f.requests),
        folders: updateFolders(f.folders),
      }));
    };
    
    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      requests: updateRequests(activeCollection.requests),
      folders: updateFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  const handleHeaderChange = (requestId: string, headerIndex: number, field: 'key' | 'value' | 'enabled', value: any) => {
    if (!activeCollection) return;
    
    const updateRequests = (requests: CollectionRequest[]): CollectionRequest[] => {
      return requests.map(r => {
        if (r.id === requestId) {
          const newHeaders = [...r.headers];
          newHeaders[headerIndex] = { ...newHeaders[headerIndex], [field]: value };
          return { ...r, headers: newHeaders };
        }
        return r;
      });
    };
    
    const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => ({
        ...f,
        requests: updateRequests(f.requests),
        folders: updateFolders(f.folders),
      }));
    };
    
    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      requests: updateRequests(activeCollection.requests),
      folders: updateFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  const handleAddHeader = (requestId: string) => {
    if (!activeCollection) return;
    
    const updateRequests = (requests: CollectionRequest[]): CollectionRequest[] => {
      return requests.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            headers: [...r.headers, { key: 'New-Header', value: '', enabled: true }],
          };
        }
        return r;
      });
    };
    
    const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => ({
        ...f,
        requests: updateRequests(f.requests),
        folders: updateFolders(f.folders),
      }));
    };
    
    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      requests: updateRequests(activeCollection.requests),
      folders: updateFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  const handleDeleteHeader = (requestId: string, headerIndex: number) => {
    if (!activeCollection) return;
    
    const updateRequests = (requests: CollectionRequest[]): CollectionRequest[] => {
      return requests.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            headers: r.headers.filter((_, i) => i !== headerIndex),
          };
        }
        return r;
      });
    };
    
    const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => ({
        ...f,
        requests: updateRequests(f.requests),
        folders: updateFolders(f.folders),
      }));
    };
    
    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      requests: updateRequests(activeCollection.requests),
      folders: updateFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  const handleExportVariables = (format: 'json' | 'csv') => {
    if (!activeCollection) return;
    const content = exportVariables(activeCollection, format);
    const ext = format === 'csv' ? 'csv' : 'json';
    handleDownload(content, `variables.${ext}`);
  };

  const handleImportVariables = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCollection) return;

    try {
      const content = await file.text();
      const format = file.name.endsWith('.csv') ? 'csv' : 'json';
      const updated = importVariables(activeCollection, content, format);
      const newCollections = [...collections];
      newCollections[activeIndex] = updated;
      setCollections(newCollections);
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filteredVariables = activeCollection?.variables.filter(v =>
    searchTerm === '' ||
    v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.value.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filter requests and folders based on search
  const filterRequests = (requests: CollectionRequest[]): CollectionRequest[] => {
    if (!requestSearchTerm) return requests;
    const term = requestSearchTerm.toLowerCase();
    return requests.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.url.toLowerCase().includes(term) ||
      r.method.toLowerCase().includes(term) ||
      r.headers.some(h => h.key.toLowerCase().includes(term) || h.value.toLowerCase().includes(term)) ||
      (r.body && r.body.toLowerCase().includes(term))
    );
  };

  const filterFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
    if (!requestSearchTerm) return folders;
    const term = requestSearchTerm.toLowerCase();
    
    return folders.map(folder => {
      const filteredRequests = filterRequests(folder.requests);
      const filteredSubFolders = filterFolders(folder.folders);
      
      // Include folder if name matches or has matching children
      if (
        folder.name.toLowerCase().includes(term) ||
        filteredRequests.length > 0 ||
        filteredSubFolders.length > 0
      ) {
        return {
          ...folder,
          requests: filteredRequests,
          folders: filteredSubFolders,
        };
      }
      return null;
    }).filter((f): f is CollectionFolder => f !== null);
  };

  const filteredRequests = activeCollection ? filterRequests(activeCollection.requests) : [];
  const filteredFolders = activeCollection ? filterFolders(activeCollection.folders) : [];

  const handleExpandAll = () => {
    if (!activeCollection) return;
    const allIds: string[] = [];
    
    const collectIds = (requests: CollectionRequest[], folders: CollectionFolder[]) => {
      requests.forEach(r => allIds.push(r.id));
      folders.forEach(f => {
        allIds.push(f.id);
        collectIds(f.requests, f.folders);
      });
    };
    
    collectIds(filteredRequests, filteredFolders);
    setExpandedItems(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedItems([]);
  };

  const handleCollectionNameChange = (id: string, newName: string) => {
    const newCollections = collections.map(c => 
      c.id === id ? { ...c, name: newName } : c
    );
    setCollections(newCollections);
  };

  const handleFolderNameChange = (folderId: string, newName: string) => {
    if (!activeCollection) return;

    const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => 
        f.id === folderId 
          ? { ...f, name: newName }
          : { ...f, folders: updateFolders(f.folders) }
      );
    };

    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      folders: updateFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  const handleFolderScriptChange = (folderId: string, field: 'preRequestScript' | 'testScript', value: string) => {
    if (!activeCollection) return;

    const updateFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => 
        f.id === folderId 
          ? { ...f, [field]: value }
          : { ...f, folders: updateFolders(f.folders) }
      );
    };

    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      folders: updateFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  const handleReorderRequests = (sourceId: string, targetId: string, position: 'before' | 'after') => {
    if (!activeCollection || sourceId === targetId) return;

    const reorder = <T extends { id: string }>(items: T[]): T[] => {
      const sourceIdx = items.findIndex(i => i.id === sourceId);
      const targetIdx = items.findIndex(i => i.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return items;

      const newItems = [...items];
      const [removed] = newItems.splice(sourceIdx, 1);
      const adjustedTargetIdx = sourceIdx < targetIdx ? targetIdx : targetIdx + (position === 'after' ? 1 : 0);
      newItems.splice(position === 'after' ? adjustedTargetIdx : targetIdx, 0, removed);
      return newItems;
    };

    const reorderInFolders = (folders: CollectionFolder[]): CollectionFolder[] => {
      return folders.map(f => ({
        ...f,
        requests: reorder(f.requests),
        folders: reorderInFolders(f.folders),
      }));
    };

    const newCollections = [...collections];
    newCollections[activeIndex] = {
      ...activeCollection,
      requests: reorder(activeCollection.requests),
      folders: reorderInFolders(activeCollection.folders),
    };
    setCollections(newCollections);
  };

  // Render variable references in text
  const renderWithVariables = (text: string) => {
    if (!text) return text;
    const varPattern = /\{\{([^}]+)\}\}/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = varPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const varName = match[1];
      const variable = collections.flatMap(c => c.variables).find(v => v.key === varName);
      parts.push(
        <Badge 
          key={match.index} 
          bg={variable ? 'success' : 'warning'} 
          title={variable ? `${varName} = ${variable.value}` : 'Variable not found'}
          style={{ cursor: 'help' }}
        >
          {`{{${varName}}}`}
        </Badge>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  const renderRequest = (request: CollectionRequest) => {
    const usedVariables = collections.flatMap(c => c.variables).filter(v => 
      request.url.includes(`{{${v.key}}}`) ||
      request.headers.some(h => h.value.includes(`{{${v.key}}}`)) ||
      (request.body && request.body.includes(`{{${v.key}}}`))
    );

    return (
    <Accordion.Item 
      key={request.id} 
      eventKey={request.id}
      draggable
      onDragStart={(e) => {
        setDraggedItem({ id: request.id, type: 'request' });
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (draggedItem && draggedItem.id !== request.id) {
          const rect = e.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const position = e.clientY < midpoint ? 'before' : 'after';
          handleReorderRequests(draggedItem.id, request.id, position);
        }
        setDraggedItem(null);
      }}
      onDragEnd={() => setDraggedItem(null)}
      style={{ 
        cursor: 'grab',
        opacity: draggedItem?.id === request.id ? 0.5 : 1,
      }}
    >
      <Accordion.Header>
        <div className="d-flex align-items-center w-100">
          <span style={{ cursor: 'grab', marginRight: '8px' }} title="Drag to reorder">⋮⋮</span>
          <Badge bg={request.method === 'GET' ? 'success' : request.method === 'POST' ? 'primary' : 'warning'} className="me-2">
            {request.method}
          </Badge>
          {editingRequest === request.id ? (
            <Form.Control
              size="sm"
              value={request.name}
              onChange={(e) => handleRequestChange(request.id, 'name', e.target.value)}
              onBlur={() => setEditingRequest(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingRequest(null);
              if (e.key === 'Escape') setEditingRequest(null);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            style={{ width: '200px', display: 'inline-block' }}
          />
        ) : (
          <span onDoubleClick={(e) => { e.stopPropagation(); setEditingRequest(request.id); }} title="Double-click to rename">
            {request.name}
          </span>
        )}
        {usedVariables.length > 0 && (
          <Badge bg="info" className="ms-2">{usedVariables.length} vars</Badge>
        )}
        </div>
      </Accordion.Header>
      <Accordion.Body>
        <div className="mb-3">
          <Button
            variant={runningRequests.has(request.id) ? 'secondary' : 'success'}
            size="sm"
            onClick={() => executeRequest(request)}
            disabled={runningRequests.has(request.id)}
          >
            {runningRequests.has(request.id) ? '⏳ Running...' : '▶️ Run Request'}
          </Button>
        </div>
        {requestResults.has(request.id) && (
          <Alert variant={requestResults.get(request.id)?.error ? 'danger' : 'success'} className="mb-3">
            {requestResults.get(request.id)?.error ? (
              <>
                <strong>❌ Error:</strong> {requestResults.get(request.id).error}
                {requestResults.get(request.id).isCorsError && (
                  <div className="mt-2">
                    <strong>🔒 CORS Issue:</strong> Browser security prevents direct API calls.
                    <br />
                    <strong>Solutions:</strong>
                    <ul className="mb-0 mt-1">
                      <li>Use a browser extension like "CORS Unblock" or "Allow CORS"</li>
                      <li>Configure your API server to allow CORS from this origin</li>
                      <li>Use a CORS proxy (e.g., <code>https://cors-anywhere.herokuapp.com/</code>)</li>
                      <li>Use an API testing desktop application (no CORS restrictions)</li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <strong>✅ {requestResults.get(request.id).status} {requestResults.get(request.id).statusText}</strong>
                <span className="ms-2">⏱️ {requestResults.get(request.id).duration}ms</span>
                <pre className="mt-2 mb-0" style={{ maxHeight: '200px', overflow: 'auto', fontSize: '0.85rem' }}>
                  {JSON.stringify(requestResults.get(request.id).data, null, 2)}
                </pre>
              </>
            )}
          </Alert>
        )}
        {usedVariables.length > 0 && (
          <Alert variant="info" className="mb-3">
            <strong>Variables used:</strong>
            <div className="mt-2">
              {usedVariables.map(v => (
                <Badge key={v.id} bg="success" className="me-2 mb-1">
                  {v.key} = {v.value}
                </Badge>
              ))}
            </div>
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Method</Form.Label>
          <Form.Select
            size="sm"
            value={request.method}
            onChange={(e) => handleRequestChange(request.id, 'method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>URL</Form.Label>
          <Form.Control
            size="sm"
            value={request.url}
            onChange={(e) => handleRequestChange(request.id, 'url', e.target.value)}
            list={`variables-${request.id}`}
          />
          <datalist id={`variables-${request.id}`}>
            {allVariables.map(v => (
              <option key={v} value={`{{${v}}}`} />
            ))}
          </datalist>
          <Form.Text className="d-block mt-1">
            {renderWithVariables(request.url)}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Headers</Form.Label>
            <Button size="sm" variant="outline-primary" onClick={() => handleAddHeader(request.id)}>
              ➕ Add Header
            </Button>
          </div>
          {request.headers.map((h, idx) => (
            <div key={idx} className="mb-2">
              <div className="d-flex gap-2">
                <Form.Check
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) => handleHeaderChange(request.id, idx, 'enabled', e.target.checked)}
                />
                <Form.Control
                  size="sm"
                  placeholder="Key"
                  value={h.key}
                  onChange={(e) => handleHeaderChange(request.id, idx, 'key', e.target.value)}
                />
                <Form.Control
                  size="sm"
                  placeholder="Value"
                  value={h.value}
                  onChange={(e) => handleHeaderChange(request.id, idx, 'value', e.target.value)}
                  list={`header-vars-${request.id}-${idx}`}
                />
                <datalist id={`header-vars-${request.id}-${idx}`}>
                  {allVariables.map(v => (
                    <option key={v} value={`{{${v}}}`} />
                  ))}
                </datalist>
                <Button size="sm" variant="danger" onClick={() => handleDeleteHeader(request.id, idx)}>
                  🗑️
                </Button>
              </div>
              {h.value && (
                <Form.Text className="d-block ms-4 mt-1">
                  {renderWithVariables(h.value)}
                </Form.Text>
              )}
            </div>
          ))}
        </Form.Group>

        {request.body !== undefined && (
          <Form.Group className="mb-3">
            <Form.Label>Body</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={request.body || ''}
              onChange={(e) => handleRequestChange(request.id, 'body', e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
            {request.body && (
              <Form.Text className="d-block mt-1">
                {renderWithVariables(request.body)}
              </Form.Text>
            )}
          </Form.Group>
        )}

        {request.preRequestScript !== undefined && (
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Pre-request Script</Form.Label>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => setScriptMode(scriptMode === 'edit' ? 'preview' : 'edit')}
              >
                {scriptMode === 'edit' ? '👁️ Preview' : '✏️ Edit'}
              </Button>
            </div>
            {scriptMode === 'edit' ? (
              <Form.Control
                as="textarea"
                rows={5}
                value={request.preRequestScript || ''}
                onChange={(e) => handleRequestChange(request.id, 'preRequestScript', e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                placeholder="// JavaScript code to run before request"
              />
            ) : (
              <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ fontSize: '0.9rem' }}>
                {request.preRequestScript || '// No script'}
              </SyntaxHighlighter>
            )}
          </Form.Group>
        )}

        {request.testScript !== undefined && (
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">Test Script</Form.Label>
              <Button 
                size="sm" 
                variant="outline-secondary"
                onClick={() => setScriptMode(scriptMode === 'edit' ? 'preview' : 'edit')}
              >
                {scriptMode === 'edit' ? '👁️ Preview' : '✏️ Edit'}
              </Button>
            </div>
            {scriptMode === 'edit' ? (
              <Form.Control
                as="textarea"
                rows={5}
                value={request.testScript || ''}
                onChange={(e) => handleRequestChange(request.id, 'testScript', e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                placeholder="// JavaScript test code"
              />
            ) : (
              <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ fontSize: '0.9rem' }}>
                {request.testScript || '// No test script'}
              </SyntaxHighlighter>
            )}
          </Form.Group>
        )}

        {request.description && (
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={request.description}
              onChange={(e) => handleRequestChange(request.id, 'description', e.target.value)}
            />
          </Form.Group>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
  };

  const renderFolder = (folder: CollectionFolder, path: string): React.ReactNode => (
    <Accordion.Item 
      key={folder.id} 
      eventKey={folder.id}
      draggable
      onDragStart={(e) => {
        setDraggedItem({ id: folder.id, type: 'folder' });
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (draggedItem && draggedItem.id !== folder.id) {
          const rect = e.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const position = e.clientY < midpoint ? 'before' : 'after';
          handleReorderRequests(draggedItem.id, folder.id, position);
        }
        setDraggedItem(null);
      }}
      onDragEnd={() => setDraggedItem(null)}
      style={{ 
        cursor: 'grab',
        opacity: draggedItem?.id === folder.id ? 0.5 : 1,
      }}
    >
      <Accordion.Header>
        <div className="d-flex align-items-center w-100">
        <span style={{ cursor: 'grab', marginRight: '8px' }} title="Drag to reorder">⋮⋮</span>
        {editingFolderId === folder.id ? (
          <Form.Control
            size="sm"
            value={folder.name}
            onChange={(e) => handleFolderNameChange(folder.id, e.target.value)}
            onBlur={() => setEditingFolderId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingFolderId(null);
              if (e.key === 'Escape') setEditingFolderId(null);
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            style={{ width: '200px', display: 'inline-block' }}
          />
        ) : (
          <span onDoubleClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); }} title="Double-click to rename">
            📁 {folder.name}
          </span>
        )}
        </div>
      </Accordion.Header>
      <Accordion.Body>
        <div className="mb-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => executeFolder(folder)}
          >
            ▶️ Run All Requests in Folder
          </Button>
        </div>
        {folder.description && <p className="text-muted">{folder.description}</p>}
        
        <h6 className="mt-3 mb-3">Folder Scripts</h6>
        
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Pre-request Script (runs before all requests in folder)</Form.Label>
            <Button 
              size="sm" 
              variant="outline-secondary"
              onClick={() => setScriptMode(scriptMode === 'edit' ? 'preview' : 'edit')}
            >
              {scriptMode === 'edit' ? '👁️ Preview' : '✏️ Edit'}
            </Button>
          </div>
          {scriptMode === 'edit' ? (
            <Form.Control
              as="textarea"
              rows={4}
              value={folder.preRequestScript || ''}
              onChange={(e) => handleFolderScriptChange(folder.id, 'preRequestScript', e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              placeholder="// JavaScript code to run before all requests in this folder"
            />
          ) : (
            <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ fontSize: '0.9rem' }}>
              {folder.preRequestScript || '// No pre-request script'}
            </SyntaxHighlighter>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Test Script (runs after all requests in folder)</Form.Label>
            <Button 
              size="sm" 
              variant="outline-secondary"
              onClick={() => setScriptMode(scriptMode === 'edit' ? 'preview' : 'edit')}
            >
              {scriptMode === 'edit' ? '👁️ Preview' : '✏️ Edit'}
            </Button>
          </div>
          {scriptMode === 'edit' ? (
            <Form.Control
              as="textarea"
              rows={4}
              value={folder.testScript || ''}
              onChange={(e) => handleFolderScriptChange(folder.id, 'testScript', e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              placeholder="// JavaScript test code to run after all requests in this folder"
            />
          ) : (
            <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ fontSize: '0.9rem' }}>
              {folder.testScript || '// No test script'}
            </SyntaxHighlighter>
          )}
        </Form.Group>

        <hr />
        
        <h6 className="mb-3">Requests in Folder</h6>
        
        <Accordion 
          activeKey={expandedItems}
          onSelect={(keys) => setExpandedItems(Array.isArray(keys) ? keys : keys ? [keys] : [])}
          alwaysOpen
        >
          {folder.requests.map(r => renderRequest(r))}
          {folder.folders.map(f => renderFolder(f, `${path}/${folder.name}`))}
        </Accordion>
      </Accordion.Body>
    </Accordion.Item>
  );

  return (
    <Container className="py-4">
      <h1 className="mb-4">📦 Collection Manager</h1>
      <p className="lead">Parse, edit, and convert REST API collections between multiple popular API client formats.</p>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Upload Collection/Environment Files</Form.Label>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept=".json,.env,.csv"
              onChange={handleFileUpload}
              multiple
            />
            <Form.Text>Supports: Multiple API client formats (.env, .csv, generic JSON). Select multiple files to import both collections and environments.</Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>

      {collections.length > 0 && (
        <>
          <Card className="mb-3 border-primary">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">📚 Collections & Environments ({collections.length})</h5>
                  <small>💾 Auto-saved to browser storage</small>
                </div>
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={handleClearAll}
                >
                  🗑️ Clear All
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="bg-light">
              <div className="d-flex flex-wrap gap-2">
                {collections.map((col, idx) => (
                  <div key={col.id} className="position-relative">
                    {editingCollectionId === col.id ? (
                      <Form.Control
                        size="sm"
                        value={col.name}
                        onChange={(e) => handleCollectionNameChange(col.id, e.target.value)}
                        onBlur={() => setEditingCollectionId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingCollectionId(null);
                          if (e.key === 'Escape') setEditingCollectionId(null);
                        }}
                        autoFocus
                        style={{ width: '200px', display: 'inline-block' }}
                      />
                    ) : (
                      <Button
                        variant={activeIndex === idx ? 'primary' : 'outline-secondary'}
                        size="lg"
                        onClick={() => setActiveIndex(idx)}
                        onDoubleClick={() => setEditingCollectionId(col.id)}
                        className="pe-5 fw-bold"
                        title="Double-click to rename"
                      >
                        {col.type === 'environment' ? '🌍' : '📦'} {col.name}
                      </Button>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="position-absolute top-0 end-0 text-danger p-0"
                      style={{ fontSize: '0.7rem', marginTop: '2px', marginRight: '2px' }}
                      onClick={() => handleRemoveCollection(idx)}
                      title="Remove"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {activeCollection && (
        <Tabs defaultActiveKey="source" className="mb-3">
          <Tab eventKey="source" title="📄 Source">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Collection Info</h5>
                  <Button
                    variant="success"
                    size="lg"
                    onClick={executeCollection}
                  >
                    ▶️ Run All Requests
                  </Button>
                </div>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td><strong>Type</strong></td>
                      <td><Badge bg={activeCollection.type === 'environment' ? 'success' : 'primary'}>{activeCollection.type}</Badge></td>
                    </tr>
                    <tr>
                      <td><strong>Name</strong></td>
                      <td>{activeCollection.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Format</strong></td>
                      <td><Badge bg="info">{activeCollection.sourceFormat}</Badge></td>
                    </tr>
                    <tr>
                      <td><strong>Variables</strong></td>
                      <td>{activeCollection.variables.length}</td>
                    </tr>
                    <tr>
                      <td><strong>Requests</strong></td>
                      <td>{activeCollection.requests.length}</td>
                    </tr>
                    <tr>
                      <td><strong>Folders</strong></td>
                      <td>{activeCollection.folders.length}</td>
                    </tr>
                  </tbody>
                </Table>
                <details>
                  <summary className="btn btn-sm btn-outline-secondary">View Raw JSON</summary>
                  <pre className="bg-light p-3 mt-2" style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {JSON.stringify(activeCollection, null, 2)}
                  </pre>
                </details>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="editor" title="✏️ Editor">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Variables ({activeCollection.variables.length})</h5>
                  <div>
                    <Button variant="success" size="sm" onClick={handleAddVariable} className="me-2">
                      ➕ Add Variable
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={() => setShowBulkModal(true)}>
                      🔄 Bulk Operations
                    </Button>
                  </div>
                </div>

                <Form.Control
                  type="text"
                  placeholder="🔍 Search variables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-3"
                />

                <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Enabled</th>
                        <th>Key</th>
                        <th>Value</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVariables.map(v => (
                        <tr key={v.id}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={v.enabled}
                              onChange={(e) => handleVariableChange(v.id, 'enabled', e.target.checked)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              size="sm"
                              value={v.key}
                              onChange={(e) => handleVariableChange(v.id, 'key', e.target.value)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              size="sm"
                              value={v.value}
                              onChange={(e) => handleVariableChange(v.id, 'value', e.target.value)}
                              type={v.type === 'secret' ? 'password' : 'text'}
                            />
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={v.type}
                              onChange={(e) => handleVariableChange(v.id, 'type', e.target.value)}
                            >
                              <option value="default">Default</option>
                              <option value="string">String</option>
                              <option value="secret">Secret</option>
                              <option value="number">Number</option>
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Control
                              size="sm"
                              value={v.description || ''}
                              onChange={(e) => handleVariableChange(v.id, 'description', e.target.value)}
                              placeholder="Description..."
                            />
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteVariable(v.id)}
                            >
                              🗑️
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <hr />

                <h5 className="mt-4 mb-3">Collection Scripts</h5>
                
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">Pre-request Script (runs before all requests)</Form.Label>
                    <Button 
                      size="sm" 
                      variant="outline-secondary"
                      onClick={() => setScriptMode(scriptMode === 'edit' ? 'preview' : 'edit')}
                    >
                      {scriptMode === 'edit' ? '👁️ Preview' : '✏️ Edit'}
                    </Button>
                  </div>
                  {scriptMode === 'edit' ? (
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={activeCollection.preRequestScript || ''}
                      onChange={(e) => {
                        const newCollections = [...collections];
                        newCollections[activeIndex] = {
                          ...activeCollection,
                          preRequestScript: e.target.value,
                        };
                        setCollections(newCollections);
                      }}
                      style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                      placeholder="// JavaScript code to run before all requests in this collection"
                    />
                  ) : (
                    <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ fontSize: '0.9rem' }}>
                      {activeCollection.preRequestScript || '// No pre-request script'}
                    </SyntaxHighlighter>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">Test Script (runs after all requests)</Form.Label>
                    <Button 
                      size="sm" 
                      variant="outline-secondary"
                      onClick={() => setScriptMode(scriptMode === 'edit' ? 'preview' : 'edit')}
                    >
                      {scriptMode === 'edit' ? '👁️ Preview' : '✏️ Edit'}
                    </Button>
                  </div>
                  {scriptMode === 'edit' ? (
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={activeCollection.testScript || ''}
                      onChange={(e) => {
                        const newCollections = [...collections];
                        newCollections[activeIndex] = {
                          ...activeCollection,
                          testScript: e.target.value,
                        };
                        setCollections(newCollections);
                      }}
                      style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                      placeholder="// JavaScript test code to run after all requests in this collection"
                    />
                  ) : (
                    <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ fontSize: '0.9rem' }}>
                      {activeCollection.testScript || '// No test script'}
                    </SyntaxHighlighter>
                  )}
                </Form.Group>

                <hr />

                <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                  <h5 className="mb-0">Requests & Folders</h5>
                  <Button 
                    size="sm" 
                    variant="outline-info"
                    onClick={() => setShowVariables(!showVariables)}
                  >
                    {showVariables ? '🔽 Hide' : '📋 Show'} Variables Reference
                  </Button>
                </div>

                <Form.Control
                  type="text"
                  placeholder="🔍 Search requests by name, URL, method, headers, or body..."
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                  className="mb-3"
                />

                <div className="d-flex justify-content-between align-items-center mb-3">
                  {requestSearchTerm && (
                    <Alert variant="info" className="mb-0 flex-grow-1 me-2">
                      Found: {filteredRequests.length} request(s) and {filteredFolders.length} folder(s)
                      <Button 
                        size="sm" 
                        variant="link" 
                        onClick={() => setRequestSearchTerm('')}
                        className="ms-2"
                      >
                        Clear
                      </Button>
                    </Alert>
                  )}
                  {!requestSearchTerm && (filteredRequests.length > 0 || filteredFolders.length > 0) && (
                    <div className="ms-auto">
                      <Button 
                        size="sm" 
                        variant="outline-secondary" 
                        onClick={handleExpandAll}
                        className="me-2"
                      >
                        ⬇️ Expand All
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-secondary" 
                        onClick={handleCollapseAll}
                      >
                        ⬆️ Collapse All
                      </Button>
                    </div>
                  )}
                </div>

                {showVariables && (
                  <Alert variant="light" className="mb-3">
                    <strong>Available Variables ({allVariables.length}):</strong>
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {collections.map(col => (
                        <div key={col.id}>
                          <Badge bg={col.type === 'environment' ? 'success' : 'primary'} className="mb-1">
                            {col.name}
                          </Badge>
                          <div className="ms-2">
                            {col.variables.filter(v => v.enabled).map(v => (
                              <Badge 
                                key={v.id} 
                                bg="secondary" 
                                className="me-1 mb-1"
                                style={{ cursor: 'pointer' }}
                                title={`${v.key} = ${v.value}`}
                                onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}
                              >
                                {`{{${v.key}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Form.Text className="d-block mt-2">
                      💡 Click any variable to copy. Type in URL/headers to see autocomplete suggestions.
                    </Form.Text>
                  </Alert>
                )}

                {activeCollection.type === 'environment' ? (
                  <Alert variant="info">This is an environment file. It contains only variables, no requests.</Alert>
                ) : filteredRequests.length === 0 && filteredFolders.length === 0 && requestSearchTerm ? (
                  <Alert variant="warning">
                    No requests or folders match "{requestSearchTerm}". Try a different search term.
                  </Alert>
                ) : (
                  <Accordion 
                    activeKey={expandedItems}
                    onSelect={(keys) => setExpandedItems(Array.isArray(keys) ? keys : keys ? [keys] : [])}
                    alwaysOpen
                  >
                    {filteredRequests.map(r => renderRequest(r))}
                    {filteredFolders.map(f => renderFolder(f, activeCollection.name))}
                  </Accordion>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="convert" title="🔄 Convert">
            <Card>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Target Format</Form.Label>
                  <Form.Select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as CollectionFormat)}>
                    <option value="postman">Postman-Format Collection</option>
                    <option value="insomnia">Insomnia-Format Export</option>
                    <option value="thunderclient">Thunder Client-Format</option>
                    <option value="env">.env File</option>
                    <option value="csv">CSV</option>
                    <option value="json">Generic JSON</option>
                  </Form.Select>
                </Form.Group>

                <Button variant="primary" onClick={handleConvert} className="mb-3">
                  🔄 Convert
                </Button>

                {convertedOutput && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6>Converted Output</h6>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleDownload(convertedOutput, `collection.${targetFormat === 'env' ? 'env' : targetFormat === 'csv' ? 'csv' : 'json'}`)}
                      >
                        💾 Download
                      </Button>
                    </div>
                    <pre className="bg-light p-3" style={{ maxHeight: '500px', overflow: 'auto' }}>
                      {convertedOutput}
                    </pre>
                  </>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="export" title="📤 Export">
            <Card>
              <Card.Body>
                <h5>Export Options</h5>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" onClick={() => handleDownload(JSON.stringify(activeCollection, null, 2), 'collection.json')}>
                    📄 Export as Unified JSON
                  </Button>
                  <Button variant="outline-success" onClick={() => handleExportVariables('json')}>
                    📋 Export Variables (JSON)
                  </Button>
                  <Button variant="outline-success" onClick={() => handleExportVariables('csv')}>
                    📊 Export Variables (CSV)
                  </Button>
                  <Button variant="outline-info" onClick={() => handleDownload(convertCollection(activeCollection, 'postman'), 'postman-collection.json')}>
                    📮 Export as Postman-Format
                  </Button>
                  <Button variant="outline-info" onClick={() => handleDownload(convertCollection(activeCollection, 'insomnia'), 'insomnia-export.json')}>
                    💤 Export as Insomnia-Format
                  </Button>
                  <Button variant="outline-info" onClick={() => handleDownload(convertCollection(activeCollection, 'env'), '.env')}>
                    🔐 Export as .env
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}

      {/* Bulk Operations Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>🔄 Bulk Operations</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6>Find & Replace</h6>
          <Form.Group className="mb-3">
            <Form.Label>Find</Form.Label>
            <Form.Control
              type="text"
              value={bulkFind}
              onChange={(e) => setBulkFind(e.target.value)}
              placeholder="Search term..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Replace With</Form.Label>
            <Form.Control
              type="text"
              value={bulkReplace}
              onChange={(e) => setBulkReplace(e.target.value)}
              placeholder="Replacement..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Scope</Form.Label>
            <Form.Select value={bulkScope} onChange={(e) => setBulkScope(e.target.value as SearchScope)}>
              <option value="all">All (Variables + Requests)</option>
              <option value="variables">Variables Only</option>
              <option value="requests">Requests Only</option>
            </Form.Select>
          </Form.Group>

          {replacePreview && (
            <Alert variant="info">
              ✅ Replaced {replacePreview.count} occurrence(s)
            </Alert>
          )}

          <hr />

          <h6>Import/Export Variables</h6>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" onClick={() => document.getElementById('import-vars')?.click()}>
              📥 Import Variables (JSON/CSV)
            </Button>
            <input
              id="import-vars"
              type="file"
              accept=".json,.csv"
              style={{ display: 'none' }}
              onChange={handleImportVariables}
            />
            <Button variant="outline-success" onClick={() => handleExportVariables('json')}>
              📤 Export Variables (JSON)
            </Button>
            <Button variant="outline-success" onClick={() => handleExportVariables('csv')}>
              📤 Export Variables (CSV)
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleBulkReplace} disabled={!bulkFind}>
            🔄 Apply Replace
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CollectionManager;
