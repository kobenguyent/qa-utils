import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Home } from '../Home';
import * as randomToolModule from '../../utils/randomTool';
import * as quotesModule from '../../utils/quotes';

// Mock the getRandomTool function
vi.mock('../../utils/randomTool', () => ({
  getRandomTool: vi.fn()
}));

// Mock the getRandomQuote function
vi.mock('../../utils/quotes', () => ({
  getRandomQuote: vi.fn()
}));

// Mock ThemeContext so AmbientDots can render without a ThemeProvider
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
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

  const mockQuote = {
    text: 'Quality is not an act, it is a habit.',
    author: 'Aristotle'
  };

  it('should render the title', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);
    
    render(<Home />);
    
    expect(screen.getByRole('heading', { name: /QA Utils/i })).toBeDefined();
    expect(screen.getByText(/developer tools for testing, converting/)).toBeDefined();
  });

  it('should display a random quote on mount', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);
    
    render(<Home />);
    
    expect(screen.getByText(/"Quality is not an act, it is a habit."/)).toBeDefined();
    expect(screen.getByText(/— Aristotle/)).toBeDefined();
  });

  it('should display a random tool on mount', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);
    
    render(<Home />);
    
    expect(screen.getByText(/Try something new/)).toBeDefined();
    expect(screen.getByText(/UUID Generator/)).toBeDefined();
  });

  it('should have a link to the random tool', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);
    
    render(<Home />);
    
    const toolLink = screen.getByRole('link', { name: /Visit UUID Generator/ });
    expect(toolLink).toBeDefined();
    expect(toolLink.getAttribute('href')).toBe('#/uuid');
  });

  it('should update random quote when quote is clicked', () => {
    const newMockQuote = {
      text: 'Testing shows the presence, not the absence of bugs.',
      author: 'Edsger W. Dijkstra'
    };

    const getRandomQuoteSpy = vi.spyOn(quotesModule, 'getRandomQuote');
    getRandomQuoteSpy.mockReturnValueOnce(mockQuote);
    getRandomQuoteSpy.mockReturnValueOnce(newMockQuote);
    
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    
    render(<Home />);
    
    expect(screen.getByText(/"Quality is not an act, it is a habit."/)).toBeDefined();
    
    const quoteButton = screen.getByRole('button', { name: /Get another random quote/ });
    fireEvent.click(quoteButton);
    
    expect(screen.getByText(/"Testing shows the presence, not the absence of bugs."/)).toBeDefined();
    expect(screen.getByText(/— Edsger W. Dijkstra/)).toBeDefined();
    expect(getRandomQuoteSpy).toHaveBeenCalledTimes(2);
  });

  it('should update random tool when shuffle is clicked', () => {
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
    
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);
    
    render(<Home />);
    
    expect(screen.getByText(/UUID Generator/)).toBeDefined();
    
    const shuffleButton = screen.getByRole('button', { name: /Shuffle random tool/ });
    fireEvent.click(shuffleButton);
    
    expect(screen.getByText(/Password Generator/)).toBeDefined();
    expect(getRandomToolSpy).toHaveBeenCalledTimes(2);
  });

  it('should have proper ARIA labels for accessibility', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);
    
    render(<Home />);
    
    expect(screen.getByRole('link', { name: /Visit UUID Generator/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Shuffle random tool/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Get another random quote/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Explore tools/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /View on GitHub/ })).toBeDefined();
  });

  it('should render the stats row', () => {
    vi.spyOn(randomToolModule, 'getRandomTool').mockReturnValue(mockTool);
    vi.spyOn(quotesModule, 'getRandomQuote').mockReturnValue(mockQuote);

    render(<Home />);

    expect(screen.getByText(/Open source/)).toBeDefined();
    expect(screen.getByText(/Free forever/)).toBeDefined();
  });
});
