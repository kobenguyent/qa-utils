import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { removeBackground as imglyRemoveBackground, Config as ImglyConfig } from '@imgly/background-removal';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp';

export interface ConversionOptions {
    quality?: number; // 0.1 - 1.0
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
    backgroundColor?: string;
    dpi?: number;
}

export interface ConvertedFile {
    id: string;
    name: string;
    blob: Blob;
    format: string;
    originalSize: number;
    convertedSize: number;
    preview?: string;
    timestamp: number;
}

export interface PDFConversionOptions extends ConversionOptions {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'fit';
    margin?: number;
    title?: string;
}

export interface ImageExtractionOptions extends ConversionOptions {
    format?: ImageFormat;
    pageRange?: { start: number; end: number };
    scale?: number;
}

export interface BackgroundRemovalOptions {
    quality?: number;
    outputFormat?: 'png' | 'webp';
    model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
    progress?: (progress: number) => void;
}

/**
 * Media Converter - Browser-based file format conversion
 */
export class MediaConverter {
    /**
     * Convert multiple images to a single PDF document
     */
    static async imagesToPdf(
        files: File[],
        options: PDFConversionOptions = {}
    ): Promise<ConvertedFile> {
        const {
            pageSize = 'A4',
            margin = 40,
            title = 'Converted Document',
            quality = 0.92
        } = options;

        const pdfDoc = await PDFDocument.create();

        // Page dimensions in points (72 points = 1 inch)
        const pageSizes: Record<string, [number, number]> = {
            'A4': [595.28, 841.89],
            'Letter': [612, 792],
            'Legal': [612, 1008],
            'fit': [0, 0] // Will be determined by image size
        };

        for (const file of files) {
            // Load and process image
            const imageBytes = await file.arrayBuffer();
            let image;

            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(imageBytes);
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(imageBytes);
            } else {
                // Convert other formats to PNG first
                const convertedBlob = await this.convertImageFormat(file, 'png', { quality });
                const convertedBytes = await convertedBlob.blob.arrayBuffer();
                image = await pdfDoc.embedPng(convertedBytes);
            }

            const imgWidth = image.width;
            const imgHeight = image.height;

            let pageWidth: number;
            let pageHeight: number;

            if (pageSize === 'fit') {
                pageWidth = imgWidth + margin * 2;
                pageHeight = imgHeight + margin * 2;
            } else {
                [pageWidth, pageHeight] = pageSizes[pageSize];
            }

            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Calculate scaled dimensions to fit within page
            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2;

            let drawWidth = imgWidth;
            let drawHeight = imgHeight;

            if (imgWidth > availableWidth || imgHeight > availableHeight) {
                const scaleX = availableWidth / imgWidth;
                const scaleY = availableHeight / imgHeight;
                const scale = Math.min(scaleX, scaleY);
                drawWidth = imgWidth * scale;
                drawHeight = imgHeight * scale;
            }

            // Center the image on the page
            const x = (pageWidth - drawWidth) / 2;
            const y = (pageHeight - drawHeight) / 2;

            page.drawImage(image, {
                x,
                y,
                width: drawWidth,
                height: drawHeight
            });
        }

