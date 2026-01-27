/**
 * QR Code Generator Utility
 * Supports static and dynamic QR code generation with various content types
 */

import QRCode from 'qrcode';

// Types
export type QRContentType = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'sms' | 'phone';
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QROptions {
    width?: number;
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
    errorCorrectionLevel?: QRErrorCorrectionLevel;
}

export interface WiFiConfig {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
    hidden?: boolean;
}

export interface VCardConfig {
    firstName: string;
    lastName: string;
    organization?: string;
    title?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
}

export interface EmailConfig {
    to: string;
    subject?: string;
    body?: string;
}

export interface SMSConfig {
    phone: string;
    message?: string;
}

export interface DynamicQREntry {
    id: string;
    originalContent: string;
    contentType: QRContentType;
    createdAt: string;
    scanCount: number;
    shortUrl: string;
}

const STORAGE_KEY = 'qa-utils-dynamic-qr-history';

/**
 * Format WiFi configuration for QR code
 */
export function formatWiFi(config: WiFiConfig): string {
    const hidden = config.hidden ? 'H:true;' : '';
    const password = config.password ? `P:${escapeSpecialChars(config.password)};` : '';
    return `WIFI:T:${config.encryption};S:${escapeSpecialChars(config.ssid)};${password}${hidden};`;
}

/**
 * Format vCard for QR code
 */
export function formatVCard(config: VCardConfig): string {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${config.lastName};${config.firstName}`,
        `FN:${config.firstName} ${config.lastName}`,
    ];

    if (config.organization) lines.push(`ORG:${config.organization}`);
    if (config.title) lines.push(`TITLE:${config.title}`);
    if (config.email) lines.push(`EMAIL:${config.email}`);
    if (config.phone) lines.push(`TEL:${config.phone}`);
    if (config.address) lines.push(`ADR:;;${config.address};;;;`);
    if (config.website) lines.push(`URL:${config.website}`);

    lines.push('END:VCARD');
    return lines.join('\n');
}

/**
 * Format email for QR code (mailto: URI)
 */
export function formatEmail(config: EmailConfig): string {
    const params: string[] = [];
    if (config.subject) params.push(`subject=${encodeURIComponent(config.subject)}`);
    if (config.body) params.push(`body=${encodeURIComponent(config.body)}`);

    const paramString = params.length > 0 ? `?${params.join('&')}` : '';
    return `mailto:${config.to}${paramString}`;
}

/**
 * Format SMS for QR code
 */
export function formatSMS(config: SMSConfig): string {
    if (config.message) {
        return `sms:${config.phone}?body=${encodeURIComponent(config.message)}`;
    }
    return `sms:${config.phone}`;
}

/**
 * Format phone number for QR code
 */
export function formatPhone(phone: string): string {
    return `tel:${phone}`;
}

/**
 * Escape special characters for WiFi QR codes
 */
function escapeSpecialChars(str: string): string {
    return str.replace(/[\\;,:"]/g, '\\$&');
}

/**
 * Generate QR code as data URL (PNG)
 */
export async function generateQRCodeDataURL(
    content: string,
    options: QROptions = {}
): Promise<string> {
    const qrOptions: QRCode.QRCodeToDataURLOptions = {
        width: options.width || 256,
        margin: options.margin ?? 2,
        color: {
            dark: options.color?.dark || '#000000',
            light: options.color?.light || '#ffffff',
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    };

    return QRCode.toDataURL(content, qrOptions);
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
    content: string,
    options: QROptions = {}
): Promise<string> {
    const qrOptions: QRCode.QRCodeToStringOptions = {
        type: 'svg',
        width: options.width || 256,
        margin: options.margin ?? 2,
        color: {
            dark: options.color?.dark || '#000000',
            light: options.color?.light || '#ffffff',
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    };

    return QRCode.toString(content, qrOptions);
}

/**
 * Generate a unique short ID for dynamic QR codes
 */
function generateShortId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Create a dynamic QR entry and store it in localStorage
 */
export function createDynamicQREntry(
    content: string,
    contentType: QRContentType
): DynamicQREntry {
    const id = generateShortId();
    const entry: DynamicQREntry = {
        id,
        originalContent: content,
        contentType,
        createdAt: new Date().toISOString(),
        scanCount: 0,
        shortUrl: `${window.location.origin}${window.location.pathname}#/qr/${id}`,
    };

    // Save to localStorage
    const history = getDynamicQRHistory();
    history.unshift(entry);

    // Keep only last 50 entries
    const trimmedHistory = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));

    return entry;
}

/**
 * Get dynamic QR history from localStorage
 */
export function getDynamicQRHistory(): DynamicQREntry[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Get a specific dynamic QR entry by ID
 */
export function getDynamicQREntry(id: string): DynamicQREntry | null {
    const history = getDynamicQRHistory();
    return history.find(entry => entry.id === id) || null;
}

/**
 * Delete a dynamic QR entry
 */
export function deleteDynamicQREntry(id: string): void {
    const history = getDynamicQRHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Update a dynamic QR entry
 */
export function updateDynamicQREntry(id: string, updates: Partial<DynamicQREntry>): void {
    const history = getDynamicQRHistory();
    const index = history.findIndex(entry => entry.id === id);
    if (index !== -1) {
        history[index] = { ...history[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
}

/**
 * Clear all dynamic QR history
 */
export function clearDynamicQRHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Download QR code as image file
 */
export function downloadQRCode(dataUrl: string, filename = 'qrcode'): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Download QR code as SVG file
 */
export function downloadQRCodeSVG(svgString: string, filename = 'qrcode'): void {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
