import React, { useState, useRef, useCallback } from 'react';
import { Card, Button, Badge, Alert } from 'react-bootstrap';
import { matchPalaceCommand, isPalaceNavigationIntent } from '../../utils/palaceVoiceNav';

// Local Web Speech API type declarations (not always available in TypeScript lib)
interface SpeechRecognitionEvent extends Event {
  readonly results: { [index: number]: { [index: number]: { transcript: string } } };
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface CommandLog {
  transcript: string;
  matched: boolean;
  destination?: string;
  ts: number;
}

/**
 * VoicePalaceWalk — embeddable widget that listens for voice navigation commands
 * and navigates the app to the matching palace room/tool.
 */
export const VoicePalaceWalk: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const getSpeechRecognitionAPI = (): SpeechRecognitionConstructor | undefined => {
    if (typeof window === 'undefined') return undefined;
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition;
  };

  const isSupported = !!getSpeechRecognitionAPI();

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('🎙️ Listening… say "take me to the security room" or "open flashcards"');
      setError('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setStatus(`Heard: "${transcript}"`);
      const cmd = matchPalaceCommand(transcript);
      const hasIntent = isPalaceNavigationIntent(transcript);

      if (cmd) {
        setLogs(prev => [
          { transcript, matched: true, destination: cmd.description, ts: Date.now() },
          ...prev.slice(0, 9),
        ]);
        setStatus(`✅ Navigating to ${cmd.description}…`);
        setTimeout(() => {
          window.location.hash = cmd.path.replace('#', '');
        }, 600);
      } else if (hasIntent) {
        setLogs(prev => [
          { transcript, matched: false, ts: Date.now() },
          ...prev.slice(0, 9),
        ]);
        setStatus('❓ Room not recognised. Try "go to the generator lab" or "open flashcards".');
      } else {
        setStatus('💬 No navigation command detected. Try "take me to…" or "open…"');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('');
  }, []);

  if (!isSupported) {
    return (
      <Alert variant="warning" className="mt-3">
        🎙️ Voice navigation requires a browser that supports the Web Speech API (e.g. Chrome).
      </Alert>
    );
  }

  return (
    <Card className="mt-4" style={{ backgroundColor: 'var(--card-bg)' }}>
      <Card.Header className="d-flex align-items-center gap-2">
        <span>🎙️</span>
        <strong>Voice-Guided Palace Walk</strong>
        <Badge bg={isListening ? 'danger' : 'secondary'} className="ms-auto">
          {isListening ? '● LIVE' : '○ idle'}
        </Badge>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small mb-3">
          Say <em>"take me to the security room"</em>, <em>"open flashcards"</em>, or{' '}
          <em>"go to the generator lab"</em> and the palace will navigate for you.
        </p>
        <div className="d-flex gap-2 mb-3">
          <Button
            variant={isListening ? 'danger' : 'primary'}
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop voice navigation' : 'Start voice navigation'}
          >
            {isListening ? '⏹ Stop Listening' : '🎙️ Start Listening'}
          </Button>
        </div>
        {status && (
          <div
            className="p-2 rounded small mb-2"
            style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
          >
            {status}
          </div>
        )}
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        {logs.length > 0 && (
          <div>
            <p className="text-muted small mb-1">Recent commands:</p>
            {logs.map(log => (
              <div key={log.ts} className="d-flex align-items-center gap-2 small mb-1">
                <Badge bg={log.matched ? 'success' : 'secondary'}>
                  {log.matched ? '✅' : '—'}
                </Badge>
                <span className="text-muted">"{log.transcript}"</span>
                {log.destination && <span style={{ color: 'var(--success)' }}>→ {log.destination}</span>}
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
