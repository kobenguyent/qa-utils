import React, { useState, useCallback, useEffect } from 'react';
import {
    Container,
    Form,
    Button,
    Card,
    Row,
    Col,
    Tab,
    Tabs,
    Badge,
    Alert,
    Table,
    InputGroup,
} from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
    QRContentType,
    QRErrorCorrectionLevel,
    QROptions,
    WiFiConfig,
    VCardConfig,
    EmailConfig,
    SMSConfig,
    DynamicQREntry,
    formatWiFi,
    formatVCard,
    formatEmail,
    formatSMS,
    formatPhone,
    generateQRCodeDataURL,
    generateQRCodeSVG,
    createDynamicQREntry,
    getDynamicQRHistory,
    deleteDynamicQREntry,
    clearDynamicQRHistory,
    downloadQRCode,
    downloadQRCodeSVG,
} from '../../utils/qrCodeGenerator';

// Content type configuration
const contentTypes: { value: QRContentType; label: string; icon: string }[] = [
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'vcard', label: 'vCard', icon: '👤' },
    { value: 'email', label: 'Email', icon: '✉️' },
    { value: 'sms', label: 'SMS', icon: '💬' },
    { value: 'phone', label: 'Phone', icon: '📞' },
];

const errorCorrectionLevels: { value: QRErrorCorrectionLevel; label: string; description: string }[] = [
    { value: 'L', label: 'Low (7%)', description: 'Smallest QR code' },
    { value: 'M', label: 'Medium (15%)', description: 'Balanced size and reliability' },
    { value: 'Q', label: 'Quartile (25%)', description: 'Good error correction' },
    { value: 'H', label: 'High (30%)', description: 'Best error correction' },
];

