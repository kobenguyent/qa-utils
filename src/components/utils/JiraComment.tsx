import { Container } from 'react-bootstrap';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { useUA } from 'use-ua-parser-js';
import CopyWithToast from '../CopyWithToast.tsx';

const chip = (label: string, value: string, color: string) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    background: `color-mix(in srgb, ${color} 10%, transparent)`,
    border: `1px solid ${color}44`,
    fontSize: '0.72rem',
    fontWeight: 600,
    color,
  }}>
    <span style={{ opacity: 0.7 }}>{label}</span>
    <span>{value}</span>
  </div>
);

export const JiraComment = () => {
  const UADetails = useUA();
  const osInfo = `${UADetails?.os.name ?? 'Unknown'}`;
  const browserInfo = `${UADetails?.browser.name} - ${UADetails?.browser.version}`;

  const [selectedContent, setSelectedContent] = useState('frontend');

  const postContentFE = `{panel:title= Test Setup}
(i)
||Environment|LOCALHOST|
||OS details|${osInfo} |
||Browsers|${browserInfo}|
||Branch|...|
||Commit|...|
{panel}

*QA passed* (/)
 * Scenario  (/)

Ticket will be marked as Done. 🎉`;

  const postContentBE = `1. APP: [url] - "version": "v1.0.0"

||Scenarios||Request||Response||Status||
| Scenario |GET endpoint|200 OK|(/)|

Ticket will be marked as Done. 🎉`;

  const postContent = selectedContent === 'frontend' ? postContentFE : postContentBE;

  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">📋</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">JIRA Comment Generator</h1>
          <p className="tool-header-desc">Auto-generate QA test setup comments for Jira tickets.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', alignItems: 'start' }}>

        {/* Left: Settings */}
        <div className="tool-card">
          <div className="tool-card-header">⚙️ Settings</div>
          <div className="tool-card-body">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
              Type
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {[{ v: 'frontend', label: '🖥 Frontend' }, { v: 'backend', label: '⚙️ Backend' }].map(({ v, label }) => {
                const active = selectedContent === v;
                return (
                  <button
                    key={v}
                    onClick={() => setSelectedContent(v)}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: active ? 'var(--primary-light)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text)',
                      fontWeight: 600,
                      fontSize: '0.83rem',
                      cursor: 'pointer',
                      transition: 'all var(--duration) var(--ease)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
              Environment Info
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {chip('OS', osInfo, '#60a5fa')}
              {chip('Browser', UADetails?.browser.name ?? 'Unknown', '#34d399')}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="tool-card">
          <div className="tool-card-header">
            👁 Preview
            <div className="tool-action-row ms-auto">
              <CopyWithToast text={postContent} />
            </div>
          </div>
          <div className="tool-card-body">
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.83rem',
              lineHeight: 1.7,
              color: 'var(--text)',
            }}>
              <Markdown>{postContent}</Markdown>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Raw Jira markup:</div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                border: '1px dashed var(--border-color)',
                color: 'var(--muted)',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}>
                {postContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
