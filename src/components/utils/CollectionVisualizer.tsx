/**
 * Collection Visualizer - Visualize REST API collections as interactive trees
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Container,
  Button,
  Form,
  Badge,
  Modal,
} from 'react-bootstrap';
import { parseCollectionFromFile, parseCollection } from '../../utils/collectionParser';
import {
  UnifiedCollection,
  CollectionRequest,
  CollectionFolder,
  HttpMethod,
} from '../../utils/types/collectionTypes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<HttpMethod | string, string> = {
  GET: 'success',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'info',
  DELETE: 'danger',
  HEAD: 'secondary',
  OPTIONS: 'dark',
};

const getMethodColor = (method: string) => METHOD_COLORS[method.toUpperCase()] ?? 'secondary';

const countRequests = (folder: CollectionFolder): number =>
  folder.requests.length + folder.folders.reduce((sum, f) => sum + countRequests(f), 0);

const collectAllMethods = (
  collection: UnifiedCollection,
): Map<string, number> => {
  const counts = new Map<string, number>();
  const visit = (requests: CollectionRequest[]) => {
    requests.forEach((r) => {
      const m = r.method.toUpperCase();
      counts.set(m, (counts.get(m) ?? 0) + 1);
    });
  };
  const visitFolder = (folder: CollectionFolder) => {
    visit(folder.requests);
    folder.folders.forEach(visitFolder);
  };
  visit(collection.requests);
  collection.folders.forEach(visitFolder);
  return counts;
};

const totalRequestCount = (collection: UnifiedCollection): number => {
  const visitFolder = (f: CollectionFolder): number =>
    f.requests.length + f.folders.reduce((sum, sf) => sum + visitFolder(sf), 0);
  return collection.requests.length + collection.folders.reduce((sum, f) => sum + visitFolder(f), 0);
};

// ─── Request Detail Modal ─────────────────────────────────────────────────────

interface RequestDetailModalProps {
  request: CollectionRequest | null;
  onClose: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose }) => {
  if (!request) return null;
  return (
    <Modal show onHide={onClose} size="lg" aria-labelledby="request-detail-title">
      <Modal.Header closeButton>
        <Modal.Title id="request-detail-title">
          <Badge bg={getMethodColor(request.method)} className="me-2">
            {request.method}
          </Badge>
          {request.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">URL</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            readOnly
            value={request.url}
            aria-label="Request URL"
          />
        </Form.Group>

        {request.description && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              readOnly
              value={request.description}
              aria-label="Request description"
            />
          </Form.Group>
        )}

        {request.headers.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              Headers ({request.headers.filter((h) => h.enabled).length})
            </Form.Label>
            <div
              className="border rounded p-2"
              style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
            >
              {request.headers
                .filter((h) => h.enabled)
                .map((h, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-primary">{h.key}</span>:{' '}
                    <span>{h.value}</span>
                  </div>
                ))}
            </div>
          </Form.Group>
        )}

        {request.body && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Body</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              readOnly
              value={request.body}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              aria-label="Request body"
            />
          </Form.Group>
        )}

        {request.preRequestScript && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Pre-request Script</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              readOnly
              value={request.preRequestScript}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              aria-label="Pre-request script"
            />
          </Form.Group>
        )}

        {request.testScript && (
          <Form.Group>
            <Form.Label className="fw-bold">Test Script</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              readOnly
              value={request.testScript}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              aria-label="Test script"
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ─── Request Row ──────────────────────────────────────────────────────────────

interface RequestRowProps {
  request: CollectionRequest;
  depth: number;
  onSelect: (r: CollectionRequest) => void;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, depth, onSelect }) => (
  <button
    type="button"
    className="d-flex align-items-center w-100 text-start border-0 bg-transparent py-1 px-2 rounded collection-request-row"
    style={{ paddingLeft: `${depth * 20 + 8}px`, cursor: 'pointer' }}
    onClick={() => onSelect(request)}
    aria-label={`View details for ${request.method} ${request.name}`}
    title={request.url}
  >
    <Badge
      bg={getMethodColor(request.method)}
      className="me-2 flex-shrink-0"
      style={{ minWidth: '56px', textAlign: 'center', fontSize: '0.7rem' }}
    >
      {request.method}
    </Badge>
    <span className="text-truncate flex-grow-1" style={{ fontSize: '0.9rem' }}>
      {request.name}
    </span>
    {request.description && (
      <span className="text-muted ms-2 flex-shrink-0" style={{ fontSize: '0.75rem' }}>
        ℹ️
      </span>
    )}
  </button>
);

// ─── Folder Node ──────────────────────────────────────────────────────────────

interface FolderNodeProps {
  folder: CollectionFolder;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (r: CollectionRequest) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  depth,
  expandedIds,
  onToggle,
  onSelect,
}) => {
  const isOpen = expandedIds.has(folder.id);
  const requestCount = countRequests(folder);

  return (
    <div>
      <button
        type="button"
        className="d-flex align-items-center w-100 text-start border-0 bg-transparent py-1 px-2 rounded collection-folder-row"
        style={{ paddingLeft: `${depth * 20 + 4}px`, cursor: 'pointer', fontWeight: 600 }}
        onClick={() => onToggle(folder.id)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} folder ${folder.name}`}
      >
        <span className="me-1">{isOpen ? '📂' : '📁'}</span>
        <span className="flex-grow-1" style={{ fontSize: '0.9rem' }}>
          {folder.name}
        </span>
        <Badge bg="light" text="dark" className="ms-2 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
          {requestCount}
        </Badge>
      </button>

      {isOpen && (
        <div>
          {folder.folders.map((sub) => (
            <FolderNode
              key={sub.id}
              folder={sub}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
          {folder.requests.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Collection Tree ──────────────────────────────────────────────────────────

interface CollectionTreeProps {
  collection: UnifiedCollection;
  onSelect: (r: CollectionRequest) => void;
}

const CollectionTree: React.FC<CollectionTreeProps> = ({ collection, onSelect }) => {
  const allFolderIds = useCallback(() => {
    const ids: string[] = [];
    const visit = (folder: CollectionFolder) => {
      ids.push(folder.id);
      folder.folders.forEach(visit);
    };
    collection.folders.forEach(visit);
    return ids;
  }, [collection]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allFolderIds()));

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => setExpandedIds(new Set(allFolderIds()));
  const handleCollapseAll = () => setExpandedIds(new Set());

  const methodCounts = collectAllMethods(collection);
  const total = totalRequestCount(collection);

  return (
    <div>
      {/* Stats bar */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <span className="fw-bold me-1">📊 Stats:</span>
        <Badge bg="secondary" aria-label={`Total requests: ${total}`}>
          {total} requests
        </Badge>
        <Badge bg="secondary" aria-label={`Total folders: ${collection.folders.length}`}>
          {collection.folders.length} folders
        </Badge>
        {Array.from(methodCounts.entries()).map(([method, count]) => (
          <Badge key={method} bg={getMethodColor(method)} aria-label={`${method}: ${count}`}>
            {method} {count}
          </Badge>
        ))}
        <div className="ms-auto d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={handleExpandAll}
            aria-label="Expand all folders"
          >
            ↕ Expand All
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={handleCollapseAll}
            aria-label="Collapse all folders"
          >
            ↕ Collapse All
          </Button>
        </div>
      </div>

      {/* Root-level requests */}
      {collection.requests.map((req) => (
        <RequestRow key={req.id} request={req} depth={0} onSelect={onSelect} />
      ))}

      {/* Folders */}
      {collection.folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          onSelect={onSelect}
        />
      ))}

      {total === 0 && (
        <p className="text-muted text-center py-3">No requests found in this collection.</p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CollectionVisualizer: React.FC = () => {
  const [collection, setCollection] = useState<UnifiedCollection | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CollectionRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      const parsed = await parseCollectionFromFile(file);
      setCollection(parsed);
      setJsonInput('');
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleParseJson = () => {
    try {
      setError('');
      const data = JSON.parse(jsonInput.trim());
      const parsed = parseCollection(data);
      setCollection(parsed);
    } catch (err) {
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClear = () => {
    setCollection(null);
    setJsonInput('');
    setError('');
    setSelectedRequest(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Container className="py-4">
      {/* ── Header ── */}
      <div className="tool-header">
        <div className="tool-header-icon">🗺️</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Collection Visualizer</h1>
          <p className="tool-header-desc">Upload a Postman, Insomnia, or Thunder Client collection and explore its full structure interactively.</p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem', marginBottom: '1rem',
          color: '#f87171', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>×</button>
        </div>
      )}

      {!collection && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* File upload */}
          <div className="tool-card">
            <div className="tool-card-header">📁 Upload Collection File</div>
            <div className="tool-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
              <p style={{ color: 'var(--muted)', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>
                Supports Postman v2.1, Insomnia, and Thunder Client JSON exports.
              </p>
              <input ref={fileInputRef} type="file" accept=".json" className="d-none" onChange={handleFileUpload} aria-label="Upload collection file" />
              <Button size="sm" onClick={() => fileInputRef.current?.click()}
                style={{ background: 'var(--primary)', border: 'none', fontWeight: 600, padding: '0.45rem 1.4rem', borderRadius: 'var(--radius-md)' }}>
                📂 Choose File
              </Button>
            </div>
          </div>

          {/* JSON paste */}
          <div className="tool-card">
            <div className="tool-card-header">📋 Paste JSON</div>
            <div className="tool-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <textarea
                className="tool-textarea"
                rows={6}
                placeholder="Paste your collection JSON here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                aria-label="Collection JSON input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
              <Button size="sm" onClick={handleParseJson} disabled={!jsonInput.trim()}
                aria-label="Visualize pasted JSON"
                style={{ background: '#34d399', border: 'none', fontWeight: 600, padding: '0.45rem 1.4rem', borderRadius: 'var(--radius-md)', color: '#000' }}>
                🔍 Visualize
              </Button>
            </div>
          </div>
        </div>
      )}

      {collection && (
        <div className="tool-card">
          <div className="tool-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{collection.name}</span>
              <span style={{
                padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
                background: 'rgba(148,163,184,0.12)', color: 'var(--muted)',
              }}>{collection.sourceFormat}</span>
              {collection.version && collection.version !== '0.0.0' && (
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
                  background: 'rgba(148,163,184,0.12)', color: 'var(--muted)',
                }}>v{collection.version}</span>
              )}
            </div>
            <button onClick={handleClear}
              aria-label="Load a different collection"
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.7rem', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>
              🔄 Load Another
            </button>
          </div>

          {collection.description && (
            <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--muted)' }}>
              {collection.description}
            </div>
          )}

          <div className="tool-card-body">
            <CollectionTree collection={collection} onSelect={setSelectedRequest} />
          </div>
        </div>
      )}

      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </Container>
  );
};

export default CollectionVisualizer;
