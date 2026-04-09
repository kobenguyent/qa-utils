import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, ProgressBar, Badge, Row, Col } from 'react-bootstrap';
import {
  FlashCard,
  sm2,
  loadFlashCards,
  saveFlashCards,
  getDueCards,
} from '../../utils/spacedRepetition';

const ROOM_THRESHOLDS = {
  shadowed: 2,   // repetitions < 2 → shadowed room
  learning: 4,   // 2-4 → learning
  mastered: 5,   // >= 5 → golden
};

function getRoomState(card: FlashCard): 'shadowed' | 'learning' | 'mastered' {
  if (card.repetitions < ROOM_THRESHOLDS.shadowed) return 'shadowed';
  if (card.repetitions < ROOM_THRESHOLDS.mastered) return 'learning';
  return 'mastered';
}

export const Flashcards: React.FC = () => {
  const [cards, setCards] = useState<FlashCard[]>(() => loadFlashCards());
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, passed: 0 });

  const refreshDue = useCallback((updated: FlashCard[]) => {
    const due = getDueCards(updated);
    setDueCards(due);
    if (due.length === 0) setSessionDone(true);
  }, []);

  useEffect(() => {
    refreshDue(cards);
  }, []);

  const currentCard: FlashCard | undefined = dueCards[currentIndex];

  const handleRate = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return;
    const updatedCard = sm2(currentCard, quality);
    const updatedCards = cards.map(c => (c.id === updatedCard.id ? updatedCard : c));
    saveFlashCards(updatedCards);
    setCards(updatedCards);
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      passed: quality >= 3 ? prev.passed + 1 : prev.passed,
    }));
    setRevealed(false);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= dueCards.length) {
      refreshDue(updatedCards);
      setCurrentIndex(0);
      setSessionDone(getDueCards(updatedCards).length === 0);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleReset = () => {
    const reset = loadFlashCards().map(c => ({ ...c }));
    setCards(reset);
    saveFlashCards(reset);
    setSessionStats({ reviewed: 0, passed: 0 });
    setCurrentIndex(0);
    setRevealed(false);
    setSessionDone(false);
    refreshDue(reset);
  };

  const totalCards = cards.length;
  const shadowedCards = cards.filter(c => getRoomState(c) === 'shadowed');
  const learningCards = cards.filter(c => getRoomState(c) === 'learning');
  const masteredCards = cards.filter(c => getRoomState(c) === 'mastered');

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h1>🃏 Spaced Repetition Flashcards</h1>
        <p className="lead text-muted">
          Review QA concepts anchored to memory-palace stations. Cards surface based on your recall
          strength using the SM-2 algorithm.
        </p>
      </div>

      {/* Stats bar */}
      <Row className="mb-4 g-2 text-center">
        <Col xs={4}>
          <Badge bg="secondary" className="w-100 py-2" style={{ fontSize: '0.9rem' }}>
            🌑 Shadowed: {shadowedCards.length}
          </Badge>
        </Col>
        <Col xs={4}>
          <Badge bg="warning" text="dark" className="w-100 py-2" style={{ fontSize: '0.9rem' }}>
            📖 Learning: {learningCards.length}
          </Badge>
        </Col>
        <Col xs={4}>
          <Badge bg="success" className="w-100 py-2" style={{ fontSize: '0.9rem' }}>
            ✨ Mastered: {masteredCards.length}
          </Badge>
        </Col>
      </Row>

      {/* Progress */}
      <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
          <small className="text-muted">Cards due today: {dueCards.length}</small>
          <small className="text-muted">Session: {sessionStats.reviewed} reviewed, {sessionStats.passed} passed</small>
        </div>
        <ProgressBar
          now={totalCards > 0 ? (masteredCards.length / totalCards) * 100 : 0}
          label={`${masteredCards.length}/${totalCards} mastered`}
          variant="success"
          style={{ height: '0.6rem' }}
        />
      </div>

      {sessionDone ? (
        <Card className="text-center p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
          <Card.Body>
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <h3>Session Complete!</h3>
            <p className="text-muted">
              You reviewed {sessionStats.reviewed} card{sessionStats.reviewed !== 1 ? 's' : ''}.{' '}
              {sessionStats.passed} passed. No more cards due right now.
            </p>
            <p className="text-muted small">Come back later for the next scheduled review.</p>
            <Button variant="outline-primary" onClick={handleReset}>
              🔄 Reset All Progress
            </Button>
          </Card.Body>
        </Card>
      ) : currentCard ? (
        <Card className="shadow-sm" style={{ backgroundColor: 'var(--card-bg)', minHeight: 280 }}>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Badge bg="info" text="dark">{currentCard.category}</Badge>
            <small className="text-muted">
              Card {currentIndex + 1} of {dueCards.length} due
            </small>
          </Card.Header>
          <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-4">
            <h4 className="mb-4">{currentCard.front}</h4>

            {!revealed ? (
              <Button variant="primary" onClick={() => setRevealed(true)} aria-label="Reveal answer">
                🔍 Reveal Answer
              </Button>
            ) : (
              <div className="w-100">
                <div
                  className="p-3 rounded mb-3"
                  style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
                >
                  <p className="mb-0">{currentCard.back}</p>
                </div>
                {currentCard.mnemonic && (
                  <div
                    className="p-3 rounded mb-4"
                    style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)', borderLeft: '4px solid var(--bs-info)' }}
                  >
                    <small><strong>🖼️ Memory Anchor:</strong> {currentCard.mnemonic}</small>
                  </div>
                )}
                <p className="text-muted small mb-2">How well did you recall this?</p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button variant="danger" size="sm" onClick={() => handleRate(0)} aria-label="Again - did not recall">
                    ❌ Again
                  </Button>
                  <Button variant="warning" size="sm" onClick={() => handleRate(3)} aria-label="Hard - recalled with difficulty">
                    😓 Hard
                  </Button>
                  <Button variant="info" size="sm" onClick={() => handleRate(4)} aria-label="Good - recalled correctly">
                    👍 Good
                  </Button>
                  <Button variant="success" size="sm" onClick={() => handleRate(5)} aria-label="Easy - recalled instantly">
                    ⚡ Easy
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
          <Card.Footer>
            <small className="text-muted">
              Room status:{' '}
              {getRoomState(currentCard) === 'shadowed' && '🌑 Shadowed Room — needs more visits'}
              {getRoomState(currentCard) === 'learning' && '📖 Learning Room — coming into the light'}
              {getRoomState(currentCard) === 'mastered' && '✨ Golden Room — well memorised'}
            </small>
          </Card.Footer>
        </Card>
      ) : (
        <Card className="text-center p-4" style={{ backgroundColor: 'var(--card-bg)' }}>
          <Card.Body>
            <p className="text-muted">Loading cards…</p>
          </Card.Body>
        </Card>
      )}

      {/* Palace Room Map */}
      <Card className="mt-4" style={{ backgroundColor: 'var(--card-bg)' }}>
        <Card.Header>
          <h6 className="mb-0">🏛️ Your Memory Palace Map</h6>
        </Card.Header>
        <Card.Body>
          <p className="text-muted small mb-3">
            Each card lives in a palace room. Shadowed rooms need more visits; golden rooms are memorised.
          </p>
          <div className="d-flex flex-wrap gap-2">
            {cards.map(card => (
              <div
                key={card.id}
                title={`${card.front} — ${getRoomState(card)}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  backgroundColor:
                    getRoomState(card) === 'mastered'
                      ? '#198754'
                      : getRoomState(card) === 'learning'
                      ? '#ffc107'
                      : '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  cursor: 'default',
                  color: '#fff',
                }}
                aria-label={`${card.id}: ${getRoomState(card)}`}
              >
                {getRoomState(card) === 'mastered' ? '✨' : getRoomState(card) === 'learning' ? '📖' : '🌑'}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};
