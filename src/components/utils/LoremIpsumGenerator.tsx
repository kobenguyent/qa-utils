import React, { useState, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

const LOREM_WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
  'aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit',
  'voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
  'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt',
  'mollit','anim','id','est','laborum',
];

const randWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
const randSentence = () => {
  const words = Array.from({ length: Math.floor(Math.random() * 10) + 8 }, randWord);
  return words.join(' ').replace(/^\w/, c => c.toUpperCase()) + '.';
};
const randParagraph = () =>
  Array.from({ length: Math.floor(Math.random() * 4) + 4 }, randSentence).join(' ');

const TYPE_OPTS = [
  { key: 'paragraphs', label: '¶ Paragraphs', max: 10 },
  { key: 'sentences',  label: '— Sentences',  max: 20 },
  { key: 'words',      label: '∿ Words',       max: 100 },
] as const;
type GenType = typeof TYPE_OPTS[number]['key'];

export const LoremIpsumGenerator: React.FC = () => {
  const [type, setType] = useState<GenType>('paragraphs');
  const [count, setCount] = useState(3);
  const [text, setText] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const ai = useAIAssistant();

  const maxCount = (TYPE_OPTS.find(t => t.key === type) ?? TYPE_OPTS[0]).max;

  const generateText = () => {
    if (type === 'paragraphs')
      setText(Array.from({ length: count }, randParagraph).join('\n\n'));
    else if (type === 'sentences')
      setText(Array.from({ length: count }, randSentence).join(' '));
    else
      setText(Array.from({ length: count }, randWord).join(' '));
  };

  const stats = useMemo(() => ({
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    chars: text.length,
  }), [text]);

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">📝</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Lorem Ipsum Generator</h1>
          <p className="tool-header-desc">Generate placeholder text for designs and mockups.</p>
        </div>
        {text && (
          <span className="tool-badge tool-badge-muted" style={{ flexShrink: 0 }}>
            {stats.words}w · {stats.chars}c
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1rem', alignItems: 'start' }}>

        {/* Settings */}
        <div className="tool-card">
          <div className="tool-card-header">⚙️ Settings</div>
          <div className="tool-card-body">
            {/* Type pills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                Type
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {TYPE_OPTS.map(opt => {
                  const active = type === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => { setType(opt.key); setCount(Math.min(count, opt.max)); }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: active ? 'var(--primary-light)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.83rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all var(--duration) var(--ease)',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count slider */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Count</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>{count}</span>
              </div>
              <input
                type="range"
                min={1}
                max={maxCount}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                <span>1</span><span>{maxCount}</span>
              </div>
            </div>

            <Button variant="primary" onClick={generateText} className="w-100 mb-3">
              ⟳ Generate
            </Button>

            {ai.isConfigured ? (
              <>
                <hr style={{ borderColor: 'var(--border-color)', margin: '0.75rem 0' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                  🤖 AI Topic
                </div>
                <input
                  type="text"
                  className="tool-textarea"
                  style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.6rem', height: 'auto', minHeight: 'unset' }}
                  placeholder="e.g. e-commerce product descriptions"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                />
                <AIAssistButton
                  label="Generate AI Text"
                  onClick={async () => {
                    try {
                      const response = await ai.sendRequest(
                        'You are a content writer. Generate realistic placeholder text. Return ONLY the text.',
                        `Generate ${count} ${type} of realistic placeholder text about: ${aiTopic || 'general topics'}.`
                      );
                      setText(response);
                    } catch { /* handled */ }
                  }}
                  isLoading={ai.isLoading}
                  error={ai.error}
                  onClear={ai.clear}
                />
              </>
            ) : (
              <AIConfigureHint className="mt-2" />
            )}
          </div>
        </div>

        {/* Output */}
        <div className="tool-card">
          <div className="tool-card-header">
            📄 Output
            {text && (
              <div className="tool-action-row ms-auto">
                <CopyWithToast text={text} />
              </div>
            )}
          </div>
          <div className="tool-card-body">
            {text ? (
              <textarea
                className="tool-output"
                style={{ minHeight: '340px' }}
                value={text}
                readOnly
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Click <strong>Generate</strong> to create Lorem Ipsum text
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};
