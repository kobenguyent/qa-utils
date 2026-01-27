import React, { useState, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Tabs, Tab, ProgressBar, ListGroup } from 'react-bootstrap';
import { MediaConverter as MC, ConvertedFile, ImageFormat } from '../../utils/mediaConverter';

interface FileWithPreview {
    file: File;
    preview: string;
    id: string;
}

const MediaConverter: React.FC = () => {
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('image-to-pdf');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image to PDF options
    const [pdfOptions, setPdfOptions] = useState({
        pageSize: 'A4' as 'A4' | 'Letter' | 'Legal' | 'fit',
        margin: 40,
        title: 'Converted Document',
        quality: 0.92
    });

    // PDF to Image options
    const [extractOptions, setExtractOptions] = useState({
        format: 'png' as ImageFormat,
        scale: 2,
        quality: 0.92
    });

    // Format conversion options
    const [formatOptions, setFormatOptions] = useState({
        targetFormat: 'jpeg' as ImageFormat,
        quality: 0.92,
        width: undefined as number | undefined,
        height: undefined as number | undefined,
        maintainAspectRatio: true
    });

    // Background removal options
    const [bgRemovalOptions, setBgRemovalOptions] = useState({
        outputFormat: 'png' as 'png' | 'webp',
        model: 'isnet' as 'isnet' | 'isnet_fp16' | 'isnet_quint8',
        quality: 0.92
    });

    // Progress for long-running operations
    const [progress, setProgress] = useState(0);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setError(null);
        setSuccess(null);
        setConvertedFiles([]);

        const filesWithPreview = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: `${Date.now()}-${Math.random()}`
        }));

        setSelectedFiles(filesWithPreview);
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        setError(null);
        setSuccess(null);
        setConvertedFiles([]);

        const filesWithPreview = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: `${Date.now()}-${Math.random()}`
        }));

        setSelectedFiles(filesWithPreview);
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    }, []);

    const removeFile = useCallback((id: string) => {
        setSelectedFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const clearAll = useCallback(() => {
        selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
        setSelectedFiles([]);
        setConvertedFiles([]);
        setError(null);
        setSuccess(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [selectedFiles]);

    // Image to PDF conversion
    const convertImagesToPdf = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image file');
            return;
        }

        setConverting(true);
        setError(null);
        setSuccess(null);

        try {
            const files = selectedFiles.map(f => f.file);
            const result = await MC.imagesToPdf(files, pdfOptions);
            setConvertedFiles([result]);
            setSuccess(`Successfully created PDF with ${files.length} page(s)`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Conversion failed');
        } finally {
            setConverting(false);
        }
    };

    // PDF to Images conversion
    const convertPdfToImages = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select a PDF file');
            return;
        }

        const pdfFile = selectedFiles[0]?.file;
        if (!pdfFile || !pdfFile.name.toLowerCase().endsWith('.pdf')) {
            setError('Please select a valid PDF file');
            return;
        }

        setConverting(true);
        setError(null);
        setSuccess(null);

        try {
            const results = await MC.pdfToImages(pdfFile, extractOptions);
            setConvertedFiles(results);
            setSuccess(`Successfully extracted ${results.length} image(s) from PDF`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Extraction failed');
        } finally {
            setConverting(false);
        }
    };

    // Format conversion
    const convertFormat = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image file');
            return;
        }

        setConverting(true);
        setError(null);
        setSuccess(null);

        try {
            const files = selectedFiles.map(f => f.file);
            const results = await MC.batchConvertImages(files, formatOptions.targetFormat, {
                quality: formatOptions.quality,
                width: formatOptions.width,
                height: formatOptions.height,
                maintainAspectRatio: formatOptions.maintainAspectRatio
            });
            setConvertedFiles(results);
            setSuccess(`Successfully converted ${results.length} file(s) to ${formatOptions.targetFormat.toUpperCase()}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Conversion failed');
        } finally {
            setConverting(false);
        }
    };

    const downloadFile = (file: ConvertedFile) => {
        MC.downloadFile(file);
    };

    const downloadAll = () => {
        MC.downloadMultipleFiles(convertedFiles);
    };

    const getAcceptedFormats = () => {
        switch (activeTab) {
            case 'image-to-pdf':
                return 'image/*';
            case 'pdf-to-image':
                return '.pdf';
            case 'format-convert':
                return 'image/*';
            case 'bg-removal':
                return 'image/*';
            default:
                return '*';
        }
    };

    // Background removal
    const removeBackground = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one image file');
            return;
        }

        setConverting(true);
        setError(null);
        setSuccess(null);
        setProgress(0);

        try {
            const files = selectedFiles.map(f => f.file);
            const results = await MC.batchRemoveBackground(files, {
                outputFormat: bgRemovalOptions.outputFormat,
                model: bgRemovalOptions.model,
                quality: bgRemovalOptions.quality,
                progress: (p) => setProgress(Math.round(p * 100))
            });
            setConvertedFiles(results);
            setSuccess(`Successfully removed background from ${results.length} image(s)`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Background removal failed');
        } finally {
            setConverting(false);
            setProgress(0);
        }
    };

    return (
        <Container className="py-4">
            <div className="text-center mb-4">
                <h1>🔄 Media Converter</h1>
                <p className="text-muted">
                    Convert between image formats and PDF documents
                </p>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => {
                    setActiveTab(k || 'image-to-pdf');
                    clearAll();
                }}
                className="mb-4"
            >
                {/* Image to PDF Tab */}
                <Tab eventKey="image-to-pdf" title="📄 Images → PDF">
                    <Row>
                        <Col md={8}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Upload Images</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div
                                        className="drop-zone p-5 text-center border-2 border-dashed rounded mb-3"
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        style={{
                                            backgroundColor: 'var(--input-bg)',
                                            borderColor: 'var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="mb-2">📁</div>
                                        <p className="mb-1">Drag & drop images here, or click to select</p>
                                        <small className="text-muted">Supports PNG, JPEG, WebP, GIF</small>
                                        <Form.Control
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept={getAcceptedFormats()}
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <Badge bg="info">{selectedFiles.length} file(s) selected</Badge>
                                                <Button variant="outline-danger" size="sm" onClick={clearAll}>
                                                    Clear All
                                                </Button>
                                            </div>
                                            <Row xs={2} md={4} className="g-2">
                                                {selectedFiles.map((f) => (
                                                    <Col key={f.id}>
                                                        <div className="position-relative">
                                                            <img
                                                                src={f.preview}
                                                                alt={f.file.name}
                                                                className="img-thumbnail w-100"
                                                                style={{ height: '100px', objectFit: 'cover' }}
                                                            />
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 p-1"
                                                                onClick={() => removeFile(f.id)}
                                                            >
                                                                ×
                                                            </Button>
                                                            <small className="d-block text-truncate">{f.file.name}</small>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-100"
                                disabled={selectedFiles.length === 0 || converting}
                                onClick={convertImagesToPdf}
                            >
                                {converting ? 'Converting...' : '📄 Convert to PDF'}
                            </Button>

                            {converting && <ProgressBar animated now={100} className="mt-2" />}
                        </Col>

                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">⚙️ Options</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Page Size</Form.Label>
                                        <Form.Select
                                            value={pdfOptions.pageSize}
                                            onChange={(e) => setPdfOptions(prev => ({
                                                ...prev,
                                                pageSize: e.target.value as typeof pdfOptions.pageSize
                                            }))}
                                        >
                                            <option value="A4">A4</option>
                                            <option value="Letter">Letter</option>
                                            <option value="Legal">Legal</option>
                                            <option value="fit">Fit to Image</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Document Title</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={pdfOptions.title}
                                            onChange={(e) => setPdfOptions(prev => ({
                                                ...prev,
                                                title: e.target.value
                                            }))}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Quality: {Math.round(pdfOptions.quality * 100)}%</Form.Label>
                                        <Form.Range
                                            min={0.1}
                                            max={1}
                                            step={0.05}
                                            value={pdfOptions.quality}
                                            onChange={(e) => setPdfOptions(prev => ({
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

                {/* PDF to Images Tab */}
                <Tab eventKey="pdf-to-image" title="🖼️ PDF → Images">
                    <Row>
                        <Col md={8}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Upload PDF</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div
                                        className="drop-zone p-5 text-center border-2 border-dashed rounded mb-3"
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        style={{
                                            backgroundColor: 'var(--input-bg)',
                                            borderColor: 'var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="mb-2">📄</div>
                                        <p className="mb-1">Drag & drop a PDF file here, or click to select</p>
                                        <small className="text-muted">Only PDF files supported</small>
                                        <Form.Control
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <Badge bg="info" className="me-2">📄 {selectedFiles[0].file.name}</Badge>
                                                <small className="text-muted">
                                                    {MC.formatFileSize(selectedFiles[0].file.size)}
                                                </small>
                                            </div>
                                            <Button variant="outline-danger" size="sm" onClick={clearAll}>
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-100"
                                disabled={selectedFiles.length === 0 || converting}
                                onClick={convertPdfToImages}
                            >
                                {converting ? 'Extracting...' : '🖼️ Extract Images'}
                            </Button>

                            {converting && <ProgressBar animated now={100} className="mt-2" />}
                        </Col>

                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">⚙️ Options</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Output Format</Form.Label>
                                        <Form.Select
                                            value={extractOptions.format}
                                            onChange={(e) => setExtractOptions(prev => ({
                                                ...prev,
                                                format: e.target.value as ImageFormat
                                            }))}
                                        >
                                            <option value="png">PNG (Best quality)</option>
                                            <option value="jpeg">JPEG (Smaller size)</option>
                                            <option value="webp">WebP (Modern format)</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Scale: {extractOptions.scale}x</Form.Label>
                                        <Form.Range
                                            min={1}
                                            max={4}
                                            step={0.5}
                                            value={extractOptions.scale}
                                            onChange={(e) => setExtractOptions(prev => ({
                                                ...prev,
                                                scale: parseFloat(e.target.value)
                                            }))}
                                        />
                                        <Form.Text className="text-muted">
                                            Higher scale = better quality but larger files
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Quality: {Math.round(extractOptions.quality * 100)}%</Form.Label>
                                        <Form.Range
                                            min={0.1}
                                            max={1}
                                            step={0.05}
                                            value={extractOptions.quality}
                                            onChange={(e) => setExtractOptions(prev => ({
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

                {/* Format Conversion Tab */}
                <Tab eventKey="format-convert" title="🎨 Format Conversion">
                    <Row>
                        <Col md={8}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Upload Images</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div
                                        className="drop-zone p-5 text-center border-2 border-dashed rounded mb-3"
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        style={{
                                            backgroundColor: 'var(--input-bg)',
                                            borderColor: 'var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="mb-2">🖼️</div>
                                        <p className="mb-1">Drag & drop images here, or click to select</p>
                                        <small className="text-muted">Convert between PNG, JPEG, WebP, GIF, BMP</small>
                                        <Form.Control
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <Badge bg="info">{selectedFiles.length} file(s) selected</Badge>
                                                <Button variant="outline-danger" size="sm" onClick={clearAll}>
                                                    Clear All
                                                </Button>
                                            </div>
                                            <Row xs={2} md={4} className="g-2">
                                                {selectedFiles.map((f) => (
                                                    <Col key={f.id}>
                                                        <div className="position-relative">
                                                            <img
                                                                src={f.preview}
                                                                alt={f.file.name}
                                                                className="img-thumbnail w-100"
                                                                style={{ height: '100px', objectFit: 'cover' }}
                                                            />
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 p-1"
                                                                onClick={() => removeFile(f.id)}
                                                            >
                                                                ×
                                                            </Button>
                                                            <small className="d-block text-truncate">{f.file.name}</small>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-100"
                                disabled={selectedFiles.length === 0 || converting}
                                onClick={convertFormat}
                            >
                                {converting ? 'Converting...' : `🎨 Convert to ${formatOptions.targetFormat.toUpperCase()}`}
                            </Button>

                            {converting && <ProgressBar animated now={100} className="mt-2" />}
                        </Col>

                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">⚙️ Options</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Target Format</Form.Label>
                                        <Form.Select
                                            value={formatOptions.targetFormat}
                                            onChange={(e) => setFormatOptions(prev => ({
                                                ...prev,
                                                targetFormat: e.target.value as ImageFormat
                                            }))}
                                        >
                                            <option value="png">PNG (Lossless)</option>
                                            <option value="jpeg">JPEG (Lossy, small)</option>
                                            <option value="webp">WebP (Modern)</option>
                                            <option value="gif">GIF (Animation)</option>
                                            <option value="bmp">BMP (Uncompressed)</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Quality: {Math.round(formatOptions.quality * 100)}%</Form.Label>
                                        <Form.Range
                                            min={0.1}
                                            max={1}
                                            step={0.05}
                                            value={formatOptions.quality}
                                            onChange={(e) => setFormatOptions(prev => ({
                                                ...prev,
                                                quality: parseFloat(e.target.value)
                                            }))}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Width (optional)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Auto"
                                            value={formatOptions.width || ''}
                                            onChange={(e) => setFormatOptions(prev => ({
                                                ...prev,
                                                width: e.target.value ? parseInt(e.target.value) : undefined
                                            }))}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Height (optional)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Auto"
                                            value={formatOptions.height || ''}
                                            onChange={(e) => setFormatOptions(prev => ({
                                                ...prev,
                                                height: e.target.value ? parseInt(e.target.value) : undefined
                                            }))}
                                        />
                                    </Form.Group>

                                    <Form.Check
                                        type="checkbox"
                                        label="Maintain aspect ratio"
                                        checked={formatOptions.maintainAspectRatio}
                                        onChange={(e) => setFormatOptions(prev => ({
                                            ...prev,
                                            maintainAspectRatio: e.target.checked
                                        }))}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                {/* Background Removal Tab */}
                <Tab eventKey="bg-removal" title="✨ Background Removal">
                    <Row>
                        <Col md={8}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <h5 className="mb-0">Upload Images</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div
                                        className="drop-zone p-5 text-center border-2 border-dashed rounded mb-3"
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        style={{
                                            backgroundColor: 'var(--input-bg)',
                                            borderColor: 'var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="mb-2">✨</div>
                                        <p className="mb-1">Drag & drop images here, or click to select</p>
                                        <small className="text-muted">AI-powered background removal</small>
                                        <Form.Control
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <Badge bg="info">{selectedFiles.length} file(s) selected</Badge>
                                                <Button variant="outline-danger" size="sm" onClick={clearAll}>
                                                    Clear All
                                                </Button>
                                            </div>
                                            <Row xs={2} md={4} className="g-2">
                                                {selectedFiles.map((f) => (
                                                    <Col key={f.id}>
                                                        <div className="position-relative">
                                                            <img
                                                                src={f.preview}
                                                                alt={f.file.name}
                                                                className="img-thumbnail w-100"
                                                                style={{ height: '100px', objectFit: 'cover' }}
                                                            />
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="position-absolute top-0 end-0 p-1"
                                                                onClick={() => removeFile(f.id)}
                                                            >
                                                                ×
                                                            </Button>
                                                            <small className="d-block text-truncate">{f.file.name}</small>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-100"
                                disabled={selectedFiles.length === 0 || converting}
                                onClick={removeBackground}
                            >
                                {converting ? `Removing Background... ${progress}%` : '✨ Remove Background'}
                            </Button>

                            {converting && <ProgressBar animated now={progress || 100} className="mt-2" label={`${progress}%`} />}

                            <Alert variant="info" className="mt-3">
                                <small>
                                    <strong>Note:</strong> Background removal uses AI and may take 10-30 seconds per image.
                                    The first run downloads the AI model (~40MB) which is cached for future use.
                                </small>
                            </Alert>
                        </Col>

                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">⚙️ Options</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Output Format</Form.Label>
                                        <Form.Select
                                            value={bgRemovalOptions.outputFormat}
                                            onChange={(e) => setBgRemovalOptions(prev => ({
                                                ...prev,
                                                outputFormat: e.target.value as 'png' | 'webp'
                                            }))}
                                        >
                                            <option value="png">PNG (Transparent)</option>
                                            <option value="webp">WebP (Smaller size)</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Model Quality</Form.Label>
                                        <Form.Select
                                            value={bgRemovalOptions.model}
                                            onChange={(e) => setBgRemovalOptions(prev => ({
                                                ...prev,
                                                model: e.target.value as 'isnet' | 'isnet_fp16' | 'isnet_quint8'
                                            }))}
                                        >
                                            <option value="isnet">Standard (Best quality)</option>
                                            <option value="isnet_fp16">Fast (FP16)</option>
                                            <option value="isnet_quint8">Fastest (Quantized)</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            Faster models use less memory but may be slightly less accurate
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Quality: {Math.round(bgRemovalOptions.quality * 100)}%</Form.Label>
                                        <Form.Range
                                            min={0.1}
                                            max={1}
                                            step={0.05}
                                            value={bgRemovalOptions.quality}
                                            onChange={(e) => setBgRemovalOptions(prev => ({
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

            {/* Results Section */}
            {convertedFiles.length > 0 && (
                <Card className="mt-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">✅ Converted Files ({convertedFiles.length})</h5>
                        {convertedFiles.length > 1 && (
                            <Button variant="success" size="sm" onClick={downloadAll}>
                                📥 Download All
                            </Button>
                        )}
                    </Card.Header>
                    <Card.Body>
                        <ListGroup variant="flush">
                            {convertedFiles.map((file) => (
                                <ListGroup.Item
                                    key={file.id}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <div className="d-flex align-items-center">
                                        {file.preview && (
                                            <img
                                                src={file.preview}
                                                alt={file.name}
                                                className="me-3"
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        )}
                                        <div>
                                            <strong>{file.name}</strong>
                                            <div className="text-muted small">
                                                {MC.formatFileSize(file.originalSize)} → {MC.formatFileSize(file.convertedSize)}
                                                {file.originalSize > file.convertedSize && (
                                                    <Badge bg="success" className="ms-2">
                                                        {Math.round((1 - file.convertedSize / file.originalSize) * 100)}% smaller
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={() => downloadFile(file)}>
                                        📥 Download
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default MediaConverter;
