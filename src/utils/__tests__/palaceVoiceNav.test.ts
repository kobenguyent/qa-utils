import { describe, it, expect } from 'vitest';
import { matchPalaceCommand, isPalaceNavigationIntent } from '../palaceVoiceNav';

describe('matchPalaceCommand', () => {
  it('matches "take me to the palace"', () => {
    const cmd = matchPalaceCommand('take me to the palace');
    expect(cmd).not.toBeNull();
    expect(cmd?.path).toBe('#/palace');
  });

  it('matches "open flashcards"', () => {
    const cmd = matchPalaceCommand('open flashcards');
    expect(cmd).not.toBeNull();
    expect(cmd?.path).toBe('#/flashcards');
  });

  it('matches "go to the coverage palace"', () => {
    const cmd = matchPalaceCommand('go to the coverage palace');
    expect(cmd).not.toBeNull();
    expect(cmd?.path).toBe('#/coverage-palace');
  });

  it('matches "take me to my palace"', () => {
    const cmd = matchPalaceCommand('take me to my palace');
    expect(cmd).not.toBeNull();
    expect(cmd?.path).toBe('#/my-palace');
  });

  it('returns null for unrecognised transcript', () => {
    const cmd = matchPalaceCommand('hello world');
    expect(cmd).toBeNull();
  });

  it('matches case-insensitively', () => {
    const cmd = matchPalaceCommand('OPEN FLASHCARDS');
    expect(cmd).not.toBeNull();
  });
});

describe('isPalaceNavigationIntent', () => {
  it('detects "take me to"', () => {
    expect(isPalaceNavigationIntent('take me to the security room')).toBe(true);
  });

  it('detects "go to"', () => {
    expect(isPalaceNavigationIntent('go to flashcards')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isPalaceNavigationIntent('just a random sentence')).toBe(false);
  });
});
