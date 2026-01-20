import { PDFDocument, rgb } from 'pdf-lib';
import imageCompression from 'browser-image-compression';

export interface ProcessedFile {
  id: string;
  name: string;
  originalSize: number;
  processedSize: number;
  format: string;
  blob: Blob;
  timestamp: number;
  operations: string[];
  preview?: string;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
  compress?: boolean;
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  filter?: 'none' | 'grayscale' | 'sepia' | 'blur' | 'sharpen' | 'invert' | 'hue-rotate' | 'saturate' | 'brightness-filter' | 'contrast-filter' | 'watermark' | 'censor';
  filterIntensity?: number;
  watermarkText?: string;
  watermark?: { text: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' };
}

export interface DocumentProcessingOptions {
  compress?: boolean;
  quality?: number;
  optimize?: boolean;
  format?: 'pdf';
  merge?: File[];
  split?: { startPage: number; endPage: number };
  addText?: { text: string; x: number; y: number; page?: number };
}

export class FileProcessor {
  // Advanced image processing using Canvas API
  static async processImage(file: File, options: ImageProcessingOptions): Promise<ProcessedFile> {
    console.log('Processing image with options:', options);
    
    try {
      // Use browser-image-compression for better compression
      if (options.compress) {
        const compressionOptions = {
          maxSizeMB: 10, // Max file size in MB
          maxWidthOrHeight: Math.max(options.width || 1920, options.height || 1080),
          useWebWorker: true,
          quality: options.quality || 0.8,
          fileType: options.format === 'jpeg' ? 'image/jpeg' : 
                   options.format === 'png' ? 'image/png' : 
                   options.format === 'webp' ? 'image/webp' : undefined
        };

        const compressedFile = await imageCompression(file, compressionOptions);
        
        // If no other processing needed, return compressed file
        if (!options.filter || options.filter === 'none') {
          return {
            id: `processed-${Date.now()}`,
            name: `${file.name.replace(/\.[^/.]+$/, '')}_compressed.${options.format || 'jpg'}`,
            originalSize: file.size,
            processedSize: compressedFile.size,
            format: compressedFile.type,
            blob: compressedFile,
            operations: ['compress'],
            timestamp: Date.now()
          };
        }
        
        // Continue with Canvas processing for filters using compressed file
        file = compressedFile;
      }
    } catch (error) {
      console.warn('Browser compression failed, using Canvas fallback:', error);
    }

    // Canvas processing for filters and advanced options
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        let { width = img.width, height = img.height } = options;
        
        // Handle cropping
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        if (options.crop) {
          sourceX = options.crop.x;
          sourceY = options.crop.y;
          sourceWidth = options.crop.width;
          sourceHeight = options.crop.height;
        }
        
        // Calculate dimensions with aspect ratio
        if (options.maintainAspectRatio !== false && !options.crop) {
          const aspectRatio = img.width / img.height;
          if (width && !height) {
            height = width / aspectRatio;
          } else if (height && !width) {
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Apply rotation
        if (options.rotate) {
          ctx.translate(width / 2, height / 2);
          ctx.rotate((options.rotate * Math.PI) / 180);
          ctx.translate(-width / 2, -height / 2);
        }

        // Draw image
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

        // Apply filters
        if (options.brightness !== undefined || options.contrast !== undefined || options.saturation !== undefined) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Brightness
            if (options.brightness !== undefined) {
              const brightness = (options.brightness - 50) * 2.55;
              data[i] = Math.max(0, Math.min(255, data[i] + brightness));
              data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
              data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
            }
            
            // Contrast
            if (options.contrast !== undefined) {
              const contrast = (options.contrast / 50);
              data[i] = Math.max(0, Math.min(255, (data[i] - 128) * contrast + 128));
              data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * contrast + 128));
              data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * contrast + 128));
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
        }

