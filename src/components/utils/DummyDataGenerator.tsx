import React, { useState, useCallback } from 'react';
import { Container, Form, Button, Card, Row, Col, Tab, Tabs, Table, Badge } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import {
    randFullName, randFirstName, randLastName, randEmail, randPhoneNumber, randJobTitle, randParagraph,
    randCity, randState, randCountry, randZipCode, randLatitude, randLongitude, randStreetAddress,
    randUrl, randDomainName, randIp, randMac, randUserName, randPassword,
    randCreditCardNumber, randCurrencyCode, randAmount, randBic, randCreditCardCVV,
    randCompanyName, randCatchPhrase,
    randPastDate, randFutureDate, randRecentDate, randWeekday, randMonth,
    randWord, randSentence, randSlug,
    randUuid, randBoolean, randNumber, randHexaDecimal, randMimeType, randFileName, randFileExt
} from '@ngneat/falso';

type DataCategory = 'person' | 'location' | 'internet' | 'finance' | 'company' | 'datetime' | 'text' | 'misc';
type OutputFormat = 'json' | 'csv' | 'table';

interface DataField {
    name: string;
    label: string;
    generator: (count: number) => unknown[];
}

const dataFields: Record<DataCategory, DataField[]> = {
    person: [
        { name: 'fullName', label: 'Full Name', generator: (n) => randFullName({ length: n }) },
        { name: 'firstName', label: 'First Name', generator: (n) => randFirstName({ length: n }) },
        { name: 'lastName', label: 'Last Name', generator: (n) => randLastName({ length: n }) },
        { name: 'email', label: 'Email', generator: (n) => randEmail({ length: n }) },
        { name: 'phone', label: 'Phone', generator: (n) => randPhoneNumber({ length: n }) },
        { name: 'jobTitle', label: 'Job Title', generator: (n) => randJobTitle({ length: n }) },
        { name: 'bio', label: 'Bio', generator: (n) => randParagraph({ length: n }) },
    ],
    location: [
        { name: 'streetAddress', label: 'Street Address', generator: (n) => randStreetAddress({ length: n }) },
        { name: 'city', label: 'City', generator: (n) => randCity({ length: n }) },
        { name: 'state', label: 'State', generator: (n) => randState({ length: n }) },
        { name: 'country', label: 'Country', generator: (n) => randCountry({ length: n }) },
        { name: 'zipCode', label: 'Zip Code', generator: (n) => randZipCode({ length: n }) },
        { name: 'latitude', label: 'Latitude', generator: (n) => randLatitude({ length: n }) },
        { name: 'longitude', label: 'Longitude', generator: (n) => randLongitude({ length: n }) },
    ],
    internet: [
        { name: 'email', label: 'Email', generator: (n) => randEmail({ length: n }) },
        { name: 'username', label: 'Username', generator: (n) => randUserName({ length: n }) },
        { name: 'password', label: 'Password', generator: (n) => randPassword({ length: n }) },
        { name: 'url', label: 'URL', generator: (n) => randUrl({ length: n }) },
        { name: 'domain', label: 'Domain', generator: (n) => randDomainName({ length: n }) },
        { name: 'ipAddress', label: 'IP Address', generator: (n) => randIp({ length: n }) },
        { name: 'macAddress', label: 'MAC Address', generator: (n) => randMac({ length: n }) },
    ],
    finance: [
        { name: 'creditCard', label: 'Credit Card', generator: (n) => randCreditCardNumber({ length: n }) },
        { name: 'cvv', label: 'CVV', generator: (n) => randCreditCardCVV({ length: n }) },
        { name: 'bic', label: 'BIC', generator: (n) => randBic({ length: n }) },
        { name: 'currency', label: 'Currency Code', generator: (n) => randCurrencyCode({ length: n }) },
        { name: 'amount', label: 'Amount', generator: (n) => randAmount({ length: n }) },
    ],
    company: [
        { name: 'companyName', label: 'Company Name', generator: (n) => randCompanyName({ length: n }) },
        { name: 'catchPhrase', label: 'Catch Phrase', generator: (n) => randCatchPhrase({ length: n }) },
    ],
    datetime: [
        { name: 'pastDate', label: 'Past Date', generator: (n) => randPastDate({ length: n }).map(d => d.toISOString()) },
        { name: 'futureDate', label: 'Future Date', generator: (n) => randFutureDate({ length: n }).map(d => d.toISOString()) },
        { name: 'recentDate', label: 'Recent Date', generator: (n) => randRecentDate({ length: n }).map(d => d.toISOString()) },
        { name: 'weekday', label: 'Weekday', generator: (n) => randWeekday({ length: n }) },
        { name: 'month', label: 'Month', generator: (n) => randMonth({ length: n }) },
    ],
    text: [
        { name: 'word', label: 'Word', generator: (n) => randWord({ length: n }) },
        { name: 'sentence', label: 'Sentence', generator: (n) => randSentence({ length: n }) },
        { name: 'paragraph', label: 'Paragraph', generator: (n) => randParagraph({ length: n }) },
        { name: 'slug', label: 'Slug', generator: (n) => randSlug({ length: n }) },
    ],
    misc: [
        { name: 'uuid', label: 'UUID', generator: (n) => randUuid({ length: n }) },
        { name: 'boolean', label: 'Boolean', generator: (n) => randBoolean({ length: n }) },
        { name: 'number', label: 'Number', generator: (n) => randNumber({ length: n, min: 0, max: 10000 }) },
        { name: 'hexColor', label: 'Hex Color', generator: (n) => randHexaDecimal({ length: n }) },
        { name: 'mimeType', label: 'MIME Type', generator: (n) => randMimeType({ length: n }) },
        { name: 'fileName', label: 'File Name', generator: (n) => randFileName({ length: n }) },
        { name: 'fileExt', label: 'File Extension', generator: (n) => randFileExt({ length: n }) },
    ],
};

