import { describe, it, expect } from 'vitest';
import {
  obfuscateText,
  deobfuscateText,
  obfuscateMessages,
  summarizeDetections,
  ObfuscationOptions,
} from '../dataObfuscator';
import { ChatMessage } from '../aiChatClient';

describe('dataObfuscator', () => {
  // ---------------------------------------------------------------------------
  // obfuscateText
  // ---------------------------------------------------------------------------
  describe('obfuscateText', () => {
    it('should obfuscate an email address', () => {
      const result = obfuscateText('Contact us at hello@example.com for support.');
      expect(result.obfuscatedText).not.toContain('hello@example.com');
      expect(result.obfuscatedText).toContain('[EMAIL_1]');
      expect(result.detectedItems).toHaveLength(1);
      expect(result.detectedItems[0].type).toBe('email');
      expect(result.detectedItems[0].original).toBe('hello@example.com');
      expect(result.mapping.get('[EMAIL_1]')).toBe('hello@example.com');
    });

    it('should obfuscate multiple emails with incrementing labels', () => {
      const result = obfuscateText('Send to alice@example.com and bob@test.org');
      expect(result.obfuscatedText).toContain('[EMAIL_1]');
      expect(result.obfuscatedText).toContain('[EMAIL_2]');
      expect(result.detectedItems).toHaveLength(2);
    });

    it('should reuse the same placeholder for the same email', () => {
      const result = obfuscateText('From: alice@example.com, To: alice@example.com');
      expect(result.obfuscatedText).toBe('From: [EMAIL_1], To: [EMAIL_1]');
      expect(result.detectedItems).toHaveLength(1);
    });

    it('should obfuscate a US phone number', () => {
      const result = obfuscateText('Call me at 555-867-5309');
      expect(result.obfuscatedText).not.toContain('555-867-5309');
      expect(result.obfuscatedText).toContain('[PHONE_1]');
      expect(result.detectedItems[0].type).toBe('phone');
    });

    it('should obfuscate a credit card number', () => {
      const result = obfuscateText('Card number: 4111 1111 1111 1111');
      expect(result.obfuscatedText).toContain('[CARD_1]');
      expect(result.detectedItems[0].type).toBe('creditCard');
    });

    it('should obfuscate a social security number', () => {
      const result = obfuscateText('SSN: 123-45-6789');
      expect(result.obfuscatedText).toContain('[SSN_1]');
      expect(result.detectedItems[0].type).toBe('ssn');
    });

    it('should obfuscate a JWT token', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = obfuscateText(`Token: ${jwt}`);
      expect(result.obfuscatedText).toContain('[JWT_1]');
      expect(result.obfuscatedText).not.toContain(jwt);
      expect(result.detectedItems[0].type).toBe('jwt');
    });

    it('should obfuscate an IPv4 address', () => {
      const result = obfuscateText('Server is at 192.168.1.100');
      expect(result.obfuscatedText).toContain('[IP_1]');
      expect(result.detectedItems[0].type).toBe('ipAddress');
    });

    it('should NOT obfuscate localhost (127.0.0.1)', () => {
      const result = obfuscateText('Listening on 127.0.0.1:8080');
      expect(result.obfuscatedText).toContain('127.0.0.1');
      expect(result.detectedItems).toHaveLength(0);
    });

    it('should obfuscate a URL with embedded credentials', () => {
      const result = obfuscateText('Connect to https://admin:secret@db.example.com/mydb');
      expect(result.obfuscatedText).toContain('[URL_CRED_1]');
      expect(result.detectedItems[0].type).toBe('urlCredentials');
    });

    it('should obfuscate an API key pattern (Bearer token)', () => {
      const result = obfuscateText('Authorization: Bearer abcdefghijklmnopqrstuv1234567890');
      expect(result.obfuscatedText).toContain('[API_KEY_1]');
      expect(result.detectedItems[0].type).toBe('apiKey');
    });

    it('should obfuscate a PEM private key', () => {
      const pemKey = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----';
      const result = obfuscateText(`Key:\n${pemKey}`);
      expect(result.obfuscatedText).toContain('[PRIVATE_KEY_1]');
      expect(result.obfuscatedText).not.toContain('BEGIN RSA PRIVATE KEY');
      expect(result.detectedItems[0].type).toBe('privateKey');
    });

    it('should return an unchanged string and empty mapping when no sensitive data is found', () => {
      const text = 'Hello, how are you doing today?';
      const result = obfuscateText(text);
      expect(result.obfuscatedText).toBe(text);
      expect(result.detectedItems).toHaveLength(0);
      expect(result.mapping.size).toBe(0);
    });

    it('should respect the patterns option and skip disabled types', () => {
      const options: ObfuscationOptions = { patterns: ['phone'] };
      const result = obfuscateText('Email: test@example.com Phone: 555-867-5309', options);
      // Email should NOT be obfuscated
      expect(result.obfuscatedText).toContain('test@example.com');
      // Phone should be obfuscated
      expect(result.obfuscatedText).toContain('[PHONE_1]');
    });
  });

  // ---------------------------------------------------------------------------
  // deobfuscateText
  // ---------------------------------------------------------------------------
  describe('deobfuscateText', () => {
    it('should restore a previously obfuscated email', () => {
      const original = 'Contact at alice@example.com';
      const { obfuscatedText, mapping } = obfuscateText(original);
      const restored = deobfuscateText(obfuscatedText, mapping);
      expect(restored).toBe(original);
    });

    it('should restore multiple different sensitive values', () => {
      const original = 'Email: alice@example.com, Phone: 555-867-5309';
      const { obfuscatedText, mapping } = obfuscateText(original);
      const restored = deobfuscateText(obfuscatedText, mapping);
      expect(restored).toBe(original);
    });

    it('should return the same string when mapping is empty', () => {
      const text = 'Nothing sensitive here';
      const restored = deobfuscateText(text, new Map());
      expect(restored).toBe(text);
    });

    it('should handle multiple occurrences of the same placeholder', () => {
      const original = 'alice@example.com and alice@example.com';
      const { obfuscatedText, mapping } = obfuscateText(original);
      expect(obfuscatedText).toBe('[EMAIL_1] and [EMAIL_1]');
      const restored = deobfuscateText(obfuscatedText, mapping);
      expect(restored).toBe(original);
    });
  });

  // ---------------------------------------------------------------------------
  // obfuscateMessages
  // ---------------------------------------------------------------------------
  describe('obfuscateMessages', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are an assistant. Owner: admin@corp.com' },
      { role: 'user', content: 'My email is user@example.com and card is 4111 1111 1111 1111' },
      { role: 'assistant', content: 'Got it!' },
      { role: 'user', content: 'Also reach me at user@example.com' },
    ];

    it('should obfuscate only user messages by default', () => {
      const result = obfuscateMessages(messages);
      // System message unchanged
      expect(result.messages[0].content).toContain('admin@corp.com');
      // User messages obfuscated
      expect(result.messages[1].content).toContain('[EMAIL_1]');
      expect(result.messages[1].content).toContain('[CARD_1]');
      // Assistant message unchanged
      expect(result.messages[2].content).toBe('Got it!');
    });

    it('should reuse the same placeholder across different user messages', () => {
      const result = obfuscateMessages(messages);
      // user@example.com should map to [EMAIL_1] in both user messages
      expect(result.messages[1].content).toContain('[EMAIL_1]');
      expect(result.messages[3].content).toContain('[EMAIL_1]');
      expect(result.mapping.size).toBeGreaterThanOrEqual(2); // email + card
    });

    it('should obfuscate system messages when obfuscateSystemMessages is true', () => {
      const result = obfuscateMessages(messages, { obfuscateSystemMessages: true });
      expect(result.messages[0].content).not.toContain('admin@corp.com');
      expect(result.messages[0].content).toContain('[EMAIL_1]');
    });

    it('should return an empty detectedItems array when no sensitive data is found', () => {
      const plainMessages: ChatMessage[] = [
        { role: 'user', content: 'What is the weather today?' },
      ];
      const result = obfuscateMessages(plainMessages);
      expect(result.detectedItems).toHaveLength(0);
      expect(result.mapping.size).toBe(0);
    });

    it('should not mutate the original messages array', () => {
      const original = [{ role: 'user' as const, content: 'My email is test@test.com' }];
      obfuscateMessages(original);
      expect(original[0].content).toBe('My email is test@test.com');
    });
  });

  // ---------------------------------------------------------------------------
  // summarizeDetections
  // ---------------------------------------------------------------------------
  describe('summarizeDetections', () => {
    it('should return an empty string when no items are detected', () => {
      expect(summarizeDetections([])).toBe('');
    });

    it('should describe a single detected item', () => {
      const { detectedItems } = obfuscateText('Contact: hello@example.com');
      const summary = summarizeDetections(detectedItems);
      expect(summary).toContain('email');
    });

    it('should describe multiple detected types', () => {
      const { detectedItems } = obfuscateText('Email: alice@example.com, Phone: 555-867-5309');
      const summary = summarizeDetections(detectedItems);
      expect(summary).toContain('email');
      expect(summary).toContain('phone');
    });

    it('should use plural form for multiple occurrences of the same type', () => {
      const { detectedItems } = obfuscateText('alice@example.com and bob@example.com');
      const summary = summarizeDetections(detectedItems);
      expect(summary).toContain('2 email addresses');
    });
  });
});
