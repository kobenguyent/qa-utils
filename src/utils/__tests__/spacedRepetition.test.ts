import { describe, it, expect } from 'vitest';
import {
  sm2,
  qaFlashCards,
  getDueCards,
  FlashCard,
} from '../spacedRepetition';

describe('sm2 algorithm', () => {
  const baseCard: FlashCard = {
    id: 'test',
    front: 'Q',
    back: 'A',
    category: 'Test',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: Date.now() - 1000, // already due
  };

  it('resets interval and repetitions on quality < 3', () => {
    const result = sm2(baseCard, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('advances interval on quality >= 3 from 0 reps', () => {
    const result = sm2(baseCard, 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('advances interval to 6 after second pass', () => {
    const card1 = sm2(baseCard, 4);
    const card2 = sm2(card1, 4);
    expect(card2.interval).toBe(6);
    expect(card2.repetitions).toBe(2);
  });

  it('increases ease factor on quality 5', () => {
    const result = sm2(baseCard, 5);
    expect(result.easeFactor).toBeGreaterThan(baseCard.easeFactor);
  });

  it('does not allow ease factor below 1.3', () => {
    const weakCard = { ...baseCard, easeFactor: 1.3 };
    const result = sm2(weakCard, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('sets nextReview in the future', () => {
    const result = sm2(baseCard, 4);
    expect(result.nextReview).toBeGreaterThan(Date.now());
  });

  it('sets lastReview', () => {
    const result = sm2(baseCard, 4);
    expect(result.lastReview).toBeDefined();
  });
});

describe('qaFlashCards', () => {
  it('has at least 20 cards', () => {
    expect(qaFlashCards.length).toBeGreaterThanOrEqual(20);
  });

  it('all cards have required fields', () => {
    for (const card of qaFlashCards) {
      expect(card.id).toBeTruthy();
      expect(card.front).toBeTruthy();
      expect(card.back).toBeTruthy();
      expect(card.category).toBeTruthy();
      expect(card.easeFactor).toBeGreaterThan(0);
      expect(card.interval).toBeGreaterThan(0);
      expect(card.repetitions).toBeGreaterThanOrEqual(0);
    }
  });

  it('all cards have mnemonics', () => {
    for (const card of qaFlashCards) {
      expect(card.mnemonic).toBeTruthy();
    }
  });
});

describe('getDueCards', () => {
  it('returns cards whose nextReview is in the past', () => {
    const now = Date.now();
    const due = [
      { ...qaFlashCards[0], nextReview: now - 1000 },
      { ...qaFlashCards[1], nextReview: now + 100000 },
    ];
    const result = getDueCards(due);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(qaFlashCards[0].id);
  });
});