export const QRCodeGenerator: React.FC = () => {
    // Mode state
    const [mode, setMode] = useState<'static' | 'dynamic'>('static');

    // Content state
    const [contentType, setContentType] = useState<QRContentType>('url');
    const [simpleContent, setSimpleContent] = useState('');

    // WiFi config
    const [wifiConfig, setWifiConfig] = useState<WiFiConfig>({
        ssid: '',
        password: '',
        encryption: 'WPA',
        hidden: false,
    });

    // vCard config
    const [vcardConfig, setVcardConfig] = useState<VCardConfig>({
        firstName: '',
        lastName: '',
        organization: '',
        title: '',
        email: '',
        phone: '',
        website: '',
    });

    // Email config
    const [emailConfig, setEmailConfig] = useState<EmailConfig>({
        to: '',
        subject: '',
        body: '',
    });

    // SMS config
    const [smsConfig, setSmsConfig] = useState<SMSConfig>({
        phone: '',
        message: '',
    });

    // QR Options
    const [qrOptions, setQrOptions] = useState<QROptions>({
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
    });

    // Generated QR
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [qrSvg, setQrSvg] = useState<string>('');
    const [generatedContent, setGeneratedContent] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string>('');

    // Dynamic QR history
    const [dynamicHistory, setDynamicHistory] = useState<DynamicQREntry[]>([]);

    // Load history on mount
    useEffect(() => {
        setDynamicHistory(getDynamicQRHistory());
    }, []);

    // Build content string based on type
    const buildContent = useCallback((): string => {
        switch (contentType) {
            case 'url':
            case 'text':
                return simpleContent;
            case 'wifi':
                return formatWiFi(wifiConfig);
            case 'vcard':
                return formatVCard(vcardConfig);
            case 'email':
                return formatEmail(emailConfig);
            case 'sms':
                return formatSMS(smsConfig);
            case 'phone':
                return formatPhone(simpleContent);
            default:
                return simpleContent;
        }
    }, [contentType, simpleContent, wifiConfig, vcardConfig, emailConfig, smsConfig]);

    // Validate content
    const validateContent = (): boolean => {
        switch (contentType) {
            case 'url':
                if (!simpleContent.trim()) {
                    setError('Please enter a URL');
                    return false;
                }
                break;
            case 'text':
                if (!simpleContent.trim()) {
                    setError('Please enter some text');
                    return false;
                }
                break;
            case 'wifi':
                if (!wifiConfig.ssid.trim()) {
                    setError('Please enter WiFi network name (SSID)');
                    return false;
                }
                break;
            case 'vcard':
                if (!vcardConfig.firstName.trim() || !vcardConfig.lastName.trim()) {
                    setError('Please enter first and last name');
                    return false;
                }
                break;
            case 'email':
                if (!emailConfig.to.trim()) {
                    setError('Please enter email address');
                    return false;
                }
                break;
            case 'sms':
            case 'phone':
                if (!smsConfig.phone.trim() && !simpleContent.trim()) {
                    setError('Please enter phone number');
                    return false;
                }
                break;
        }
        return true;
    };

    // Generate QR code
    const generateQR = async () => {
        setError('');

        if (!validateContent()) {
            return;
        }

        setIsGenerating(true);

        try {
            let content = buildContent();

            // For dynamic QR, create an entry and use the short URL
            if (mode === 'dynamic') {
                const entry = createDynamicQREntry(content, contentType);
                content = entry.shortUrl;
                setDynamicHistory(getDynamicQRHistory());
            }

            setGeneratedContent(content);

            const [dataUrl, svg] = await Promise.all([
                generateQRCodeDataURL(content, qrOptions),
                generateQRCodeSVG(content, qrOptions),
            ]);

            setQrDataUrl(dataUrl);
            setQrSvg(svg);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setIsGenerating(false);
        }
    };

    // Delete dynamic entry
    const handleDeleteEntry = (id: string) => {
        deleteDynamicQREntry(id);
        setDynamicHistory(getDynamicQRHistory());
    };

    // Clear all history
    const handleClearHistory = () => {
        if (confirm('Are you sure you want to clear all QR code history?')) {
            clearDynamicQRHistory();
            setDynamicHistory([]);
        }
    };

    // Render content form based on type
    const renderContentForm = () => {
        switch (contentType) {
            case 'url':
                return (
                    <Form.Group className="mb-3">
                        <Form.Label>URL</Form.Label>
                        <Form.Control
                            type="url"
                            placeholder="https://example.com"
                            value={simpleContent}
                            onChange={(e) => setSimpleContent(e.target.value)}
                        />
                    </Form.Group>
                );

            case 'text':
                return (
                    <Form.Group className="mb-3">
                        <Form.Label>Text Content</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Enter your text here..."
                            value={simpleContent}
                            onChange={(e) => setSimpleContent(e.target.value)}
                        />
                    </Form.Group>
                );

            case 'wifi':
                return (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Network Name (SSID) *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="MyWiFiNetwork"
                                value={wifiConfig.ssid}
                                onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="WiFi password"
                                value={wifiConfig.password}
                                onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Encryption</Form.Label>
                            <Form.Select
                                value={wifiConfig.encryption}
                                onChange={(e) => setWifiConfig({ ...wifiConfig, encryption: e.target.value as WiFiConfig['encryption'] })}
                            >
                                <option value="WPA">WPA/WPA2</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">No Password</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Check
                            type="checkbox"
                            label="Hidden Network"
                            checked={wifiConfig.hidden}
                            onChange={(e) => setWifiConfig({ ...wifiConfig, hidden: e.target.checked })}
                        />
                    </>
                );

            case 'vcard':
                return (
                    <>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vcardConfig.firstName}
                                        onChange={(e) => setVcardConfig({ ...vcardConfig, firstName: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vcardConfig.lastName}
                                        onChange={(e) => setVcardConfig({ ...vcardConfig, lastName: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Organization</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vcardConfig.organization}
                                        onChange={(e) => setVcardConfig({ ...vcardConfig, organization: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Job Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={vcardConfig.title}
                                        onChange={(e) => setVcardConfig({ ...vcardConfig, title: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={vcardConfig.email}
                                        onChange={(e) => setVcardConfig({ ...vcardConfig, email: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={vcardConfig.phone}
                                        onChange={(e) => setVcardConfig({ ...vcardConfig, phone: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Website</Form.Label>
                            <Form.Control
                                type="url"
                                placeholder="https://example.com"
                                value={vcardConfig.website}
                                onChange={(e) => setVcardConfig({ ...vcardConfig, website: e.target.value })}
                            />
                        </Form.Group>
                    </>
                );

            case 'email':
                return (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Email Address *</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="recipient@example.com"
                                value={emailConfig.to}
                                onChange={(e) => setEmailConfig({ ...emailConfig, to: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Email subject"
                                value={emailConfig.subject}
                                onChange={(e) => setEmailConfig({ ...emailConfig, subject: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Body</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Email body"
                                value={emailConfig.body}
                                onChange={(e) => setEmailConfig({ ...emailConfig, body: e.target.value })}
                            />
                        </Form.Group>
                    </>
                );

            case 'sms':
                return (
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone Number *</Form.Label>
                            <Form.Control
                                type="tel"
                                placeholder="+1234567890"
                                value={smsConfig.phone}
                                onChange={(e) => setSmsConfig({ ...smsConfig, phone: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Pre-filled message (optional)"
                                value={smsConfig.message}
                                onChange={(e) => setSmsConfig({ ...smsConfig, message: e.target.value })}
                            />
                        </Form.Group>
                    </>
                );

            case 'phone':
                return (
                    <Form.Group className="mb-3">
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                            type="tel"
                            placeholder="+1234567890"
                            value={simpleContent}
                            onChange={(e) => setSimpleContent(e.target.value)}
                        />
                    </Form.Group>
                );

            default:
                return null;
        }
    };

    return (
        <Container className="py-4">
            <h1 className="h3 mb-2">📱 QR Code Generator</h1>
            <p className="text-muted mb-4">Generate static and dynamic QR codes for URLs, WiFi, contacts, and more</p>

            <Tabs
                activeKey={mode}
                onSelect={(k) => setMode(k as 'static' | 'dynamic')}
                className="mb-4"
            >
                <Tab eventKey="static" title="🔒 Static QR">
                    <Alert variant="info" className="mb-3">
                        <strong>Static QR codes</strong> encode content directly. The QR code cannot be changed after creation.
                    </Alert>
                </Tab>
                <Tab eventKey="dynamic" title="🔄 Dynamic QR">
                    <Alert variant="warning" className="mb-3">
                        <strong>Dynamic QR codes</strong> use a redirect URL. History is stored locally in your browser.
                    </Alert>
                </Tab>
            </Tabs>

            <Row>
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Content Type</h5>
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                {contentTypes.map((type) => (
                                    <Button
                                        key={type.value}
                                        variant={contentType === type.value ? 'primary' : 'outline-secondary'}
                                        onClick={() => setContentType(type.value)}
                                        size="sm"
                                    >
                                        {type.icon} {type.label}
                                    </Button>
                                ))}
                            </div>

                            {renderContentForm()}

                            <hr className="my-4" />

                            <h5 className="mb-3">QR Options</h5>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Size: {qrOptions.width}px</Form.Label>
                                        <Form.Range
                                            min={128}
                                            max={512}
                                            step={32}
                                            value={qrOptions.width}
                                            onChange={(e) => setQrOptions({ ...qrOptions, width: parseInt(e.target.value) })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Error Correction</Form.Label>
                                        <Form.Select
                                            value={qrOptions.errorCorrectionLevel}
                                            onChange={(e) => setQrOptions({ ...qrOptions, errorCorrectionLevel: e.target.value as QRErrorCorrectionLevel })}
                                        >
                                            {errorCorrectionLevels.map((level) => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Foreground Color</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type="color"
                                                value={qrOptions.color?.dark || '#000000'}
                                                onChange={(e) => setQrOptions({
                                                    ...qrOptions,
                                                    color: { ...qrOptions.color, dark: e.target.value }
                                                })}
                                                style={{ width: '50px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={qrOptions.color?.dark || '#000000'}
                                                onChange={(e) => setQrOptions({
                                                    ...qrOptions,
                                                    color: { ...qrOptions.color, dark: e.target.value }
                                                })}
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Background Color</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type="color"
                                                value={qrOptions.color?.light || '#ffffff'}
                                                onChange={(e) => setQrOptions({
                                                    ...qrOptions,
                                                    color: { ...qrOptions.color, light: e.target.value }
                                                })}
                                                style={{ width: '50px' }}
                                            />
                                            <Form.Control
                                                type="text"
                                                value={qrOptions.color?.light || '#ffffff'}
                                                onChange={(e) => setQrOptions({
                                                    ...qrOptions,
                                                    color: { ...qrOptions.color, light: e.target.value }
                                                })}
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Button
                                variant="primary"
                                onClick={generateQR}
                                disabled={isGenerating}
                                className="w-100"
                            >
                                {isGenerating ? 'Generating...' : '✨ Generate QR Code'}
                            </Button>

                            {error && (
                                <Alert variant="danger" className="mt-3 mb-0">
                                    {error}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Body className="text-center">
                            <h5 className="mb-3">Generated QR Code</h5>

                            {qrDataUrl ? (
                                <>
                                    <div
                                        className="mb-3 p-3 d-inline-block"
                                        style={{
                                            backgroundColor: qrOptions.color?.light || '#ffffff',
                                            borderRadius: '8px',
                                            border: '1px solid var(--bs-border-color)'
                                        }}
                                    >
                                        <img
                                            src={qrDataUrl}
                                            alt="Generated QR Code"
                                            style={{ maxWidth: '100%', display: 'block' }}
                                        />
                                    </div>

                                    {mode === 'dynamic' && (
                                        <div className="mb-3">
                                            <Badge bg="info" className="mb-2">Dynamic QR</Badge>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            value={generatedContent}
                                            readOnly
                                            className="font-monospace small"
                                        />
                                    </div>

                                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                                        <Button
                                            variant="success"
                                            onClick={() => downloadQRCode(qrDataUrl, 'qrcode')}
                                        >
                                            📥 Download PNG
                                        </Button>
                                        <Button
                                            variant="outline-success"
                                            onClick={() => downloadQRCodeSVG(qrSvg, 'qrcode')}
                                        >
                                            📥 Download SVG
                                        </Button>
                                        <CopyWithToast text={generatedContent} />
                                    </div>
                                </>
                            ) : (
                                <div className="py-5 text-muted">
                                    <div style={{ fontSize: '4rem', opacity: 0.3 }}>📱</div>
                                    <p>Your QR code will appear here</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {mode === 'dynamic' && dynamicHistory.length > 0 && (
                        <Card>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0">📋 QR History ({dynamicHistory.length})</h5>
                                    <Button variant="outline-danger" size="sm" onClick={handleClearHistory}>
                                        Clear All
                                    </Button>
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <Table size="sm" hover>
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Content</th>
                                                <th>Created</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dynamicHistory.slice(0, 10).map((entry) => (
                                                <tr key={entry.id}>
                                                    <td>
                                                        <Badge bg="secondary">
                                                            {contentTypes.find(t => t.value === entry.contentType)?.icon || '📱'}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-truncate" style={{ maxWidth: '150px' }}>
                                                        {entry.originalContent.substring(0, 30)}...
                                                    </td>
                                                    <td className="text-muted small">
                                                        {new Date(entry.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                        >
                                                            ✕
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            <Card className="mt-4">
                <Card.Body>
                    <h5>💡 QR Code Tips</h5>
                    <Row>
                        <Col md={6}>
                            <ul className="mb-0">
                                <li><strong>Static QR:</strong> Best for permanent content like URLs or WiFi passwords</li>
                                <li><strong>Dynamic QR:</strong> Use when you may need to update the destination later</li>
                                <li><strong>Error Correction:</strong> Higher levels make QR more readable but larger</li>
                            </ul>
                        </Col>
                        <Col md={6}>
                            <ul className="mb-0">
                                <li><strong>Size:</strong> Larger QR codes are easier to scan from distance</li>
                                <li><strong>Colors:</strong> Dark foreground on light background works best</li>
                                <li><strong>Testing:</strong> Always test by scanning before sharing</li>
                            </ul>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default QRCodeGenerator;
