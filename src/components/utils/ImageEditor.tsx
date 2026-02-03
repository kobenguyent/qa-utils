import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ButtonGroup } from 'react-bootstrap';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import imageCompression from 'browser-image-compression';

interface ImageState {
  file: File | null;
  preview: string | null;
  edited: string | null;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  flipH: boolean;
  flipV: boolean;
}

export const ImageEditor: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    preview: null,
    edited: null,
    rotation: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    flipH: false,
    flipV: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Apply filters to canvas
  const applyFilters = React.useCallback(() => {
    if (!imageState.preview || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size based on rotation
      const isRotated = imageState.rotation % 180 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state
      ctx.save();

      // Apply transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageState.rotation * Math.PI) / 180);
      ctx.scale(
        imageState.flipH ? -1 : 1,
        imageState.flipV ? -1 : 1
      );

      // Apply CSS filters
      const filters = [
        `brightness(${imageState.brightness}%)`,
        `contrast(${imageState.contrast}%)`,
        `saturate(${imageState.saturation}%)`,
        `blur(${imageState.blur}px)`,
        `grayscale(${imageState.grayscale}%)`,
        `sepia(${imageState.sepia}%)`,
      ];
      ctx.filter = filters.join(' ');

      // Draw image
      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

      // Restore context
      ctx.restore();

      // Update edited preview
      setImageState(prev => ({ ...prev, edited: canvas.toDataURL('image/png') }));
    };
    img.src = imageState.preview;
  }, [
    imageState.preview,
    imageState.rotation,
    imageState.brightness,
    imageState.contrast,
    imageState.saturation,
    imageState.blur,
    imageState.grayscale,
    imageState.sepia,
    imageState.flipH,
    imageState.flipV,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImageState({
          ...imageState,
          file,
          preview,
          edited: null,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = (degrees: number) => {
    setImageState(prev => ({ ...prev, rotation: (prev.rotation + degrees) % 360 }));
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (direction === 'horizontal') {
      setImageState(prev => ({ ...prev, flipH: !prev.flipH }));
    } else {
      setImageState(prev => ({ ...prev, flipV: !prev.flipV }));
    }
  };

  const handleReset = () => {
    setImageState(prev => ({
      ...prev,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      flipH: false,
      flipV: false,
    }));
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-${imageState.file?.name || 'image.png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const handleCompress = async () => {
    if (!imageState.file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(imageState.file, options);
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        setImageState(prev => ({
          ...prev,
          file: compressedFile,
          preview,
        }));
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Compression error:', error);
    }
  };

  const handleClear = () => {
    setImageState({
      file: null,
      preview: null,
      edited: null,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      flipH: false,
      flipV: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="h2 mb-2">🎨 Image Editor</h1>
          <p className="text-muted">
            Upload and edit your images with filters, rotations, and more
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload image"
                >
                  📁 Upload Image
                </Button>
                {imageState.preview && (
                  <>
                    <Button
                      variant="outline-secondary"
                      onClick={handleCompress}
                      aria-label="Compress image"
                    >
                      🗜️ Compress
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleReset}
                      aria-label="Reset all filters"
                    >
                      ↩️ Reset Filters
                    </Button>
                    <Button
                      variant="success"
                      onClick={handleDownload}
                      aria-label="Download edited image"
                    >
                      💾 Download
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={handleClear}
                      aria-label="Clear image"
                    >
                      🗑️ Clear
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {imageState.preview && (
        <>
          <Row className="mb-4">
            <Col lg={8}>
              <Card className="shadow-sm">
                <Card.Header>
                  <strong>Preview</strong>
                </Card.Header>
                <Card.Body style={{ minHeight: '400px', backgroundColor: '#f8f9fa' }}>
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={4}
                  >
                    <TransformComponent>
                      <div className="d-flex justify-content-center align-items-center">
                        {imageState.edited && (
                          <img
                            src={imageState.edited}
                            alt="Edited preview"
                            style={{ maxWidth: '100%', maxHeight: '500px' }}
                          />
                        )}
                      </div>
                    </TransformComponent>
                  </TransformWrapper>
                  <div className="text-center mt-2 text-muted small">
                    <em>Use mouse wheel to zoom, drag to pan</em>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm">
                <Card.Header>
                  <strong>Transform</strong>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <h6>Rotate</h6>
                    <ButtonGroup size="sm" className="w-100">
                      <Button variant="outline-primary" onClick={() => handleRotate(-90)}>
                        ↶ 90°
                      </Button>
                      <Button variant="outline-primary" onClick={() => handleRotate(90)}>
                        ↷ 90°
                      </Button>
                      <Button variant="outline-primary" onClick={() => handleRotate(180)}>
                        ↻ 180°
                      </Button>
                    </ButtonGroup>
                  </div>

                  <div className="mb-3">
                    <h6>Flip</h6>
                    <ButtonGroup size="sm" className="w-100">
                      <Button
                        variant="outline-primary"
                        onClick={() => handleFlip('horizontal')}
                      >
                        ⇄ Horizontal
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => handleFlip('vertical')}
                      >
                        ⇅ Vertical
                      </Button>
                    </ButtonGroup>
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm mt-3">
                <Card.Header>
                  <strong>Filters</strong>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Brightness: {imageState.brightness}%
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="200"
                        value={imageState.brightness}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, brightness: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Contrast: {imageState.contrast}%
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="200"
                        value={imageState.contrast}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, contrast: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Saturation: {imageState.saturation}%
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="200"
                        value={imageState.saturation}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, saturation: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Blur: {imageState.blur}px
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="10"
                        value={imageState.blur}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, blur: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Grayscale: {imageState.grayscale}%
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="100"
                        value={imageState.grayscale}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, grayscale: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Sepia: {imageState.sepia}%
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="100"
                        value={imageState.sepia}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, sepia: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}

      {!imageState.preview && (
        <Row>
          <Col>
            <Card className="shadow-sm text-center" style={{ minHeight: '300px' }}>
              <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <div className="mb-4" style={{ fontSize: '4rem' }}>
                  🖼️
                </div>
                <h4>No Image Selected</h4>
                <p className="text-muted">
                  Upload an image to start editing
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Upload Image
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ImageEditor;
