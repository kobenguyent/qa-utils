import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChecklistRoom } from '../ChecklistRoom';

describe('ChecklistRoom', () => {
  it('renders children in list mode', () => {
    render(
      <ChecklistRoom title="Security Testing" icon="🔒" roomMode={false}>
        <p>Some checklist content</p>
      </ChecklistRoom>
    );
    expect(screen.getByText('Some checklist content')).toBeDefined();
  });

  it('renders Mark Room Complete button in room mode', () => {
    render(
      <ChecklistRoom title="Security Testing" icon="🔒" roomMode={true}>
        <p>Content</p>
      </ChecklistRoom>
    );
    expect(screen.getByRole('button', { name: /Mark Security Testing room as complete/i })).toBeDefined();
  });

  it('collapses content when room is marked complete', () => {
    render(
      <ChecklistRoom title="Security Testing" icon="🔒" roomMode={true}>
        <p>Secret content</p>
      </ChecklistRoom>
    );
    const btn = screen.getByRole('button', { name: /Mark Security Testing room as complete/i });
    fireEvent.click(btn);
    expect(screen.queryByText('Secret content')).toBeNull();
    expect(screen.getByText('Room visited!')).toBeDefined();
  });

  it('can reopen a visited room', () => {
    render(
      <ChecklistRoom title="Security Testing" icon="🔒" roomMode={true}>
        <p>Secret content</p>
      </ChecklistRoom>
    );
    fireEvent.click(screen.getByRole('button', { name: /Mark Security Testing room as complete/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reopen room Security Testing/i }));
    expect(screen.getByText('Secret content')).toBeDefined();
  });
});
