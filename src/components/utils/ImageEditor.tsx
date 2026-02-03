import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ButtonGroup } from 'react-bootstrap';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import imageCompression from 'browser-image-compression';

// Helper function to apply pixelation effect
const applyPixelation = (ctx: CanvasRenderingContext2D, width: number, height: number, pixelSize: number) => {
  if (pixelSize <= 0) return;
  
  const size = Math.max(2, Math.floor(pixelSize / 2));
  const imageData = ctx.getImageData(0, 0, width, height);
  
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      // Get the pixel color at this position
      const pixelIndex = (y * width + x) * 4;
      const red = imageData.data[pixelIndex];
      const green = imageData.data[pixelIndex + 1];
      const blue = imageData.data[pixelIndex + 2];
      const alpha = imageData.data[pixelIndex + 3];
      
      // Fill the block with this color
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
      ctx.fillRect(x, y, size, size);
    }
  }
};

// Helper function to apply regional effects
const applyRegionalEffect = (
  ctx: CanvasRenderingContext2D, 
  effect: RegionalEffect
) => {
  const { x, y, width, height, type, intensity } = effect;
  
  // Get the region data
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  
  switch (type) {
    case 'blur': {
      // Apply blur by averaging neighboring pixels
      ctx.save();
      ctx.filter = `blur(${intensity}px)`;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0);
        ctx.filter = `blur(${intensity}px)`;
        ctx.drawImage(tempCanvas, x, y);
      }
      ctx.restore();
      break;
    }
      
    case 'pixelate': {
      // Apply pixelation to the region
      const pixelSize = Math.max(2, Math.floor(intensity));
      for (let py = 0; py < height; py += pixelSize) {
        for (let px = 0; px < width; px += pixelSize) {
          const pixelIndex = (py * width + px) * 4;
          const red = data[pixelIndex];
          const green = data[pixelIndex + 1];
          const blue = data[pixelIndex + 2];
          const alpha = data[pixelIndex + 3];
          
          ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
          ctx.fillRect(x + px, y + py, pixelSize, pixelSize);
        }
      }
      break;
    }
      
    case 'brighten': {
      // Brighten the region
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + intensity);     // Red
        data[i + 1] = Math.min(255, data[i + 1] + intensity); // Green
        data[i + 2] = Math.min(255, data[i + 2] + intensity); // Blue
      }
      ctx.putImageData(imageData, x, y);
      break;
    }
      
    case 'darken': {
      // Darken the region
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] - intensity);     // Red
        data[i + 1] = Math.max(0, data[i + 1] - intensity); // Green
        data[i + 2] = Math.max(0, data[i + 2] - intensity); // Blue
      }
      ctx.putImageData(imageData, x, y);
      break;
    }
  }
};

