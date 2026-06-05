import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JSONFormatter } from '../JSONFormatter';

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="zoom-wrapper">
      {typeof children === 'function'
        ? children({
            zoomIn: () => undefined,
            zoomOut: () => undefined,
            resetTransform: () => undefined,
            centerView: () => undefined,
          })
        : children}
    </div>
  ),
  TransformComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="zoom-component">{children}</div>
  ),
}));

vi.mock('../../CopyWithToast', () => ({ default: () => null }));
vi.mock('../../AIAssistButton', () => ({ AIAssistButton: () => null }));
vi.mock('../../AIConfigureHint', () => ({ AIConfigureHint: () => null }));

describe('JSONFormatter relationship graph mode', () => {
  it('renders view toggles and switches to relationship graph mode', () => {
    render(<JSONFormatter />);

    expect(screen.getByRole('button', { name: /Tree View/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Key Relationship Graph/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Key Relationship Graph/i }));
    expect(screen.getByTestId('json-relationship-graph')).toBeInTheDocument();
  });

  it('does not render the relationship graph when JSON is invalid', () => {
    render(<JSONFormatter />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/i);
    fireEvent.change(textarea, { target: { value: '{ bad json' } });
    fireEvent.click(screen.getByRole('button', { name: /Key Relationship Graph/i }));

    expect(screen.getByText(/Fix JSON to see the relationship graph/i)).toBeInTheDocument();
  });

  it('renders graph and node details for valid JSON', () => {
    render(<JSONFormatter />);

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/i);
    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          user: { name: 'Alice' },
          active: true,
        }),
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Key Relationship Graph/i }));
    expect(screen.getByTestId('json-relationship-graph')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Select graph node user/i));
    expect(screen.getByText(/JSON Path/i)).toBeInTheDocument();
    expect(screen.getByText('$.user')).toBeInTheDocument();
  });

  it('opens the relationship graph in a larger modal canvas', () => {
    render(<JSONFormatter />);

    fireEvent.click(screen.getByRole('button', { name: /Key Relationship Graph/i }));
    fireEvent.click(screen.getByRole('button', { name: /Open larger key relationship graph/i }));

    expect(screen.getByTestId('json-relationship-graph-modal')).toBeInTheDocument();
    expect(screen.getByText(/Canvas Tips/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pan with drag/i).length).toBeGreaterThan(0);
  });

  it('shows truncation warning for oversized graphs', () => {
    render(<JSONFormatter />);

    const hugeObject = {
      items: Array.from({ length: 350 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      })),
    };

    const textarea = screen.getByPlaceholderText(/Paste your JSON here/i);
    fireEvent.change(textarea, { target: { value: JSON.stringify(hugeObject) } });
    fireEvent.click(screen.getByRole('button', { name: /Key Relationship Graph/i }));

    expect(screen.getByText(/Graph truncated/i)).toBeInTheDocument();
  });
});
