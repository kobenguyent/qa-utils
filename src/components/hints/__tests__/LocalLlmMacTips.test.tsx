import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalLlmMacTips } from '../LocalLlmMacTips';

describe('LocalLlmMacTips', () => {
  it('renders the page title', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText('Local LLM on Mac (16 GB RAM)')).toBeDefined();
  });

  it('renders the recommended models section', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('✅ Recommended Models for 16 GB RAM')).toBeDefined();
    expect(screen.getAllByText('Gemma 3 12B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Llama 3.1 8B').length).toBeGreaterThan(0);
  });

  it('renders the Ollama configuration section', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('🦙 Ollama Configuration Tips')).toBeDefined();
  });

  it('renders the swap tuning section', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('💾 macOS Swap Tuning')).toBeDefined();
  });

  it('renders the production deployment tips', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('🚀 Production Deployment Tips')).toBeDefined();
  });

  it('renders the quick start guide', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('🎯 Quick Start: Recommended Setup for 16 GB RAM')).toBeDefined();
  });

  it('renders the quantization cheat sheet', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('🔧 Quantization Cheat Sheet')).toBeDefined();
    expect(screen.getAllByText('Q4_K_M').length).toBeGreaterThan(0);
  });

  it('renders the further reading section', () => {
    render(<LocalLlmMacTips />);
    expect(screen.getByText('📚 Further Reading')).toBeDefined();
  });
});
