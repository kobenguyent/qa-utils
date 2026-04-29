import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OtpGenerator } from '../OtpGenerator';

// Mock CopyWithToast
vi.mock('../../CopyWithToast', () => ({
  default: () => null,
}));

// Mock react-circular-progressbar
vi.mock('react-circular-progressbar', () => ({
  CircularProgressbar: () => null,
  buildStyles: () => ({}),
}));

// Mock window.otplib — mirroring otplib v13 API: generateSync({secret, digits, algorithm})
const mockGenerateSync = vi.fn().mockReturnValue('123456');
Object.defineProperty(window, 'otplib', {
  value: {
    generateSync: mockGenerateSync,
  },
  writable: true,
  configurable: true,
});

const VALID_SECRET = 'JBSWY3DPEHPK3PXP'; // 16-char base32 key

describe('OtpGenerator Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockGenerateSync.mockReturnValue('123456');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the OTP Generator heading', () => {
    render(<OtpGenerator />);
    expect(screen.getByText('OTP Generator')).toBeInTheDocument();
  });

  it('renders algorithm selection buttons', () => {
    render(<OtpGenerator />);
    expect(screen.getByText('SHA-1')).toBeInTheDocument();
    expect(screen.getByText('SHA-256')).toBeInTheDocument();
    expect(screen.getByText('SHA-512')).toBeInTheDocument();
  });

  it('renders digit selection buttons', () => {
    render(<OtpGenerator />);
    const digitButtons = screen.getAllByRole('button').filter(btn =>
      ['6', '7', '8'].includes(btn.textContent ?? '')
    );
    expect(digitButtons.length).toBe(3);
  });

  it('defaults to SHA-1 algorithm', () => {
    render(<OtpGenerator />);
    const sha1Note = screen.getByText(/Default algorithm per RFC 6238/);
    expect(sha1Note).toBeInTheDocument();
  });

  it('defaults to 6 digits', () => {
    render(<OtpGenerator />);
    const digitNote = screen.getByText(/Standard 6-digit OTP/);
    expect(digitNote).toBeInTheDocument();
  });

  it('changes algorithm note when SHA-256 is selected', () => {
    render(<OtpGenerator />);
    fireEvent.click(screen.getByText('SHA-256'));
    expect(screen.getByText(/Stronger hashing algorithm/)).toBeInTheDocument();
  });

  it('changes algorithm note when SHA-512 is selected', () => {
    render(<OtpGenerator />);
    fireEvent.click(screen.getByText('SHA-512'));
    expect(screen.getByText(/Maximum strength hashing/)).toBeInTheDocument();
  });

  it('changes digit note when 8 is selected', () => {
    render(<OtpGenerator />);
    const digitButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '8');
    fireEvent.click(digitButtons[0]);
    expect(screen.getByText(/8-digit OTP for higher security/)).toBeInTheDocument();
  });

  it('shows validation error for invalid secret key length', () => {
    render(<OtpGenerator />);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: 'SHORT' } });
    expect(screen.getByText('Must be 16 or 32 characters')).toBeInTheDocument();
  });

  it('Generate OTP button is disabled when secret is invalid', () => {
    render(<OtpGenerator />);
    const generateBtn = screen.getByRole('button', { name: /Generate OTP/i });
    expect(generateBtn).toBeDisabled();
  });

  it('Generate OTP button is enabled when secret is valid', () => {
    render(<OtpGenerator />);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: VALID_SECRET } });
    const generateBtn = screen.getByRole('button', { name: /Generate OTP/i });
    expect(generateBtn).not.toBeDisabled();
  });

  it('calls otplib.generateSync with correct default options on generate', () => {
    render(<OtpGenerator />);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: VALID_SECRET } });
    const generateBtn = screen.getByRole('button', { name: /Generate OTP/i });
    fireEvent.click(generateBtn);
    expect(mockGenerateSync).toHaveBeenCalledWith({ secret: VALID_SECRET, digits: 6, algorithm: 'sha1' });
  });

  it('calls otplib.generateSync with selected digits and algorithm', () => {
    render(<OtpGenerator />);
    // Select SHA-512
    fireEvent.click(screen.getByText('SHA-512'));
    // Select 8 digits
    const eightBtn = screen.getAllByRole('button').filter(btn => btn.textContent === '8')[0];
    fireEvent.click(eightBtn);
    // Enter valid secret
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: VALID_SECRET } });
    // Generate
    const generateBtn = screen.getByRole('button', { name: /Generate OTP/i });
    fireEvent.click(generateBtn);
    expect(mockGenerateSync).toHaveBeenCalledWith({ secret: VALID_SECRET, digits: 8, algorithm: 'sha512' });
  });

  it('saves entry to localStorage with digits and algorithm on generate', () => {
    render(<OtpGenerator />);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: VALID_SECRET } });
    fireEvent.click(screen.getByRole('button', { name: /Generate OTP/i }));

    const stored = JSON.parse(localStorage.getItem('secretKeys') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].key).toBe(VALID_SECRET);
    expect(stored[0].digits).toBe('6');
    expect(stored[0].algorithm).toBe('sha1');
  });

  it('saves entry to localStorage with selected SHA-256 and 7 digits', () => {
    render(<OtpGenerator />);
    fireEvent.click(screen.getByText('SHA-256'));
    const sevenBtn = screen.getAllByRole('button').filter(btn => btn.textContent === '7')[0];
    fireEvent.click(sevenBtn);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: VALID_SECRET } });
    fireEvent.click(screen.getByRole('button', { name: /Generate OTP/i }));

    const stored = JSON.parse(localStorage.getItem('secretKeys') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].digits).toBe('7');
    expect(stored[0].algorithm).toBe('sha256');
  });

  it('shows saved accounts section', () => {
    render(<OtpGenerator />);
    expect(screen.getByText(/Saved Accounts/)).toBeInTheDocument();
    expect(screen.getByText('No saved accounts. Generate an OTP to auto-save.')).toBeInTheDocument();
  });

  it('loads existing saved accounts from localStorage', () => {
    localStorage.setItem('secretKeys', JSON.stringify([
      { name: 'GitHub', key: VALID_SECRET, timestamp: '1/1/2024', digits: '8', algorithm: 'sha512' },
    ]));
    render(<OtpGenerator />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('restores digits and algorithm when clicking Use on a saved account', () => {
    localStorage.setItem('secretKeys', JSON.stringify([
      { name: 'Work', key: VALID_SECRET, timestamp: '1/1/2024', digits: '8', algorithm: 'sha512' },
    ]));
    render(<OtpGenerator />);
    const useBtn = screen.getByRole('button', { name: 'Use' });
    fireEvent.click(useBtn);
    expect(mockGenerateSync).toHaveBeenCalledWith({ secret: VALID_SECRET, digits: 8, algorithm: 'sha512' });
  });

  it('shows algorithm and digits badges for saved entries', () => {
    localStorage.setItem('secretKeys', JSON.stringify([
      { name: 'MyApp', key: VALID_SECRET, timestamp: '1/1/2024', digits: '8', algorithm: 'sha256' },
    ]));
    render(<OtpGenerator />);
    expect(screen.getByText('SHA256')).toBeInTheDocument();
    expect(screen.getByText('8 digits')).toBeInTheDocument();
  });

  it('clear all removes all saved accounts', () => {
    localStorage.setItem('secretKeys', JSON.stringify([
      { name: 'Test', key: VALID_SECRET, timestamp: '1/1/2024' },
    ]));
    render(<OtpGenerator />);
    const clearAllBtn = screen.getByRole('button', { name: 'Clear All' });
    fireEvent.click(clearAllBtn);
    expect(screen.getByText('No saved accounts. Generate an OTP to auto-save.')).toBeInTheDocument();
    expect(localStorage.getItem('secretKeys')).toBeNull();
  });

  it('show/hide secret key toggle works', () => {
    render(<OtpGenerator />);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    expect(secretInput).toHaveAttribute('type', 'password');
    const showBtn = screen.getByRole('button', { name: 'Show' });
    fireEvent.click(showBtn);
    expect(secretInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('clear button resets the form', () => {
    render(<OtpGenerator />);
    const secretInput = screen.getByPlaceholderText('16 or 32 character key');
    fireEvent.change(secretInput, { target: { value: VALID_SECRET } });
    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearBtn);
    expect((secretInput as HTMLInputElement).value).toBe('');
  });
});