const categoryLabels: Record<DataCategory, { icon: string; label: string }> = {
    person: { icon: '👤', label: 'Person' },
    location: { icon: '📍', label: 'Location' },
    internet: { icon: '🌐', label: 'Internet' },
    finance: { icon: '💳', label: 'Finance' },
    company: { icon: '🏢', label: 'Company' },
    datetime: { icon: '📅', label: 'Date/Time' },
    text: { icon: '📝', label: 'Text' },
    misc: { icon: '🎲', label: 'Miscellaneous' },
};

export const DummyDataGenerator: React.FC = () => {
    const [category, setCategory] = useState<DataCategory>('person');
    const [selectedFields, setSelectedFields] = useState<string[]>(['fullName', 'email']);
    const [quantity, setQuantity] = useState(5);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
    const [generatedData, setGeneratedData] = useState<Record<string, unknown[]> | null>(null);

    const handleFieldToggle = (fieldName: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldName)
                ? prev.filter(f => f !== fieldName)
                : [...prev, fieldName]
        );
    };

    const handleCategoryChange = (newCategory: string | null) => {
        if (newCategory) {
            const cat = newCategory as DataCategory;
            setCategory(cat);
            // Select first two fields of new category by default
            const categoryFields = dataFields[cat];
            setSelectedFields(categoryFields.slice(0, 2).map(f => f.name));
            setGeneratedData(null);
        }
    };

    const generateData = useCallback(() => {
        const fields = dataFields[category].filter(f => selectedFields.includes(f.name));
        const result: Record<string, unknown[]> = {};

        fields.forEach(field => {
            result[field.name] = field.generator(quantity);
        });

        setGeneratedData(result);
    }, [category, selectedFields, quantity]);

    const formatAsJson = (): string => {
        if (!generatedData) return '';

        // Convert column-based data to row-based
        const rows = [];
        for (let i = 0; i < quantity; i++) {
            const row: Record<string, unknown> = {};
            Object.keys(generatedData).forEach(key => {
                row[key] = generatedData[key][i];
            });
            rows.push(row);
        }
        return JSON.stringify(rows, null, 2);
    };

    const formatAsCsv = (): string => {
        if (!generatedData) return '';

        const headers = Object.keys(generatedData);
        const csvRows = [headers.join(',')];

        for (let i = 0; i < quantity; i++) {
            const row = headers.map(header => {
                const value = generatedData[header][i];
                // Escape quotes and wrap in quotes if contains comma
                const strValue = String(value);
                if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                    return `"${strValue.replace(/"/g, '""')}"`;
                }
                return strValue;
            });
            csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
    };

    const getOutputContent = (): string => {
        if (outputFormat === 'json') return formatAsJson();
        if (outputFormat === 'csv') return formatAsCsv();
        return formatAsJson(); // table uses JSON internally
    };

    const downloadFile = () => {
        const content = getOutputContent();
        const extension = outputFormat === 'csv' ? 'csv' : 'json';
        const mimeType = outputFormat === 'csv' ? 'text/csv' : 'application/json';

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dummy-data-${category}-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderTable = () => {
        if (!generatedData) return null;
        const headers = Object.keys(generatedData);

        return (
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)' }}>
                        <tr>
                            <th>#</th>
                            {headers.map(header => (
                                <th key={header}>{dataFields[category].find(f => f.name === header)?.label || header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: quantity }).map((_, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                {headers.map(header => (
                                    <td key={header} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {String(generatedData[header][i])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    return (
        <Container className="py-4">
            <h1 className="h3 mb-2">🎭 Dummy Data Generator</h1>
            <p className="text-muted mb-4">Generate realistic fake data for testing, development, and prototyping</p>

            {/* Category Tabs */}
            <Tabs
                activeKey={category}
                onSelect={handleCategoryChange}
                className="mb-4"
                variant="pills"
            >
                {(Object.keys(categoryLabels) as DataCategory[]).map(cat => (
                    <Tab
                        key={cat}
                        eventKey={cat}
                        title={<span>{categoryLabels[cat].icon} {categoryLabels[cat].label}</span>}
                    />
                ))}
            </Tabs>

            <Row>
                {/* Settings Panel */}
                <Col lg={4}>
                    <Card className="mb-4">
                        <Card.Body>
                            <h5 className="mb-3">⚙️ Settings</h5>

                            {/* Field Selection */}
                            <Form.Group className="mb-3">
                                <Form.Label>Select Fields</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {dataFields[category].map(field => (
                                        <Badge
                                            key={field.name}
                                            bg={selectedFields.includes(field.name) ? 'primary' : 'secondary'}
                                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                                            onClick={() => handleFieldToggle(field.name)}
                                        >
                                            {selectedFields.includes(field.name) ? '✓ ' : ''}{field.label}
                                        </Badge>
                                    ))}
                                </div>
                                <Form.Text className="text-muted">
                                    Click to select/deselect fields
                                </Form.Text>
                            </Form.Group>

                            {/* Quantity */}
                            <Form.Group className="mb-3">
                                <Form.Label>Quantity: {quantity} items</Form.Label>
                                <Form.Range
                                    min={1}
                                    max={100}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                />
                                <div className="d-flex justify-content-between">
                                    <small className="text-muted">1</small>
                                    <small className="text-muted">100</small>
                                </div>
                            </Form.Group>

                            {/* Output Format */}
                            <Form.Group className="mb-3">
                                <Form.Label>Output Format</Form.Label>
                                <Form.Select
                                    value={outputFormat}
                                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                >
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                    <option value="table">Table View</option>
                                </Form.Select>
                            </Form.Group>

                            {/* Generate Button */}
                            <Button
                                variant="primary"
                                onClick={generateData}
                                className="w-100"
                                disabled={selectedFields.length === 0}
                            >
                                🎲 Generate Data
                            </Button>
                        </Card.Body>
                    </Card>

                    {/* Quick Stats */}
                    {generatedData && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h6>📊 Quick Stats</h6>
                                <ul className="mb-0 small">
                                    <li>Category: {categoryLabels[category].label}</li>
                                    <li>Fields: {selectedFields.length}</li>
                                    <li>Records: {quantity}</li>
                                    <li>Total values: {selectedFields.length * quantity}</li>
                                </ul>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Output Panel */}
                <Col lg={8}>
                    <Card>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">📋 Generated Data</h5>
                                {generatedData && (
                                    <div className="d-flex gap-2">
                                        <CopyWithToast text={getOutputContent()} />
                                        <Button variant="outline-secondary" size="sm" onClick={downloadFile}>
                                            ⬇️ Download
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {generatedData ? (
                                outputFormat === 'table' ? (
                                    renderTable()
                                ) : (
                                    <Form.Control
                                        as="textarea"
                                        rows={15}
                                        value={getOutputContent()}
                                        readOnly
                                        className="font-monospace"
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                )
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <div style={{ fontSize: '3rem' }}>🎭</div>
                                    <p className="mt-3">
                                        Select fields and click "Generate Data" to create dummy data
                                    </p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Info Card */}
            <Card className="mt-4">
                <Card.Body>
                    <h5>ℹ️ About Dummy Data Generator</h5>
                    <p className="mb-2">
                        This tool generates realistic fake data for testing, development, and prototyping purposes.
                        Powered by the <code>@ngneat/falso</code> library, it provides high-quality mock data across
                        various categories.
                    </p>
                    <p className="mb-0">
                        <strong>Use cases:</strong> API testing, database seeding, UI prototyping, unit testing,
                        performance testing with large datasets, and demo data generation.
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DummyDataGenerator;
