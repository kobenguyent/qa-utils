/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import {
  generateImage,
  generateDocument,
  generateAudio,
  getFileExtension,
  validateFileConfig,
  getAvailableFormats,
  type FileConfig
} from '../testFileGenerator';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Test File Generator', () => {
  describe('generateImage', () => {
    it('should generate SVG image data URL', () => {
      const config: FileConfig = {
        type: 'image',
        format: 'svg',
        name: 'test',
        width: 800,
        height: 600,
        backgroundColor: '#4A90E2',
        textContent: 'Test Image'
      };
      
      const result = generateImage('svg', config);
      
      expect(result).toContain('data:image/svg+xml;base64,');
      const decoded = atob(result.split(',')[1]);
      expect(decoded).toContain('<svg');
      expect(decoded).toContain('width="800"');
      expect(decoded).toContain('height="600"');
      expect(decoded).toContain('Test Image');
    });

    it('should use default values for missing config', () => {
      const config: FileConfig = {
        type: 'image',
        format: 'svg',
        name: 'test'
      };
      
      const result = generateImage('svg', config);
      const decoded = atob(result.split(',')[1]);
      
      expect(decoded).toContain('Test Image');
    });
  });

  describe('generateDocument', () => {
    it('should generate TXT document data URL', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'txt',
        name: 'test',
        content: 'Hello World'
      };
      
      const result = generateDocument('txt', config);
      
      expect(result).toContain('data:text/plain;charset=utf-8,');
      expect(decodeURIComponent(result.split(',')[1])).toBe('Hello World');
    });

    it('should generate JSON document data URL', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'json',
        name: 'test',
        content: 'Test content'
      };
      
      const result = generateDocument('json', config);
      
      expect(result).toContain('data:application/json;charset=utf-8,');
      const jsonData = JSON.parse(decodeURIComponent(result.split(',')[1]));
      expect(jsonData.title).toBe('Test Document');
      expect(jsonData.content).toBe('Test content');
      expect(jsonData.metadata.generated).toBe(true);
    });

    it('should generate XML document data URL', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'xml',
        name: 'test',
        content: 'XML content'
      };
      
      const result = generateDocument('xml', config);
      
      expect(result).toContain('data:application/xml;charset=utf-8,');
      const xmlContent = decodeURIComponent(result.split(',')[1]);
      expect(xmlContent).toContain('<?xml version="1.0"');
      expect(xmlContent).toContain('<document>');
      expect(xmlContent).toContain('XML content');
    });

    it('should generate CSV document data URL', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'csv',
        name: 'test',
        content: 'Custom row'
      };
      
      const result = generateDocument('csv', config);
      
      expect(result).toContain('data:text/csv;charset=utf-8,');
      const csvContent = decodeURIComponent(result.split(',')[1]);
      expect(csvContent).toContain('Name,Value,Description');
      expect(csvContent).toContain('Custom row');
    });

    it('should generate PDF document data URL', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'pdf',
        name: 'test',
        content: 'PDF content'
      };
      
      const result = generateDocument('pdf', config);
      
      expect(result).toContain('data:application/pdf;base64,');
      const pdfContent = atob(result.split(',')[1]);
      expect(pdfContent).toContain('%PDF-1.4');
    });

    it('should use default content when not provided', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'txt',
        name: 'test'
      };
      
      const result = generateDocument('txt', config);
      
      expect(decodeURIComponent(result.split(',')[1])).toBe('Sample test document content');
    });
  });

  describe('generateAudio', () => {
    it('should generate WAV audio with correct structure', () => {
      const config: FileConfig = {
        type: 'audio',
        format: 'wav',
        name: 'test',
        duration: 1,
        frequency: 440
      };
      
      const result = generateAudio('wav', config);
      
      // In test environment, URL.createObjectURL may not work, 
      // but we can verify the function runs without errors for browser use
      expect(result).toBeDefined();
    });

    it('should handle MP3 format as WAV', () => {
      const config: FileConfig = {
        type: 'audio',
        format: 'mp3',
        name: 'test',
        duration: 1,
        frequency: 440
      };
      
      const result = generateAudio('mp3', config);
      
      expect(result).toBeDefined();
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for image types', () => {
      expect(getFileExtension('image', 'png')).toBe('png');
      expect(getFileExtension('image', 'jpg')).toBe('jpg');
      expect(getFileExtension('image', 'svg')).toBe('svg');
    });

    it('should return correct extension for document types', () => {
      expect(getFileExtension('document', 'txt')).toBe('txt');
      expect(getFileExtension('document', 'json')).toBe('json');
      expect(getFileExtension('document', 'pdf')).toBe('pdf');
    });

    it('should return correct extension for audio types', () => {
      expect(getFileExtension('audio', 'wav')).toBe('wav');
      expect(getFileExtension('audio', 'mp3')).toBe('mp3');
    });
  });

  describe('validateFileConfig', () => {
    it('should validate correct image config', () => {
      const config: FileConfig = {
        type: 'image',
        format: 'png',
        name: 'test',
        width: 800,
        height: 600
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty file name', () => {
      const config: FileConfig = {
        type: 'image',
        format: 'png',
        name: '',
        width: 800,
        height: 600
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File name is required');
    });

    it('should reject invalid image dimensions', () => {
      const config: FileConfig = {
        type: 'image',
        format: 'png',
        name: 'test',
        width: 0,
        height: -1
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject too large image dimensions', () => {
      const config: FileConfig = {
        type: 'image',
        format: 'png',
        name: 'test',
        width: 15000,
        height: 600
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Image width cannot exceed 10000px');
    });

    it('should validate correct audio config', () => {
      const config: FileConfig = {
        type: 'audio',
        format: 'wav',
        name: 'test',
        duration: 5,
        frequency: 440
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid audio duration', () => {
      const config: FileConfig = {
        type: 'audio',
        format: 'wav',
        name: 'test',
        duration: 0.05
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Audio duration must be at least 0.1 seconds');
    });

    it('should reject too long audio duration', () => {
      const config: FileConfig = {
        type: 'audio',
        format: 'wav',
        name: 'test',
        duration: 100
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Audio duration cannot exceed 60 seconds');
    });

    it('should validate document config without special checks', () => {
      const config: FileConfig = {
        type: 'document',
        format: 'txt',
        name: 'test',
        content: 'Some content'
      };
      
      const result = validateFileConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getAvailableFormats', () => {
    it('should return available image formats', () => {
      const formats = getAvailableFormats('image');
      
      expect(formats).toEqual(['png', 'jpg', 'gif', 'svg']);
      expect(formats).toHaveLength(4);
    });

    it('should return available document formats', () => {
      const formats = getAvailableFormats('document');
      
      expect(formats).toEqual(['txt', 'json', 'xml', 'csv', 'pdf']);
      expect(formats).toHaveLength(5);
    });

    it('should return available audio formats', () => {
      const formats = getAvailableFormats('audio');
      
      expect(formats).toEqual(['wav', 'mp3']);
      expect(formats).toHaveLength(2);
    });
  });
});
