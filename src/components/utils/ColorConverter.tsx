import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Form, Card, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { convertColor, ColorInput } from '../../utils/colorConverter';
import { generateAllPalettes, ColorPalette, exportPalette } from '../../utils/colorPalette';
import { analyzeAccessibility, simulateAllColorBlindness, AccessibilityAnalysis, ColorBlindnessSimulation } from '../../utils/colorAccessibility';
import { debounce } from '../../utils/helpers';
import CopyWithToast from '../CopyWithToast';

interface ColorInputs {
  hex: string;
  rgb: { r: string; g: string; b: string };
  hsl: { h: string; s: string; l: string };
  hsv: { h: string; s: string; v: string };
  cmyk: { c: string; m: string; y: string; k: string };
  lab: { l: string; a: string; b: string };
}

export const ColorConverter: React.FC = () => {
  const [inputs, setInputs] = useState<ColorInputs>({
    hex: '#ff0000',
    rgb: { r: '255', g: '0', b: '0' },
    hsl: { h: '0', s: '100', l: '50' },
    hsv: { h: '0', s: '100', v: '100' },
    cmyk: { c: '0', m: '100', y: '100', k: '0' },
    lab: { l: '53', a: '80', b: '67' }
  });

  const [error, setError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [accessibility, setAccessibility] = useState<AccessibilityAnalysis | null>(null);
  const [colorBlindness, setColorBlindness] = useState<ColorBlindnessSimulation | null>(null);
  const [backgroundHex, setBackgroundHex] = useState<string>('#ffffff');

  const updateAllFormats = useCallback((sourceFormat: string, value: ColorInput) => {
    if (isUpdating) return;
    
    try {
      setError('');
      const converted = convertColor(value, 2);
      setIsUpdating(true);

      setInputs(prev => ({
        hex: sourceFormat === 'hex' ? prev.hex : converted.hex,
        rgb: sourceFormat === 'rgb' ? prev.rgb : {
          r: converted.rgb.r.toString(),
          g: converted.rgb.g.toString(),
          b: converted.rgb.b.toString()
        },
        hsl: sourceFormat === 'hsl' ? prev.hsl : {
          h: converted.hsl.h.toString(),
          s: converted.hsl.s.toString(),
          l: converted.hsl.l.toString()
        },
        hsv: sourceFormat === 'hsv' ? prev.hsv : {
          h: converted.hsv.h.toString(),
          s: converted.hsv.s.toString(),
          v: converted.hsv.v.toString()
        },
        cmyk: sourceFormat === 'cmyk' ? prev.cmyk : {
          c: converted.cmyk.c.toString(),
          m: converted.cmyk.m.toString(),
          y: converted.cmyk.y.toString(),
          k: converted.cmyk.k.toString()
        },
        lab: sourceFormat === 'lab' ? prev.lab : {
          l: converted.lab.l.toString(),
          a: converted.lab.a.toString(),
          b: converted.lab.b.toString()
        }
      }));
      
      // Generate palettes and accessibility analysis
      setPalettes(generateAllPalettes(value));
      setAccessibility(analyzeAccessibility(value, backgroundHex));
      setColorBlindness(simulateAllColorBlindness(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion error');
    } finally {
      setTimeout(() => setIsUpdating(false), 100);
    }
  }, [isUpdating]);

  const debouncedUpdate = useCallback(
    debounce((...args: unknown[]) => {
      const [format, value] = args as [string, ColorInput];
      updateAllFormats(format, value);
    }, 300),
    [updateAllFormats]
  );

  const handleHexChange = (value: string) => {
    setInputs(prev => ({ ...prev, hex: value }));
    if (value.length >= 4) {
      debouncedUpdate('hex', value);
    }
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: string) => {
    const newRgb = { ...inputs.rgb, [component]: value };
    setInputs(prev => ({ ...prev, rgb: newRgb }));
    
    const r = parseFloat(newRgb.r) || 0;
    const g = parseFloat(newRgb.g) || 0;
    const b = parseFloat(newRgb.b) || 0;
    
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      debouncedUpdate('rgb', { r, g, b });
    }
  };

  const handleHslChange = (component: 'h' | 's' | 'l', value: string) => {
    const newHsl = { ...inputs.hsl, [component]: value };
    setInputs(prev => ({ ...prev, hsl: newHsl }));
    
    const h = parseFloat(newHsl.h) || 0;
    const s = parseFloat(newHsl.s) || 0;
    const l = parseFloat(newHsl.l) || 0;
    
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      debouncedUpdate('hsl', { h, s, l });
    }
  };

  const handleHsvChange = (component: 'h' | 's' | 'v', value: string) => {
    const newHsv = { ...inputs.hsv, [component]: value };
    setInputs(prev => ({ ...prev, hsv: newHsv }));
    
    const h = parseFloat(newHsv.h) || 0;
    const s = parseFloat(newHsv.s) || 0;
    const v = parseFloat(newHsv.v) || 0;
    
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && v >= 0 && v <= 100) {
      debouncedUpdate('hsv', { h, s, v });
    }
  };

  const handleCmykChange = (component: 'c' | 'm' | 'y' | 'k', value: string) => {
    const newCmyk = { ...inputs.cmyk, [component]: value };
    setInputs(prev => ({ ...prev, cmyk: newCmyk }));
    
    const c = parseFloat(newCmyk.c) || 0;
    const m = parseFloat(newCmyk.m) || 0;
    const y = parseFloat(newCmyk.y) || 0;
    const k = parseFloat(newCmyk.k) || 0;
    
    if (c >= 0 && c <= 100 && m >= 0 && m <= 100 && y >= 0 && y <= 100 && k >= 0 && k <= 100) {
      debouncedUpdate('cmyk', { c, m, y, k });
    }
  };

  const handleLabChange = (component: 'l' | 'a' | 'b', value: string) => {
    const newLab = { ...inputs.lab, [component]: value };
    setInputs(prev => ({ ...prev, lab: newLab }));
    
    const l = parseFloat(newLab.l) || 0;
    const a = parseFloat(newLab.a) || 0;
    const b = parseFloat(newLab.b) || 0;
    
    if (l >= 0 && l <= 100 && a >= -128 && a <= 127 && b >= -128 && b <= 127) {
      debouncedUpdate('lab', { l, a, b });
    }
  };

  return (
    <Container>
      <div className="text-center mb-4">
        <h1>🎨 Color Converter</h1>
        <p className="text-muted">Convert between different color formats with high precision</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs defaultActiveKey="converter" className="mb-3">
        <Tab eventKey="converter" title="Color Converter">
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <strong>HEX</strong>
                </Card.Header>
                <Card.Body>
                  <Form.Control
                    type="text"
                    value={inputs.hex}
                    onChange={(e) => handleHexChange(e.target.value)}
                    placeholder="#ffffff"
                  />
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header>
                  <strong>RGB</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <Form.Label>R</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="255"
                        value={inputs.rgb.r}
                        onChange={(e) => handleRgbChange('r', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>G</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="255"
                        value={inputs.rgb.g}
                        onChange={(e) => handleRgbChange('g', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>B</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="255"
                        value={inputs.rgb.b}
                        onChange={(e) => handleRgbChange('b', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header>
                  <strong>HSL</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <Form.Label>H</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="360"
                        value={inputs.hsl.h}
                        onChange={(e) => handleHslChange('h', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>S (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.hsl.s}
                        onChange={(e) => handleHslChange('s', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>L (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.hsl.l}
                        onChange={(e) => handleHslChange('l', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <strong>HSV</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <Form.Label>H</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="360"
                        value={inputs.hsv.h}
                        onChange={(e) => handleHsvChange('h', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>S (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.hsv.s}
                        onChange={(e) => handleHsvChange('s', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>V (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.hsv.v}
                        onChange={(e) => handleHsvChange('v', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header>
                  <strong>CMYK</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <Form.Label>C (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.cmyk.c}
                        onChange={(e) => handleCmykChange('c', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>M (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.cmyk.m}
                        onChange={(e) => handleCmykChange('m', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>Y (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.cmyk.y}
                        onChange={(e) => handleCmykChange('y', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>K (%)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.cmyk.k}
                        onChange={(e) => handleCmykChange('k', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-3">
                <Card.Header>
                  <strong>LAB</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <Form.Label>L</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.lab.l}
                        onChange={(e) => handleLabChange('l', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>A</Form.Label>
                      <Form.Control
                        type="number"
                        min="-128"
                        max="127"
                        value={inputs.lab.a}
                        onChange={(e) => handleLabChange('a', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Label>B</Form.Label>
                      <Form.Control
                        type="number"
                        min="-128"
                        max="127"
                        value={inputs.lab.b}
                        onChange={(e) => handleLabChange('b', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <strong>Color Preview</strong>
                </Card.Header>
                <Card.Body>
                  <div
                    style={{
                      backgroundColor: inputs.hex,
                      height: '100px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {inputs.hex}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="palettes" title="Color Palettes">
          <Row>
            {palettes.map((palette, index) => (
              <Col md={6} lg={4} key={index} className="mb-3">
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <strong>{palette.name}</strong>
                    <CopyWithToast 
                      text={exportPalette(palette, 'json')} 
                    />
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-wrap">
                      {palette.colors.map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          style={{
                            backgroundColor: color.hex,
                            width: '40px',
                            height: '40px',
                            margin: '2px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            cursor: 'pointer'
                          }}
                          title={color.hex}
                          onClick={() => handleHexChange(color.hex)}
                        />
                      ))}
                    </div>
                    <small className="text-muted mt-2 d-block">
                      Click any color to use it as base
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>

        <Tab eventKey="accessibility" title="Accessibility">
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <strong>Contrast Analysis</strong>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control
                      type="color"
                      value={backgroundHex}
                      onChange={(e) => {
                        setBackgroundHex(e.target.value);
                        setAccessibility(analyzeAccessibility(inputs.hex, e.target.value));
                      }}
                    />
                  </Form.Group>
                  
                  {accessibility && (
                    <div>
                      <div className="mb-2">
                        <strong>Contrast Ratio: </strong>
                        <Badge bg="info">{accessibility.contrastRatio}:1</Badge>
                      </div>
                      <div className="mb-2">
                        <strong>WCAG AA (Normal): </strong>
                        <Badge bg={accessibility.wcagLevel === 'Fail' ? 'danger' : 'success'}>
                          {accessibility.wcagLevel}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <strong>WCAG AA (Large): </strong>
                        <Badge bg={accessibility.wcagLevelLarge === 'Fail' ? 'danger' : 'success'}>
                          {accessibility.wcagLevelLarge}
                        </Badge>
                      </div>
                      <div
                        style={{
                          backgroundColor: backgroundHex,
                          color: inputs.hex,
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          marginTop: '10px'
                        }}
                      >
                        Sample text with current colors
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Header>
                  <strong>Color Blindness Simulation</strong>
                </Card.Header>
                <Card.Body>
                  {colorBlindness && (
                    <Row>
                      <Col xs={6} className="mb-2">
                        <div className="text-center">
                          <div
                            style={{
                              backgroundColor: colorBlindness.original.hex,
                              height: '50px',
                              borderRadius: '4px',
                              border: '1px solid #ccc'
                            }}
                          />
                          <small>Original</small>
                        </div>
                      </Col>
                      <Col xs={6} className="mb-2">
                        <div className="text-center">
                          <div
                            style={{
                              backgroundColor: colorBlindness.protanopia.hex,
                              height: '50px',
                              borderRadius: '4px',
                              border: '1px solid #ccc'
                            }}
                          />
                          <small>Protanopia</small>
                        </div>
                      </Col>
                      <Col xs={6} className="mb-2">
                        <div className="text-center">
                          <div
                            style={{
                              backgroundColor: colorBlindness.deuteranopia.hex,
                              height: '50px',
                              borderRadius: '4px',
                              border: '1px solid #ccc'
                            }}
                          />
                          <small>Deuteranopia</small>
                        </div>
                      </Col>
                      <Col xs={6} className="mb-2">
                        <div className="text-center">
                          <div
                            style={{
                              backgroundColor: colorBlindness.tritanopia.hex,
                              height: '50px',
                              borderRadius: '4px',
                              border: '1px solid #ccc'
                            }}
                          />
                          <small>Tritanopia</small>
                        </div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};
