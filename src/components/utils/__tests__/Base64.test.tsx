import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Base64 } from '../Base64';

vi.mock('../../CopyWithToast', () => ({
  default: () => null,
}));
vi.mock('../../AIAssistButton', () => ({
  AIAssistButton: () => null,
}));
vi.mock('../../AIConfigureHint', () => ({
  AIConfigureHint: () => null,
}));

describe('Base64 Component', () => {
  it('renders the heading', () => {
    render(<Base64 />);
    expect(screen.getByRole('heading', { name: 'Base64 Encode / Decode' })).toBeInTheDocument();
  });

  it('renders the mode toggle button group', () => {
    render(<Base64 />);
    const modeGroup = screen.getByRole('group', { name: /select mode/i });
    expect(modeGroup).toBeInTheDocument();
    expect(within(modeGroup).getByText('⬆️ Encode')).toBeInTheDocument();
    expect(within(modeGroup).getByText('⬇️ Decode')).toBeInTheDocument();
  });

  it('switches to decode mode and updates placeholder', () => {
    render(<Base64 />);
    const modeGroup = screen.getByRole('group', { name: /select mode/i });
    fireEvent.click(within(modeGroup).getByText('⬇️ Decode'));
    expect(screen.getByPlaceholderText(/Paste Base64 string to decode/i)).toBeInTheDocument();
  });

  it('encodes input text on button click', () => {
    render(<Base64 />);
    const textarea = screen.getByPlaceholderText(/Enter text to encode/i);
    fireEvent.change(textarea, { target: { value: 'hello' } });
    // The action-row Encode button is the second one rendered (after the mode toggle button)
    const allEncodeButtons = screen.getAllByText('⬆️ Encode');
    // Click the action-row encode button (not the mode toggle one)
    const actionEncode = allEncodeButtons.find(
      btn => btn.closest('.tool-action-row') !== null
    );
    expect(actionEncode).toBeDefined();
    if (actionEncode) {
      fireEvent.click(actionEncode);
    }
    const outputTextarea = screen.getByPlaceholderText(/Result will appear here/i);
    expect((outputTextarea as HTMLTextAreaElement).value).toBe('aGVsbG8=');
  });

  it('shows input character count badge when input is non-empty', () => {
    render(<Base64 />);
    const textarea = screen.getByPlaceholderText(/Enter text to encode/i);
    fireEvent.change(textarea, { target: { value: 'abc' } });
    expect(screen.getByText(/3.*chars/)).toBeInTheDocument();
  });
});