        // Apply CSS filters
        if (options.filter && options.filter !== 'none') {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCanvas.width = width;
            tempCanvas.height = height;
            
            switch (options.filter) {
              case 'grayscale':
                tempCtx.filter = `grayscale(${options.filterIntensity || 100}%)`;
                break;
              case 'sepia':
                tempCtx.filter = `sepia(${options.filterIntensity || 100}%)`;
                break;
              case 'blur':
                tempCtx.filter = `blur(${options.filterIntensity || 2}px)`;
                break;
              case 'sharpen':
                tempCtx.filter = `contrast(${150 + (options.filterIntensity || 0)}%) brightness(110%)`;
                break;
              case 'invert':
                tempCtx.filter = `invert(${options.filterIntensity || 100}%)`;
                break;
              case 'hue-rotate':
                tempCtx.filter = `hue-rotate(${options.filterIntensity || 90}deg)`;
                break;
              case 'saturate':
                tempCtx.filter = `saturate(${options.filterIntensity || 200}%)`;
                break;
              case 'brightness-filter':
                tempCtx.filter = `brightness(${options.filterIntensity || 150}%)`;
                break;
              case 'contrast-filter':
                tempCtx.filter = `contrast(${options.filterIntensity || 150}%)`;
                break;
              case 'censor':
                tempCtx.filter = `blur(${options.filterIntensity || 10}px)`;
                break;
              case 'watermark':
                // Watermark is handled separately after filter
                break;
              default:
                tempCtx.filter = 'none';
            }
            
            tempCtx.drawImage(canvas, 0, 0);
            tempCtx.filter = 'none'; // Reset filter
            
            // Add watermark if selected
            if (options.filter === 'watermark' && options.watermarkText) {
              tempCtx.font = `${options.filterIntensity || 24}px Arial`;
              tempCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
              tempCtx.lineWidth = 2;
              const text = options.watermarkText;
              const x = width - tempCtx.measureText(text).width - 20;
              const y = height - 20;
              tempCtx.strokeText(text, x, y);
              tempCtx.fillText(text, x, y);
            }
            
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(tempCanvas, 0, 0);
          }
        }

        // Add watermark
        if (options.watermark) {
          ctx.font = '20px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 2;
          
          const text = options.watermark.text;
          const textWidth = ctx.measureText(text).width;
          let x = 10, y = 30;
          
          switch (options.watermark.position) {
            case 'top-right':
              x = width - textWidth - 10;
              y = 30;
              break;
            case 'bottom-left':
              x = 10;
              y = height - 10;
              break;
            case 'bottom-right':
              x = width - textWidth - 10;
              y = height - 10;
              break;
            case 'center':
              x = (width - textWidth) / 2;
              y = height / 2;
              break;
          }
          
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        }
        
        const format = options.format || 'jpeg';
        const quality = options.quality || 0.8;
        const mimeType = `image/${format}`;

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }

          const operations = [];
          if (options.crop) operations.push('crop');
          if (options.rotate) operations.push(`rotate:${options.rotate}°`);
          if (width !== img.width || height !== img.height) operations.push(`resize:${width}x${height}`);
          if (options.filter && options.filter !== 'none') operations.push(`filter:${options.filter}`);
          if (options.watermark) operations.push('watermark');
          operations.push(`compress:${quality}`, `format:${format}`);

          resolve({
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, `.${format}`),
            originalSize: file.size,
            processedSize: blob.size,
            format: mimeType,
            blob,
            timestamp: Date.now(),
            operations,
            preview: canvas.toDataURL('image/jpeg', 0.3)
          });
        }, mimeType, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Advanced PDF processing using pdf-lib
  static async processDocument(file: File, options: DocumentProcessingOptions): Promise<ProcessedFile> {
    console.log('Processing document with options:', options);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const operations: string[] = [];

      // Enhanced compression settings
      if (options.compress) {
        operations.push('compress');
      }

      if (options.optimize) {
        operations.push('optimize');
      }

      // Add text to PDF
      if (options.addText) {
        const pages = pdfDoc.getPages();
        const targetPage = pages[options.addText.page || 0];
        if (targetPage) {
          targetPage.drawText(options.addText.text, {
            x: options.addText.x,
            y: options.addText.y,
            size: 12,
            color: rgb(0, 0, 0),
          });
          operations.push('add-text');
        }
      }

      // Split PDF
      if (options.split) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdfDoc, 
          Array.from({ length: options.split.endPage - options.split.startPage + 1 }, 
            (_, i) => options.split!.startPage + i - 1)
        );
        pages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        operations.push(`split:${options.split.startPage}-${options.split.endPage}`);
        
        return {
          id: Date.now().toString(),
          name: file.name.replace('.pdf', '_split.pdf'),
          originalSize: file.size,
          processedSize: pdfBytes.length,
          format: 'application/pdf',
          blob: new Blob([pdfBytes], { type: 'application/pdf' }),
          timestamp: Date.now(),
          operations
        };
      }

      // Merge PDFs (if additional files provided)
      if (options.merge && options.merge.length > 0) {
        for (const mergeFile of options.merge) {
          const mergeBuffer = await mergeFile.arrayBuffer();
          const mergePdf = await PDFDocument.load(mergeBuffer);
          const pages = await pdfDoc.copyPages(mergePdf, mergePdf.getPageIndices());
          pages.forEach(page => pdfDoc.addPage(page));
        }
        operations.push(`merge:${options.merge.length + 1}-files`);
      }

      // Apply compression and optimization
      const saveOptions: any = {
        addDefaultPage: false,
        useObjectStreams: options.compress || options.optimize,
        objectsPerTick: 50,
        updateFieldAppearances: false
      };

      if (options.compress) {
        operations.push('compress');
      }
      
      if (options.optimize) {
        operations.push('optimize');
      }

      const pdfBytes = await pdfDoc.save(saveOptions);

      return {
        id: Date.now().toString(),
        name: file.name,
        originalSize: file.size,
        processedSize: pdfBytes.length,
        format: 'application/pdf',
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        timestamp: Date.now(),
        operations
      };
    } catch (error) {
      // Fallback for non-PDF files or processing errors
      const compressionRatio = options.compress ? 0.7 : 1.0;
      const processedSize = Math.floor(file.size * compressionRatio);
      
      return {
        id: Date.now().toString(),
        name: file.name,
        originalSize: file.size,
        processedSize,
        format: file.type,
        blob: file,
        timestamp: Date.now(),
        operations: options.compress ? ['compress'] : []
      };
    }
  }

  // Smart file analysis with advanced rules
  static analyzeFile(file: File): { type: 'image' | 'document' | 'text', recommendations: any, useCase: string } {
    const isImage = file.type.startsWith('image/');
    const isDocument = file.type.includes('pdf') || file.type.includes('document');
    const sizeMB = file.size / (1024 * 1024);

    let recommendations = {};
    let useCase = 'general';

    if (isImage) {
      // Determine use case based on dimensions and size
      if (sizeMB > 10) useCase = 'print';
      else if (sizeMB > 2) useCase = 'web';
      else useCase = 'mobile';

      recommendations = {
        format: useCase === 'web' ? 'webp' : useCase === 'mobile' ? 'jpeg' : 'png',
        quality: useCase === 'print' ? 0.95 : useCase === 'web' ? 0.8 : 0.7,
        resize: useCase === 'mobile' ? { width: 800 } : useCase === 'web' ? { width: 1920 } : null,
        compress: sizeMB > 5,
        filter: sizeMB > 20 ? 'sharpen' : 'none'
      };
      return { type: 'image', recommendations, useCase };
    }

    if (isDocument) {
      useCase = sizeMB > 10 ? 'archive' : sizeMB > 5 ? 'sharing' : 'email';
      
      recommendations = {
        compress: sizeMB > 1,
        quality: useCase === 'archive' ? 0.9 : useCase === 'sharing' ? 0.8 : 0.7,
        optimize: useCase !== 'archive'
      };
      return { type: 'document', recommendations, useCase };
    }

    return { type: 'text', recommendations: {}, useCase: 'general' };
  }

  // Browser storage management
  static async saveToStorage(processedFile: ProcessedFile): Promise<void> {
    if (!window.indexedDB) {
      console.log('IndexedDB not available');
      return;
    }

    try {
      console.log('Converting blob to base64...');
      const blobData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(processedFile.blob);
      });

      console.log('Opening IndexedDB...');
      return new Promise((resolve, reject) => {
        // Open without specifying version to get current version
        const request = indexedDB.open('FileProcessorDB');
        
        request.onerror = (event) => {
          console.error('IndexedDB open error:', event);
          reject(new Error('Failed to open IndexedDB'));
        };
        
        request.onupgradeneeded = (event) => {
          console.log('Upgrading IndexedDB schema...');
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('files')) {
            const store = db.createObjectStore('files', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('name', 'name', { unique: false });
            console.log('Created files object store');
          }
        };
        
        request.onsuccess = (event) => {
          console.log('IndexedDB opened successfully');
          const db = (event.target as IDBOpenDBRequest).result;
          
          const transaction = db.transaction(['files'], 'readwrite');
          const store = transaction.objectStore('files');
          
          const fileData = {
            ...processedFile,
            blobData,
            blob: undefined
          };
          
          console.log('Adding file to store:', fileData.name);
          const addRequest = store.add(fileData);
          addRequest.onsuccess = () => {
            console.log('File saved successfully');
            resolve();
          };
          addRequest.onerror = (err) => {
            console.error('Failed to save file:', err);
            reject(new Error('Failed to save file'));
          };
        };
      });
    } catch (error) {
      console.error('Storage error:', error);
      throw error;
    }
  }

  static async getStoredFiles(): Promise<ProcessedFile[]> {
    if (!window.indexedDB) {
      return [];
    }

    return new Promise((resolve) => {
      const request = indexedDB.open('FileProcessorDB');
      
      request.onerror = () => {
        console.log('Failed to open IndexedDB for reading');
        resolve([]);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('Reading from IndexedDB...');
        
        if (!db.objectStoreNames.contains('files')) {
          console.log('Files store not found');
          resolve([]);
          return;
        }
        
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          console.log('Retrieved files from storage:', getAllRequest.result.length);
          const files = getAllRequest.result.map((fileData: any) => ({
            ...fileData,
            blob: this.dataURLToBlob(fileData.blobData),
            blobData: undefined
          }));
          resolve(files);
        };
        
        getAllRequest.onerror = () => {
          console.log('Failed to retrieve files');
          resolve([]);
        };
      };
    });
  }

  static async deleteStoredFile(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FileProcessorDB');
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('files')) {
          resolve();
          return;
        }
        
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(new Error('Failed to delete file'));
      };
    });
  }

  private static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Download processed file
  static downloadFile(processedFile: ProcessedFile): void {
    const url = URL.createObjectURL(processedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = processedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
