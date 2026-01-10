/**
 * Utility functions for generating test files
 */

export type FileType = 'image' | 'document' | 'audio';
export type ImageFormat = 'png' | 'jpg' | 'gif' | 'svg';
export type DocumentFormat = 'txt' | 'json' | 'xml' | 'csv' | 'pdf';
export type AudioFormat = 'wav' | 'mp3';

export interface FileConfig {
  type: FileType;
  format: string;
  name: string;
  // Image options
  width?: number;
  height?: number;
  backgroundColor?: string;
  textContent?: string;
  // Document options
  content?: string;
  // Audio options
  duration?: number;
  frequency?: number;
}

/**
 * Generate an image data URL
 */
export const generateImage = (format: ImageFormat, config: FileConfig): string => {
  if (format === 'svg') {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${config.backgroundColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${config.textContent || 'Test Image'}
  </text>
</svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // For PNG, JPG, GIF - use canvas
  const canvas = document.createElement('canvas');
  canvas.width = config.width || 800;
  canvas.height = config.height || 600;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Fill background
    ctx.fillStyle = config.backgroundColor || '#4A90E2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.textContent || 'Test Image', canvas.width / 2, canvas.height / 2);
    
    // Add dimensions text
    ctx.font = '24px Arial';
    ctx.fillText(`${canvas.width} x ${canvas.height}`, canvas.width / 2, canvas.height / 2 + 50);
  }
  
  const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  return canvas.toDataURL(mimeType);
};

/**
 * Generate a document data URL
 */
export const generateDocument = (format: DocumentFormat, config: FileConfig): string => {
  const content = config.content || 'Sample test document content';
  
  switch (format) {
    case 'txt':
      return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    
    case 'json': {
      const jsonContent = {
        title: 'Test Document',
        content: content,
        timestamp: new Date().toISOString(),
        metadata: {
          generated: true,
          format: 'json'
        }
      };
      return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonContent, null, 2))}`;
    }
    
    case 'xml': {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <title>Test Document</title>
  <content>${content}</content>
  <timestamp>${new Date().toISOString()}</timestamp>
</document>`;
      return `data:application/xml;charset=utf-8,${encodeURIComponent(xmlContent)}`;
    }
    
    case 'csv': {
      const csvContent = `Name,Value,Description
Test Item 1,100,First test item
Test Item 2,200,Second test item
Test Item 3,300,Third test item
${content},400,Custom content`;
      return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    }
    
    case 'pdf': {
      // Simple PDF structure (very basic, not a full PDF implementation)
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(${content}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000341 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
435
%%EOF`;
      return `data:application/pdf;base64,${btoa(pdfContent)}`;
    }
    
    default:
      return '';
  }
};

/**
 * Generate an audio data URL
 */
export const generateAudio = (format: AudioFormat, config: FileConfig): string => {
  // Create a simple audio tone using Web Audio API
  const sampleRate = 44100;
  const duration = config.duration || 1;
  const frequency = config.frequency || 440;
  const numSamples = sampleRate * duration;
  
  // Generate wave samples
  const samples: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t);
    samples.push(sample);
  }
  
  if (format === 'wav') {
    // Create WAV file
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, 1, true); // number of channels
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    // Write samples
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, sample * 0x7FFF, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
  
  // For MP3, we'll use a simple WAV for now since MP3 encoding is complex
  // In a real implementation, you'd use a library like lamejs
  return generateAudio('wav', config);
};

/**
 * Get the file extension based on format
 */
export const getFileExtension = (_type: FileType, format: string): string => {
  return format;
};

/**
 * Validate file configuration
 */
export const validateFileConfig = (config: FileConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config.name || config.name.trim() === '') {
    errors.push('File name is required');
  }
  
  if (config.type === 'image') {
    if (!config.width || config.width < 1) {
      errors.push('Image width must be greater than 0');
    }
    if (!config.height || config.height < 1) {
      errors.push('Image height must be greater than 0');
    }
    if (config.width && config.width > 10000) {
      errors.push('Image width cannot exceed 10000px');
    }
    if (config.height && config.height > 10000) {
      errors.push('Image height cannot exceed 10000px');
    }
  }
  
  if (config.type === 'audio') {
    if (!config.duration || config.duration < 0.1) {
      errors.push('Audio duration must be at least 0.1 seconds');
    }
    if (config.duration && config.duration > 60) {
      errors.push('Audio duration cannot exceed 60 seconds');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get available formats for a file type
 */
export const getAvailableFormats = (type: FileType): string[] => {
  switch (type) {
    case 'image':
      return ['png', 'jpg', 'gif', 'svg'];
    case 'document':
      return ['txt', 'json', 'xml', 'csv', 'pdf'];
    case 'audio':
      return ['wav', 'mp3'];
    default:
      return [];
  }
};