        // Set document metadata
        pdfDoc.setTitle(title);
        pdfDoc.setCreator('QA Utils Media Converter');
        pdfDoc.setProducer('QA Utils');
        pdfDoc.setCreationDate(new Date());

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);

        return {
            id: `pdf-${Date.now()}`,
            name: `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
            blob,
            format: 'application/pdf',
            originalSize: totalOriginalSize,
            convertedSize: blob.size,
            timestamp: Date.now()
        };
    }

    /**
     * Extract images from PDF pages
     */
    static async pdfToImages(
        file: File,
        options: ImageExtractionOptions = {}
    ): Promise<ConvertedFile[]> {
        const {
            format = 'png',
            scale = 2,
            pageRange,
            quality = 0.92
        } = options;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        const numPages = pdf.numPages;
        const startPage = pageRange?.start || 1;
        const endPage = Math.min(pageRange?.end || numPages, numPages);

        const results: ConvertedFile[] = [];

        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Fill background for JPEG
            if (format === 'jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            await page.render({
                canvasContext: ctx,
                viewport
            } as unknown as Parameters<typeof page.render>[0]).promise;

            const mimeType = `image/${format}`;
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
                    mimeType,
                    quality
                );
            });

            const baseName = file.name.replace(/\.pdf$/i, '');

            results.push({
                id: `img-${Date.now()}-${pageNum}`,
                name: `${baseName}_page_${pageNum}.${format}`,
                blob,
                format: mimeType,
                originalSize: file.size,
                convertedSize: blob.size,
                preview: canvas.toDataURL(mimeType, 0.3),
                timestamp: Date.now()
            });
        }

        return results;
    }

    /**
     * Convert image from one format to another
     */
    static async convertImageFormat(
        file: File,
        targetFormat: ImageFormat,
        options: ConversionOptions = {}
    ): Promise<ConvertedFile> {
        const {
            quality = 0.92,
            width,
            height,
            maintainAspectRatio = true,
            backgroundColor = '#ffffff'
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Calculate dimensions
                let targetWidth = width || img.width;
                let targetHeight = height || img.height;

                if (maintainAspectRatio && (width || height)) {
                    const aspectRatio = img.width / img.height;
                    if (width && !height) {
                        targetHeight = width / aspectRatio;
                    } else if (height && !width) {
                        targetWidth = height * aspectRatio;
                    } else if (width && height) {
                        const scaleX = width / img.width;
                        const scaleY = height / img.height;
                        const scale = Math.min(scaleX, scaleY);
                        targetWidth = img.width * scale;
                        targetHeight = img.height * scale;
                    }
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // Fill background for formats that don't support transparency
                if (targetFormat === 'jpeg' || targetFormat === 'bmp') {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                const mimeType = `image/${targetFormat}`;

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to convert image'));
                            return;
                        }

                        const baseName = file.name.replace(/\.[^/.]+$/, '');

                        resolve({
                            id: `converted-${Date.now()}`,
                            name: `${baseName}.${targetFormat}`,
                            blob,
                            format: mimeType,
                            originalSize: file.size,
                            convertedSize: blob.size,
                            preview: canvas.toDataURL(mimeType, 0.3),
                            timestamp: Date.now()
                        });
                    },
                    mimeType,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Batch convert multiple images to a target format
     */
    static async batchConvertImages(
        files: File[],
        targetFormat: ImageFormat,
        options: ConversionOptions = {}
    ): Promise<ConvertedFile[]> {
        const results: ConvertedFile[] = [];

        for (const file of files) {
            try {
                const converted = await this.convertImageFormat(file, targetFormat, options);
                results.push(converted);
            } catch (error) {
                console.error(`Failed to convert ${file.name}:`, error);
            }
        }

        return results;
    }

    /**
     * Get file information
     */
    static getFileInfo(file: File): { type: 'image' | 'pdf' | 'unknown'; extension: string } {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extension)) {
            return { type: 'image', extension };
        }

        if (file.type === 'application/pdf' || extension === 'pdf') {
            return { type: 'pdf', extension };
        }

        return { type: 'unknown', extension };
    }

    /**
     * Get supported formats for conversion
     */
    static getSupportedFormats(): { images: ImageFormat[]; documents: string[] } {
        return {
            images: ['png', 'jpeg', 'webp', 'gif', 'bmp'],
            documents: ['pdf']
        };
    }

    /**
     * Download a converted file
     */
    static downloadFile(convertedFile: ConvertedFile): void {
        const url = URL.createObjectURL(convertedFile.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = convertedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Download multiple files as individual downloads
     */
    static downloadMultipleFiles(files: ConvertedFile[]): void {
        files.forEach((file, index) => {
            setTimeout(() => this.downloadFile(file), index * 300);
        });
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Remove background from an image using AI-based segmentation
     */
    static async removeBackground(
        file: File,
        options: BackgroundRemovalOptions = {}
    ): Promise<ConvertedFile> {
        const {
            quality = 0.92,
            outputFormat = 'png',
            model = 'isnet',
            progress
        } = options;

        // Configure the background removal
        const mimeFormat = outputFormat === 'webp' ? 'image/webp' : 'image/png';
        const config: ImglyConfig = {
            model: model,
            output: {
                format: mimeFormat,
                quality
            },
            progress: progress ? (_key: string, current: number, total: number) => {
                progress(current / total);
            } : undefined
        };

        try {
            // Create a blob from the file for processing
            const imageBlob = new Blob([await file.arrayBuffer()], { type: file.type });

            // Remove the background
            const resultBlob = await imglyRemoveBackground(imageBlob, config);

            // Generate preview
            const previewUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(resultBlob);
            });

            const baseName = file.name.replace(/\.[^/.]+$/, '');

            return {
                id: `bg-removed-${Date.now()}`,
                name: `${baseName}_no_bg.${outputFormat}`,
                blob: resultBlob,
                format: `image/${outputFormat}`,
                originalSize: file.size,
                convertedSize: resultBlob.size,
                preview: previewUrl,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Background removal failed:', error);
            throw new Error(`Failed to remove background: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Batch remove backgrounds from multiple images
     */
    static async batchRemoveBackground(
        files: File[],
        options: BackgroundRemovalOptions = {}
    ): Promise<ConvertedFile[]> {
        const results: ConvertedFile[] = [];

        for (let i = 0; i < files.length; i++) {
            try {
                // Wrap progress to account for batch processing
                const batchProgress = options.progress
                    ? (p: number) => options.progress!((i + p) / files.length)
                    : undefined;

                const converted = await this.removeBackground(files[i], {
                    ...options,
                    progress: batchProgress
                });
                results.push(converted);
            } catch (error) {
                console.error(`Failed to remove background from ${files[i].name}:`, error);
            }
        }

        return results;
    }
}
