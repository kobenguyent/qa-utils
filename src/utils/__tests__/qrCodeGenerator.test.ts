/**
 * QR Code Generator Utility Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    formatWiFi,
    formatVCard,
    formatEmail,
    formatSMS,
    formatPhone,
    generateQRCodeDataURL,
    generateQRCodeSVG,
    getDynamicQRHistory,
    createDynamicQREntry,
    deleteDynamicQREntry,
    clearDynamicQRHistory,
} from '../qrCodeGenerator';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('QR Code Generator Utility', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    describe('formatWiFi', () => {
        it('should format WPA WiFi config correctly', () => {
            const result = formatWiFi({
                ssid: 'MyNetwork',
                password: 'secret123',
                encryption: 'WPA',
            });
            expect(result).toBe('WIFI:T:WPA;S:MyNetwork;P:secret123;;');
        });

        it('should format WEP WiFi config correctly', () => {
            const result = formatWiFi({
                ssid: 'MyNetwork',
                password: 'abc123',
                encryption: 'WEP',
            });
            expect(result).toBe('WIFI:T:WEP;S:MyNetwork;P:abc123;;');
        });

        it('should format open WiFi network', () => {
            const result = formatWiFi({
                ssid: 'OpenWifi',
                password: '',
                encryption: 'nopass',
            });
            expect(result).toBe('WIFI:T:nopass;S:OpenWifi;;');
        });

        it('should handle hidden network', () => {
            const result = formatWiFi({
                ssid: 'HiddenNet',
                password: 'pass',
                encryption: 'WPA',
                hidden: true,
            });
            expect(result).toBe('WIFI:T:WPA;S:HiddenNet;P:pass;H:true;;');
        });

        it('should escape special characters in SSID', () => {
            const result = formatWiFi({
                ssid: 'My;Net:work',
                password: 'pass',
                encryption: 'WPA',
            });
            expect(result).toContain('S:My\\;Net\\:work');
        });
    });

    describe('formatVCard', () => {
        it('should format basic vCard correctly', () => {
            const result = formatVCard({
                firstName: 'John',
                lastName: 'Doe',
            });
            expect(result).toContain('BEGIN:VCARD');
            expect(result).toContain('VERSION:3.0');
            expect(result).toContain('N:Doe;John');
            expect(result).toContain('FN:John Doe');
            expect(result).toContain('END:VCARD');
        });

        it('should include optional fields', () => {
            const result = formatVCard({
                firstName: 'Jane',
                lastName: 'Smith',
                organization: 'ACME Corp',
                title: 'Engineer',
                email: 'jane@acme.com',
                phone: '+1234567890',
                website: 'https://jane.com',
            });
            expect(result).toContain('ORG:ACME Corp');
            expect(result).toContain('TITLE:Engineer');
            expect(result).toContain('EMAIL:jane@acme.com');
            expect(result).toContain('TEL:+1234567890');
            expect(result).toContain('URL:https://jane.com');
        });
    });

    describe('formatEmail', () => {
        it('should format basic email correctly', () => {
            const result = formatEmail({ to: 'test@example.com' });
            expect(result).toBe('mailto:test@example.com');
        });

        it('should include subject and body', () => {
            const result = formatEmail({
                to: 'test@example.com',
                subject: 'Hello World',
                body: 'Test message',
            });
            expect(result).toBe('mailto:test@example.com?subject=Hello%20World&body=Test%20message');
        });

        it('should encode special characters', () => {
            const result = formatEmail({
                to: 'test@example.com',
                subject: 'Hello & Goodbye',
            });
            expect(result).toContain('subject=Hello%20%26%20Goodbye');
        });
    });

    describe('formatSMS', () => {
        it('should format basic SMS correctly', () => {
            const result = formatSMS({ phone: '+1234567890' });
            expect(result).toBe('sms:+1234567890');
        });

        it('should include message', () => {
            const result = formatSMS({
                phone: '+1234567890',
                message: 'Hello there',
            });
            expect(result).toBe('sms:+1234567890?body=Hello%20there');
        });
    });

    describe('formatPhone', () => {
        it('should format phone number correctly', () => {
            const result = formatPhone('+1234567890');
            expect(result).toBe('tel:+1234567890');
        });
    });

    describe('generateQRCodeDataURL', () => {
        it('should generate a data URL', async () => {
            const result = await generateQRCodeDataURL('https://example.com');
            expect(result).toMatch(/^data:image\/png;base64,/);
        });

        it('should accept custom options', async () => {
            const result = await generateQRCodeDataURL('test', {
                width: 128,
                margin: 1,
                color: { dark: '#ff0000', light: '#00ff00' },
                errorCorrectionLevel: 'H',
            });
            expect(result).toMatch(/^data:image\/png;base64,/);
        });
    });

    describe('generateQRCodeSVG', () => {
        it('should generate SVG string', async () => {
            const result = await generateQRCodeSVG('https://example.com');
            expect(result).toContain('<svg');
            expect(result).toContain('</svg>');
        });
    });

    describe('Dynamic QR History', () => {
        it('should start with empty history', () => {
            const history = getDynamicQRHistory();
            expect(history).toEqual([]);
        });

        it('should create and store dynamic QR entry', () => {
            const entry = createDynamicQREntry('https://example.com', 'url');

            expect(entry.id).toHaveLength(8);
            expect(entry.originalContent).toBe('https://example.com');
            expect(entry.contentType).toBe('url');
            expect(entry.scanCount).toBe(0);
            expect(entry.shortUrl).toContain(entry.id);

            const history = getDynamicQRHistory();
            expect(history).toHaveLength(1);
            expect(history[0].id).toBe(entry.id);
        });

        it('should delete dynamic QR entry', () => {
            const entry = createDynamicQREntry('test', 'text');
            expect(getDynamicQRHistory()).toHaveLength(1);

            deleteDynamicQREntry(entry.id);
            expect(getDynamicQRHistory()).toHaveLength(0);
        });

        it('should clear all history', () => {
            createDynamicQREntry('test1', 'text');
            createDynamicQREntry('test2', 'url');
            expect(getDynamicQRHistory()).toHaveLength(2);

            clearDynamicQRHistory();
            expect(getDynamicQRHistory()).toHaveLength(0);
        });

        it('should limit history to 50 entries', () => {
            for (let i = 0; i < 55; i++) {
                createDynamicQREntry(`test${i}`, 'text');
            }

            const history = getDynamicQRHistory();
            expect(history.length).toBeLessThanOrEqual(50);
        });
    });
});
