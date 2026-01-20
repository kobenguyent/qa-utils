import React, { useState, useCallback, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, ProgressBar, Badge, Tab, Tabs, ListGroup } from 'react-bootstrap';
import { FileProcessor as FP, ProcessedFile, ImageProcessingOptions, DocumentProcessingOptions } from '../../utils/fileProcessor';

interface QueueItem {
  id: string;
  file: File;
  options: ImageProcessingOptions | DocumentProcessingOptions;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: ProcessedFile;
  error?: string;
}

const FileProcessor: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processQueue, setProcessQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedFiles, setStoredFiles] = useState<ProcessedFile[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  
  const [imageOptions, setImageOptions] = useState<ImageProcessingOptions>({
    width: 800,
    height: 600,
    quality: 0.8,
    format: 'jpeg',
    maintainAspectRatio: true,
    compress: true,
    brightness: 50,
    contrast: 50,
    saturation: 50,
    filter: 'none',
    filterIntensity: 100,
    watermarkText: 'WATERMARK',
    rotate: 0
  });
  
  const [docOptions, setDocOptions] = useState<DocumentProcessingOptions>({
    compress: true,
    optimize: true,
    quality: 0.8
  });

  // Load stored files on component mount
  useEffect(() => {
    loadStoredFiles();
  }, []);

  const loadStoredFiles = async () => {
    try {
      const files = await FP.getStoredFiles();
      setStoredFiles(files);
    } catch (err) {
      console.error('Failed to load stored files:', err);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
      
      // Auto-suggest optimal settings for first file
      const analysis = FP.analyzeFile(files[0]);
      if (analysis.type === 'image' && analysis.recommendations) {
        setImageOptions(prev => ({
          ...prev,
          ...analysis.recommendations
        }));
      }
      
      // Create queue items
      const queueItems: QueueItem[] = files.map(file => {
        const analysis = FP.analyzeFile(file);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          options: analysis.type === 'image' ? { ...imageOptions, ...analysis.recommendations } : { ...docOptions, ...analysis.recommendations },
          status: 'pending'
        };
      });
      
      setProcessQueue(queueItems);
    }
  }, [imageOptions, docOptions]);

  const processAllFiles = async () => {
    setProcessing(true);
    setError(null);

    const updatedQueue = [...processQueue];
    
    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      item.status = 'processing';
      setProcessQueue([...updatedQueue]);

      try {
        const analysis = FP.analyzeFile(item.file);
        let result: ProcessedFile;
        
        // Use current options, not the ones from when file was added
        // Give user settings priority over analysis recommendations
        const currentOptions = analysis.type === 'image' 
          ? { ...analysis.recommendations, ...imageOptions } 
          : { ...analysis.recommendations, ...docOptions };

        if (analysis.type === 'image') {
          result = await FP.processImage(item.file, currentOptions as ImageProcessingOptions);
        } else if (analysis.type === 'document') {
          result = await FP.processDocument(item.file, currentOptions as DocumentProcessingOptions);
        } else {
          throw new Error('Unsupported file type');
        }

        item.result = result;
        item.status = 'completed';
        
        // Auto-save to storage (don't fail processing if storage fails)
        try {
          await FP.saveToStorage(result);
          console.log('File saved to storage successfully');
        } catch (storageErr) {
          console.warn('Failed to save to storage:', storageErr);
        }
        
      } catch (err) {
        item.error = err instanceof Error ? err.message : 'Processing failed';
        item.status = 'error';
      }
      
      setProcessQueue([...updatedQueue]);
    }

    setProcessing(false);
    await loadStoredFiles();
  };

  const downloadFile = (processedFile: ProcessedFile) => {
    FP.downloadFile(processedFile);
  };

  const deleteStoredFile = async (id: string) => {
    try {
      await FP.deleteStoredFile(id);
      await loadStoredFiles();
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const getFileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document')) return 'document';
    return 'text';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: QueueItem['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'warning',
      completed: 'success',
      error: 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="container mt-4">
      <h2>📁 File Processor</h2>
      <p className="text-muted">
        Professional file processing with batch operations, smart optimization, and browser storage.
      </p>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'upload')} className="mb-3">
        <Tab eventKey="upload" title="📤 Upload & Process">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Batch Upload</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Files</Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                    />
                    <Form.Text className="text-muted">
                      Select multiple files for batch processing
                    </Form.Text>
                  </Form.Group>

                  {selectedFiles.length > 0 && (
                    <div className="mb-3">
                      <h6>Selected Files ({selectedFiles.length})</h6>
                      {selectedFiles.slice(0, 3).map((file, index) => (
                        <p key={index} className="mb-1">
                          <Badge bg="info" className="me-2">{getFileType(file)}</Badge>
                          {file.name} ({formatFileSize(file.size)})
                        </p>
                      ))}
                      {selectedFiles.length > 3 && (
                        <p className="text-muted">...and {selectedFiles.length - 3} more files</p>
                      )}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={processAllFiles}
                    disabled={selectedFiles.length === 0 || processing}
                    className="w-100"
                  >
                    {processing ? 'Processing...' : `Process ${selectedFiles.length} Files`}
                  </Button>

                  {processing && (
                    <ProgressBar animated now={100} className="mt-2" />
                  )}

                  {error && (
                    <Alert variant="danger" className="mt-3">
                      {error}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              {processQueue.length > 0 && (
                <Card>
                  <Card.Header>
                    <h5>Processing Queue</h5>
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <ListGroup variant="flush">
                      {processQueue.map((item) => (
                        <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">{item.file.name}</div>
                            <small className="text-muted">{formatFileSize(item.file.size)}</small>
                          </div>
                          <div className="text-end">
                            {getStatusBadge(item.status)}
                            {item.result && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                className="ms-2"
                                onClick={() => downloadFile(item.result!)}
                              >
                                Download
                              </Button>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="storage" title="💾 Stored Files">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Browser Storage ({storedFiles.length} files)</h5>
              <Button variant="outline-primary" size="sm" onClick={loadStoredFiles}>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {storedFiles.length === 0 ? (
                <p className="text-muted text-center">No files stored yet. Process some files to see them here.</p>
              ) : (
                <Row>
                  {storedFiles.map((file) => (
                    <Col md={6} lg={4} key={file.id} className="mb-3">
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="card-title">{file.name}</h6>
                          <p className="card-text">
                            <small className="text-muted">
                              {formatFileSize(file.originalSize)} → {formatFileSize(file.processedSize)}
                              <br />
                              {new Date(file.timestamp).toLocaleDateString()}
                            </small>
                          </p>
                          <div className="mb-2">
                            {file.operations.map((op, index) => (
                              <Badge key={index} bg="info" className="me-1 mb-1" style={{ fontSize: '0.7em' }}>
                                {op}
                              </Badge>
                            ))}
                          </div>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="success" onClick={() => downloadFile(file)}>
                              Download
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => deleteStoredFile(file.id)}>
                              Delete
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="advanced" title="⚙️ Advanced Options">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Image Processing Options</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Width</Form.Label>
                        <Form.Control
                          type="number"
                          value={imageOptions.width || ''}
                          onChange={(e) => setImageOptions(prev => ({
                            ...prev,
                            width: parseInt(e.target.value) || undefined
                          }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Height</Form.Label>
                        <Form.Control
                          type="number"
                          value={imageOptions.height || ''}
                          onChange={(e) => setImageOptions(prev => ({
                            ...prev,
                            height: parseInt(e.target.value) || undefined
                          }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label="Enable Compression"
                      checked={imageOptions.compress || false}
                      onChange={(e) => setImageOptions(prev => ({
                        ...prev,
                        compress: e.target.checked
                      }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label="Maintain Aspect Ratio"
                      checked={imageOptions.maintainAspectRatio !== false}
                      onChange={(e) => setImageOptions(prev => ({
                        ...prev,
                        maintainAspectRatio: e.target.checked
                      }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Quality: {imageOptions.quality}</Form.Label>
                    <Form.Range
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={imageOptions.quality}
                      onChange={(e) => setImageOptions(prev => ({
                        ...prev,
                        quality: parseFloat(e.target.value)
                      }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Brightness: {imageOptions.brightness}</Form.Label>
                    <Form.Range
                      min={0}
                      max={100}
                      value={imageOptions.brightness}
                      onChange={(e) => setImageOptions(prev => ({
                        ...prev,
                        brightness: parseInt(e.target.value)
                      }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Filter</Form.Label>
                    <Form.Select
                      value={imageOptions.filter}
                      onChange={(e) => setImageOptions(prev => ({
                        ...prev,
                        filter: e.target.value as any
                      }))}
                    >
                      <option value="none">None</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="sepia">Sepia</option>
                      <option value="blur">Blur</option>
                      <option value="sharpen">Sharpen</option>
                      <option value="invert">Invert</option>
                      <option value="hue-rotate">Hue Rotate</option>
                      <option value="saturate">Saturate</option>
                      <option value="brightness-filter">Brightness Filter</option>
                      <option value="contrast-filter">Contrast Filter</option>
                      <option value="watermark">Watermark</option>
                      <option value="censor">Censor (Blur)</option>
                    </Form.Select>
                  </Form.Group>

                  {imageOptions.filter !== 'none' && (
                    <Form.Group className="mb-2">
                      <Form.Label>
                        {imageOptions.filter === 'watermark' ? 'Font Size' : 
                         imageOptions.filter === 'censor' ? 'Blur Intensity' : 'Filter Intensity'}: {imageOptions.filterIntensity}
                      </Form.Label>
                      <Form.Range
                        min={imageOptions.filter === 'watermark' ? 12 : 0}
                        max={imageOptions.filter === 'blur' || imageOptions.filter === 'censor' ? 20 : 
                             imageOptions.filter === 'hue-rotate' ? 360 : 
                             imageOptions.filter === 'watermark' ? 72 : 200}
                        step={imageOptions.filter === 'blur' || imageOptions.filter === 'censor' ? 1 : 
                              imageOptions.filter === 'hue-rotate' ? 10 : 
                              imageOptions.filter === 'watermark' ? 2 : 10}
                        value={imageOptions.filterIntensity}
                        onChange={(e) => setImageOptions(prev => ({
                          ...prev,
                          filterIntensity: parseFloat(e.target.value)
                        }))}
                      />
                    </Form.Group>
                  )}

                  {imageOptions.filter === 'watermark' && (
                    <Form.Group className="mb-2">
                      <Form.Label>Watermark Text</Form.Label>
                      <Form.Control
                        type="text"
                        value={imageOptions.watermarkText}
                        onChange={(e) => setImageOptions(prev => ({
                          ...prev,
                          watermarkText: e.target.value
                        }))}
                        placeholder="Enter watermark text"
                      />
                    </Form.Group>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Document Processing Options</h5>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-3">
                    <small>
                      <strong>PDF Compression Limitations:</strong><br/>
                      • Text-only PDFs: Small reduction possible<br/>
                      • Image-heavy PDFs: Minimal compression<br/>
                      • For significant compression, use dedicated PDF tools
                    </small>
                  </Alert>
                  
                  <Form.Check
                    type="checkbox"
                    label="Compress document"
                    title="Limited compression - PDFs with images may not reduce significantly"
                    checked={docOptions.compress}
                    onChange={(e) => setDocOptions(prev => ({
                      ...prev,
                      compress: e.target.checked
                    }))}
                  />

                  <Form.Check
                    type="checkbox"
                    label="Optimize document"
                    title="Basic PDF optimization - removes unnecessary metadata"
                    checked={docOptions.optimize}
                    onChange={(e) => setDocOptions(prev => ({
                      ...prev,
                      optimize: e.target.checked
                    }))}
                  />
                  
                  <Form.Group className="mt-3">
                    <Form.Label>Quality: {docOptions.quality}</Form.Label>
                    <Form.Range
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={docOptions.quality}
                      onChange={(e) => setDocOptions(prev => ({
                        ...prev,
                        quality: parseFloat(e.target.value)
                      }))}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default FileProcessor;
