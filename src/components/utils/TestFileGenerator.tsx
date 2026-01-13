import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, ButtonGroup } from 'react-bootstrap';
import {
  generateImage,
  generateDocument,
  generateAudio,
  getFileExtension,
  type FileType,
  type ImageFormat,
  type DocumentFormat,
  type AudioFormat,
  type FileConfig
} from '../../utils/testFileGenerator';

export const TestFileGenerator: React.FC = () => {
  const [fileType, setFileType] = useState<FileType>('image');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>('txt');
  const [audioFormat, setAudioFormat] = useState<AudioFormat>('wav');
  const [fileName, setFileName] = useState('test-file');

  // Image options
  const [imageWidth, setImageWidth] = useState(800);
  const [imageHeight, setImageHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState('#4A90E2');
  const [imageText, setImageText] = useState('Test Image');

  // Document options
  const [documentContent, setDocumentContent] = useState('Sample test document content');

  // Audio options
  const [audioDuration, setAudioDuration] = useState(1);
  const [audioFrequency, setAudioFrequency] = useState(440);

  const handleGenerate = () => {
    const config: FileConfig = {
      type: fileType,
      format: fileType === 'image' ? imageFormat : fileType === 'document' ? documentFormat : audioFormat,
      name: fileName,
      width: imageWidth,
      height: imageHeight,
      backgroundColor: backgroundColor,
      textContent: imageText,
      content: documentContent,
      duration: audioDuration,
      frequency: audioFrequency,
    };

    let dataUrl = '';
    let extension = '';

    if (fileType === 'image') {
      dataUrl = generateImage(imageFormat, config);
      extension = getFileExtension(fileType, imageFormat);
    } else if (fileType === 'document') {
      dataUrl = generateDocument(documentFormat, config);
      extension = getFileExtension(fileType, documentFormat);
    } else if (fileType === 'audio') {
      dataUrl = generateAudio(audioFormat, config);
      extension = getFileExtension(fileType, audioFormat);
    }

    // Trigger download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup object URLs for audio
    if (fileType === 'audio' && dataUrl.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">📁 Test File Generator</h1>
      <p className="text-muted">Generate test files like images, documents, and audio files for testing purposes</p>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">File Settings</h5>

              <Form.Group className="mb-3">
                <Form.Label>File Type</Form.Label>
                <ButtonGroup className="d-flex">
                  <Button
                    variant={fileType === 'image' ? 'primary' : 'outline-primary'}
                    onClick={() => setFileType('image')}
                  >
                    🖼️ Image
                  </Button>
                  <Button
                    variant={fileType === 'document' ? 'primary' : 'outline-primary'}
                    onClick={() => setFileType('document')}
                  >
                    📄 Document
                  </Button>
                  <Button
                    variant={fileType === 'audio' ? 'primary' : 'outline-primary'}
                    onClick={() => setFileType('audio')}
                  >
                    🔊 Audio
                  </Button>
                </ButtonGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>File Name</Form.Label>
                <Form.Control
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="test-file"
                />
              </Form.Group>

              {fileType === 'image' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select
                      value={imageFormat}
                      onChange={(e) => setImageFormat(e.target.value as ImageFormat)}
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="gif">GIF</option>
                      <option value="svg">SVG</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Width: {imageWidth}px</Form.Label>
                    <Form.Range
                      min={100}
                      max={2000}
                      value={imageWidth}
                      onChange={(e) => setImageWidth(parseInt(e.target.value))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Height: {imageHeight}px</Form.Label>
                    <Form.Range
                      min={100}
                      max={2000}
                      value={imageHeight}
                      onChange={(e) => setImageHeight(parseInt(e.target.value))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Background Color</Form.Label>
                    <Form.Control
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Text on Image</Form.Label>
                    <Form.Control
                      type="text"
                      value={imageText}
                      onChange={(e) => setImageText(e.target.value)}
                      placeholder="Test Image"
                    />
                  </Form.Group>
                </>
              )}

              {fileType === 'document' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select
                      value={documentFormat}
                      onChange={(e) => setDocumentFormat(e.target.value as DocumentFormat)}
                    >
                      <option value="txt">TXT</option>
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Content</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      placeholder="Sample test document content"
                    />
                  </Form.Group>
                </>
              )}

              {fileType === 'audio' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Format</Form.Label>
                    <Form.Select
                      value={audioFormat}
                      onChange={(e) => setAudioFormat(e.target.value as AudioFormat)}
                    >
                      <option value="wav">WAV</option>
                      <option value="mp3">MP3 (as WAV)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Duration: {audioDuration}s</Form.Label>
                    <Form.Range
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={audioDuration}
                      onChange={(e) => setAudioDuration(parseFloat(e.target.value))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Frequency: {audioFrequency}Hz</Form.Label>
                    <Form.Range
                      min={200}
                      max={2000}
                      step={10}
                      value={audioFrequency}
                      onChange={(e) => setAudioFrequency(parseInt(e.target.value))}
                    />
                  </Form.Group>
                </>
              )}

              <Button variant="success" onClick={handleGenerate} className="w-100">
                🎉 Generate & Download
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Preview & Information</h5>

              <div className="mb-3">
                <strong>Selected Type:</strong> {fileType === 'image' ? '🖼️ Image' : fileType === 'document' ? '📄 Document' : '🔊 Audio'}
              </div>

              {fileType === 'image' && (
                <div>
                  <p><strong>Format:</strong> {imageFormat.toUpperCase()}</p>
                  <p><strong>Dimensions:</strong> {imageWidth} x {imageHeight}px</p>
                  <p><strong>Background:</strong> <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: backgroundColor, border: '1px solid #ccc' }}></span> {backgroundColor}</p>
                  <p><strong>Text:</strong> {imageText}</p>
                </div>
              )}

              {fileType === 'document' && (
                <div>
                  <p><strong>Format:</strong> {documentFormat.toUpperCase()}</p>
                  <p><strong>Content Preview:</strong></p>
                  <pre
                    className="theme-code-block"
                    style={{
                      padding: '10px',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}
                  >
                    {documentContent}
                  </pre>
                </div>
              )}

              {fileType === 'audio' && (
                <div>
                  <p><strong>Format:</strong> {audioFormat.toUpperCase()}</p>
                  <p><strong>Duration:</strong> {audioDuration} seconds</p>
                  <p><strong>Frequency:</strong> {audioFrequency}Hz (tone)</p>
                  <p className="text-muted small">A simple sine wave tone will be generated</p>
                </div>
              )}

              <div className="mt-4 p-3 usage-tips-block">
                <h6>📝 Usage Tips:</h6>
                <ul className="small mb-0">
                  <li>Generated files can be used for testing file uploads</li>
                  <li>Images are useful for testing image processing and display</li>
                  <li>Documents help test parsing and content extraction</li>
                  <li>Audio files can test media player functionality</li>
                  <li>Adjust parameters to generate files of different sizes</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <h5>ℹ️ About Test File Generator</h5>
          <p>
            This tool generates various types of test files that can be downloaded and used for testing purposes.
            Perfect for QA engineers who need sample files to test file upload functionality, file processing,
            or any feature that requires different file types and formats.
          </p>
          <h6>Supported File Types:</h6>
          <ul>
            <li><strong>Images:</strong> PNG, JPG, GIF, SVG with customizable dimensions and colors</li>
            <li><strong>Documents:</strong> TXT, JSON, XML, CSV, PDF with sample content</li>
            <li><strong>Audio:</strong> WAV files with configurable duration and frequency</li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
};
