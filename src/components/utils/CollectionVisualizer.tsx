/**
 * Collection Visualizer - Visualize REST API collections as interactive trees
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Container,
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Row,
  Col,
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
      <h2 className="mb-1">🗺️ Collection Visualizer</h2>
      <p className="text-muted mb-4">
        Upload a Postman, Insomnia, or Thunder Client collection and explore the full structure of
        your API requests and folders interactively.
      </p>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} aria-live="assertive">
          {error}
        </Alert>
      )}

      {!collection && (
        <Row className="g-3">
          {/* File upload */}
          <Col xs={12} md={6}>
            <Card className="h-100">
              <Card.Header>📁 Upload Collection File</Card.Header>
              <Card.Body className="d-flex flex-column justify-content-center align-items-center gap-3 py-4">
                <p className="text-muted text-center mb-0">
                  Supports Postman v2.1, Insomnia, and Thunder Client JSON exports.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="d-none"
                  onChange={handleFileUpload}
                  aria-label="Upload collection file"
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose collection file to upload"
                >
                  📂 Choose File
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* JSON paste */}
          <Col xs={12} md={6}>
            <Card className="h-100">
              <Card.Header>📋 Paste JSON</Card.Header>
              <Card.Body className="d-flex flex-column gap-2">
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder="Paste your collection JSON here..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  aria-label="Collection JSON input"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                />
                <Button
                  variant="success"
                  onClick={handleParseJson}
                  disabled={!jsonInput.trim()}
                  aria-label="Visualize pasted JSON"
                >
                  🔍 Visualize
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {collection && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="fw-bold fs-5 me-2">{collection.name}</span>
              <Badge bg="light" text="dark" className="me-1">
                {collection.sourceFormat}
              </Badge>
              {collection.version && collection.version !== '0.0.0' && (
                <Badge bg="light" text="dark">
                  v{collection.version}
                </Badge>
              )}
            </div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleClear}
              aria-label="Load a different collection"
            >
              🔄 Load Another
            </Button>
          </Card.Header>

          {collection.description && (
            <Card.Body className="py-2 border-bottom">
              <p className="text-muted small mb-0">{collection.description}</p>
            </Card.Body>
          )}

          <Card.Body>
            <CollectionTree collection={collection} onSelect={setSelectedRequest} />
          </Card.Body>
        </Card>
      )}

      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </Container>
  );
};

export default CollectionVisualizer;
