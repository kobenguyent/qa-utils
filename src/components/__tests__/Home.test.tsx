import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Home } from '../Home';
import * as randomToolModule from '../../utils/randomTool';

// Mock the getRandomTool function
vi.mock('../../utils/randomTool', () => ({
  getRandomTool: vi.fn()
}));

describe('Home Component', () => {
  const mockTool = {
    title: 'UUID Generator',
    description: 'Generate UUIDs v1 and v4',
    path: '#/uuid',
    category: 'Generators',
    keywords: ['uuid', 'guid', 'generate'],
    icon: '🆔'
  };

  it('should render the welcome message', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    
    render(<Home />);
    
    expect(screen.getByText('Welcome to QA Utils')).toBeDefined();
    expect(screen.getByText(/A comprehensive collection of quality assurance tools/)).toBeDefined();
  });

  it('should display a random tool on mount', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    
    render(<Home />);
    
    expect(screen.getByText(/Try a Random Tool/)).toBeDefined();
    expect(screen.getByText('🆔 UUID Generator')).toBeDefined();
    expect(screen.getByText('Generate UUIDs v1 and v4')).toBeDefined();
  });

  it('should have a link to the random tool', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    
    render(<Home />);
    
    const toolLink = screen.getByRole('button', { name: /Visit UUID Generator/ });
    expect(toolLink).toBeDefined();
    expect(toolLink.getAttribute('href')).toBe('#/uuid');
  });

  it('should update random tool when "Try Another" is clicked', () => {
    const newMockTool = {
      title: 'Password Generator',
      description: 'Generate secure random passwords',
      path: '#/password',
      category: 'Generators',
      keywords: ['password', 'generate'],
      icon: '🔑'
    };

    const getRandomToolSpy = vi.spyOn(randomToolModule, 'getRandomTool');
    getRandomToolSpy.mockReturnValueOnce(mockTool);
    getRandomToolSpy.mockReturnValueOnce(newMockTool);
    
    render(<Home />);
    
    // Initial tool
    expect(screen.getByText('🆔 UUID Generator')).toBeDefined();
    
    // Click "Try Another" button
    const tryAnotherButton = screen.getByRole('button', { name: /Get another random tool/ });
    fireEvent.click(tryAnotherButton);
    
    // Should show new tool
    expect(screen.getByText('🔑 Password Generator')).toBeDefined();
    expect(screen.getByText('Generate secure random passwords')).toBeDefined();
    expect(getRandomToolSpy).toHaveBeenCalledTimes(2);
  });

  it('should have proper ARIA labels for accessibility', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    
    render(<Home />);
    
    expect(screen.getByRole('button', { name: /Visit UUID Generator/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Get another random tool/ })).toBeDefined();
  });
});
