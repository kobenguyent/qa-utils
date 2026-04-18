import { Button, Container } from 'react-bootstrap';
import { useState, useMemo, useCallback } from 'react';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

const CHAR_LIMIT_OPTIONS = [0, 140, 280, 500, 1000, 2000];

const statCard = (label: string, value: number | string, color: string, subtitle?: string) => (
  <div style={{
    flex: 1,
    minWidth: '110px',
    padding: '0.9rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-secondary)',
    border: `1px solid ${color}33`,
    textAlign: 'center',
    transition: 'border-color 0.2s',
  }}>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.2rem' }}>{label}</div>
    {subtitle && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.15rem', opacity: 0.7 }}>{subtitle}</div>}
  </div>
);

const readabilityLabel = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: 'Very Easy', color: '#34d399' };
  if (score >= 70) return { label: 'Easy', color: '#60a5fa' };
  if (score >= 60) return { label: 'Standard', color: '#f59e0b' };
  if (score >= 50) return { label: 'Fairly Difficult', color: '#fb923c' };
  if (score >= 30) return { label: 'Difficult', color: '#f87171' };
  return { label: 'Very Difficult', color: '#e879f9' };
};

export const CharacterCounter = () => {
  const [text, setText] = useState('');
  const [charLimit, setCharLimit] = useState(0);
  const [copied, setCopied] = useState(false);
  const ai = useAIAssistant();

  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const wordList = text.trim() === '' ? [] : text.trim().split(/\s+/);
    const words = wordList.length;
    const lines = text === '' ? 0 : text.split('\n').length;
    const paragraphs = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const sentenceMatches = text.match(/[^.!?]*[.!?]+/g) || [];
    const sentences = sentenceMatches.length;

    // Unique words
    const uniqueWords = new Set(wordList.map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean)).size;

    // Avg word length
    const avgWordLen = words === 0 ? 0 : Math.round((wordList.join('').replace(/[^a-z]/gi, '').length / words) * 10) / 10;

    // Avg sentence length (words per sentence)
    const avgSentenceLen = sentences === 0 ? 0 : Math.round((words / sentences) * 10) / 10;

    // Flesch Reading Ease approximation
    const syllableCount = wordList.reduce((acc, w) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (!clean) return acc;
      const s = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
        .replace(/^y/, '')
        .match(/[aeiouy]{1,2}/g);
      return acc + Math.max(1, s ? s.length : 1);
    }, 0);
    const fleschScore = words === 0 || sentences === 0
      ? 0
      : Math.min(100, Math.max(0, Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllableCount / words))));

    const readTime = words < 200 ? '<1' : `~${Math.round(words / 200)}`;

    const freq: Record<string, number> = {};
    wordList.forEach(w => {
      const clean = w.replace(/[^a-z]/gi, '').toLowerCase();
      if (clean.length > 2) freq[clean] = (freq[clean] || 0) + 1;
    });
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return { chars, charsNoSpace, words, lines, paragraphs, sentences, uniqueWords, avgWordLen, avgSentenceLen, fleschScore, readTime, topWords };
  }, [text]);

  const limitExceeded = charLimit > 0 && stats.chars > charLimit;
  const limitPct = charLimit > 0 ? Math.min(100, Math.round((stats.chars / charLimit) * 100)) : 0;
  const limitColor = limitPct > 90 ? '#f87171' : limitPct > 70 ? '#f59e0b' : '#34d399';

  const copyStats = useCallback(() => {
    const lines = [
      `Characters: ${stats.chars}`,
      `Characters (no spaces): ${stats.charsNoSpace}`,
      `Words: ${stats.words}`,
      `Unique words: ${stats.uniqueWords}`,
      `Sentences: ${stats.sentences}`,
      `Lines: ${stats.lines}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Avg word length: ${stats.avgWordLen}`,
      `Avg sentence length: ${stats.avgSentenceLen} words`,
      `Readability (Flesch): ${stats.fleschScore} / 100`,
      `Read time: ${stats.readTime} min`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [stats]);

  const readability = readabilityLabel(stats.fleschScore);

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🔢</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Character Counter</h1>
          <p className="tool-header-desc">Analyze text length, word frequency, and readability at a glance.</p>
        </div>
        {text && (
          <span className="tool-badge tool-badge-info" style={{ flexShrink: 0 }}>
            {stats.readTime} min read
          </span>
        )}
      </div>

      {/* Input */}
      <div className="tool-card mb-4">
        <div className="tool-card-header">
          ✏️ Input
          <div className="ms-auto d-flex align-items-center gap-2">
            {/* Character limit selector */}
            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 0 }}>Limit:</label>
            <select
              value={charLimit}
              onChange={e => setCharLimit(Number(e.target.value))}
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {CHAR_LIMIT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt === 0 ? 'None' : opt}</option>
              ))}
            </select>
            {text && (
              <Button
                size="sm"
                variant="outline-secondary"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                onClick={() => { setText(''); ai.clear(); }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="tool-card-body">
          <div style={{ position: 'relative' }}>
            <textarea
              className="tool-textarea"
              rows={8}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type or paste your text here..."
              style={{
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                paddingBottom: charLimit > 0 ? '2.2rem' : '0.75rem',
                borderColor: limitExceeded ? '#f87171' : undefined,
              }}
            />
            {/* Inline counter badge */}
            <div style={{
              position: 'absolute',
              bottom: '0.55rem',
              right: '0.75rem',
              fontSize: '0.72rem',
              color: limitExceeded ? '#f87171' : 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
              transition: 'color 0.2s',
            }}>
              {charLimit > 0
                ? `${stats.chars} / ${charLimit}`
                : stats.chars > 0 ? `${stats.chars} chars` : null}
            </div>
          </div>
          {charLimit > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: limitExceeded ? '#f87171' : 'var(--muted)' }}>
                  {limitExceeded ? `⚠️ ${stats.chars - charLimit} characters over limit` : `${charLimit - stats.chars} characters remaining`}
                </span>
                <span style={{ fontSize: '0.72rem', color: limitColor, fontWeight: 600 }}>
                  {stats.chars} / {charLimit}
                </span>
              </div>
              <div style={{ height: '4px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden' }}>
                <div style={{ width: `${limitPct}%`, height: '100%', borderRadius: '999px', background: limitColor, transition: 'width 0.2s, background 0.2s' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="tool-card mb-4">
        <div className="tool-card-header">
          📊 Stats
          {text && (
            <Button
              size="sm"
              variant="outline-secondary"
              className="ms-auto"
              style={{ fontSize: '0.72rem', padding: '0.18rem 0.55rem' }}
              onClick={copyStats}
            >
              {copied ? '✅ Copied' : '📋 Copy Stats'}
            </Button>
          )}
        </div>
        <div className="tool-card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.65rem' }}>
            {statCard('Characters', stats.chars, '#60a5fa')}
            {statCard('No Spaces', stats.charsNoSpace, '#34d399')}
            {statCard('Words', stats.words, '#f59e0b', `${stats.uniqueWords} unique`)}
            {statCard('Sentences', stats.sentences, '#f87171', `avg ${stats.avgSentenceLen}w`)}
            {statCard('Lines', stats.lines, '#a78bfa')}
            {statCard('Paragraphs', stats.paragraphs, '#e879f9')}
          </div>

          {/* Readability row */}
          {text.trim() && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: `1px solid ${readability.color}33`,
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Flesch Readability</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: readability.color }}>{stats.fleschScore}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>/100</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    background: `${readability.color}22`,
                    color: readability.color,
                    border: `1px solid ${readability.color}44`,
                  }}>{readability.label}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.fleschScore}%`, height: '100%', borderRadius: '999px', background: readability.color, transition: 'width 0.4s var(--ease)' }} />
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg word</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{stats.avgWordLen} chars</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top words */}
      {stats.topWords.length > 0 && (
        <div className="tool-card mb-4">
          <div className="tool-card-header">🏆 Top Words</div>
          <div className="tool-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {stats.topWords.map(([word, cnt], i) => {
                const max = stats.topWords[0][1];
                const pct = Math.round((cnt / max) * 100);
                const colors = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#f87171', '#e879f9', '#fb923c', '#38bdf8'];
                const color = colors[i % colors.length];
                return (
                  <div key={word} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ width: '18px', fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
                    <code style={{ width: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text)', flexShrink: 0 }}>
                      {word}
                    </code>
                    <div style={{ flex: 1, height: '7px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: color, transition: 'width 0.4s var(--ease)' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', width: '28px', textAlign: 'right', flexShrink: 0 }}>{cnt}×</span>
                    <span style={{ fontSize: '0.65rem', color, width: '30px', textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {ai.isConfigured ? (
        <div className="tool-card">
          <div className="tool-card-header">🤖 AI Analysis</div>
          <div className="tool-card-body">
            <AIAssistButton
              label="Analyze Text"
              onClick={async () => {
                try {
                  await ai.sendRequest(
                    'You are a text analysis expert. Analyze the provided text and give a brief summary including: reading level, tone/sentiment, language, key topics, and suggestions for improvement. Be concise.',
                    `Analyze this text:\n\n${text}`
                  );
                } catch { /* handled by AIAssistButton */ }
              }}
              isLoading={ai.isLoading}
              disabled={!text.trim()}
              error={ai.error}
              result={ai.result}
              onClear={ai.clear}
            />
          </div>
        </div>
      ) : (
        <AIConfigureHint />
      )}
    </Container>
  );
}