interface RegionalEffect {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'blur' | 'pixelate' | 'brighten' | 'darken';
  intensity: number;
}

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
  pixelate: number;
  regionalEffects: RegionalEffect[];
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
    pixelate: 0,
    regionalEffects: [],
  });

  const [drawingMode, setDrawingMode] = useState<'none' | 'blur' | 'pixelate' | 'brighten' | 'darken'>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

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

      // Apply pixelation effect if enabled
      if (imageState.pixelate > 0) {
        applyPixelation(ctx, canvas.width, canvas.height, imageState.pixelate);
      }

      // Apply regional effects
      imageState.regionalEffects.forEach(effect => {
        applyRegionalEffect(ctx, effect);
      });

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
    imageState.pixelate,
    imageState.regionalEffects,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Sync drawing canvas with edited image when switching to drawing mode
  useEffect(() => {
    if (drawingMode !== 'none' && imageState.edited && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        img.src = imageState.edited;
      }
    }
  }, [drawingMode, imageState.edited]);

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
      pixelate: 0,
      regionalEffects: [],
    }));
    setDrawingMode('none');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'none' || !drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get mouse position relative to canvas and scale to actual coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get mouse position relative to canvas and scale to actual coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Draw a preview rectangle
    const ctx = canvas.getContext('2d');
    if (ctx && imageState.edited) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Draw selection rectangle
        ctx.strokeStyle = drawingMode === 'blur' || drawingMode === 'pixelate' ? '#ff0000' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          x - startPoint.x,
          y - startPoint.y
        );
      };
      img.src = imageState.edited;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get mouse position relative to canvas and scale to actual coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);
    const effectX = Math.min(startPoint.x, x);
    const effectY = Math.min(startPoint.y, y);
    
    if (width > 10 && height > 10) {
      const newEffect: RegionalEffect = {
        x: effectX,
        y: effectY,
        width,
        height,
        type: drawingMode as 'blur' | 'pixelate' | 'brighten' | 'darken',
        intensity: drawingMode === 'blur' ? 10 : drawingMode === 'pixelate' ? 10 : 50,
      };
      
      setImageState(prev => ({
        ...prev,
        regionalEffects: [...prev.regionalEffects, newEffect],
      }));
    }
    
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleClearRegionalEffects = () => {
    setImageState(prev => ({ ...prev, regionalEffects: [] }));
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
      pixelate: 0,
      regionalEffects: [],
    });
    setDrawingMode('none');
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
                <Card.Body style={{ minHeight: '400px', backgroundColor: '#f8f9fa', position: 'relative' }}>
                  {drawingMode === 'none' ? (
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
                  ) : (
                    <div className="d-flex justify-content-center align-items-center" style={{ position: 'relative' }}>
                      <canvas
                        ref={drawingCanvasRef}
                        width={canvasRef.current?.width || 800}
                        height={canvasRef.current?.height || 600}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          cursor: (drawingMode === 'blur' || drawingMode === 'pixelate' || drawingMode === 'brighten' || drawingMode === 'darken') ? 'crosshair' : 'default',
                          border: '2px solid #007bff'
                        }}
                      />
                    </div>
                  )}
                  <div className="text-center mt-2 text-muted small">
                    <em>
                      {drawingMode === 'none' 
                        ? 'Use mouse wheel to zoom, drag to pan' 
                        : 'Click and drag to select a region'}
                    </em>
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

                    <Form.Group className="mb-3">
                      <Form.Label className="small">
                        Pixelate: {imageState.pixelate}
                      </Form.Label>
                      <Form.Range
                        min="0"
                        max="20"
                        value={imageState.pixelate}
                        onChange={(e) =>
                          setImageState(prev => ({ ...prev, pixelate: parseInt(e.target.value) }))
                        }
                      />
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>

              <Card className="shadow-sm mt-3">
                <Card.Header>
                  <strong>Censorship & Regional Effects</strong>
                </Card.Header>
                <Card.Body>
                  <p className="small text-muted mb-2">
                    Select a tool and draw on the image to apply effects to specific regions
                  </p>
                  <ButtonGroup size="sm" className="w-100 mb-2">
                    <Button
                      variant={drawingMode === 'blur' ? 'primary' : 'outline-primary'}
                      onClick={() => setDrawingMode(drawingMode === 'blur' ? 'none' : 'blur')}
                    >
                      🌫️ Blur Region
                    </Button>
                    <Button
                      variant={drawingMode === 'pixelate' ? 'primary' : 'outline-primary'}
                      onClick={() => setDrawingMode(drawingMode === 'pixelate' ? 'none' : 'pixelate')}
                    >
                      ▦ Pixelate Region
                    </Button>
                  </ButtonGroup>
                  <ButtonGroup size="sm" className="w-100 mb-3">
                    <Button
                      variant={drawingMode === 'brighten' ? 'primary' : 'outline-primary'}
                      onClick={() => setDrawingMode(drawingMode === 'brighten' ? 'none' : 'brighten')}
                    >
                      ☀️ Brighten
                    </Button>
                    <Button
                      variant={drawingMode === 'darken' ? 'primary' : 'outline-primary'}
                      onClick={() => setDrawingMode(drawingMode === 'darken' ? 'none' : 'darken')}
                    >
                      🌙 Darken
                    </Button>
                  </ButtonGroup>
                  {imageState.regionalEffects.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted">
                        {imageState.regionalEffects.length} region(s) applied
                      </small>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="w-100 mt-2"
                        onClick={handleClearRegionalEffects}
                      >
                        Clear All Regions
                      </Button>
                    </div>
                  )}
                  {drawingMode !== 'none' && (
                    <div className="alert alert-info small p-2 mt-2">
                      <strong>Active:</strong> Draw a rectangle on the image to apply {drawingMode}
                    </div>
                  )}
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
