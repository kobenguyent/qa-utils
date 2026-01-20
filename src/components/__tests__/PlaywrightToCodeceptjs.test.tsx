import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlaywrightToCodeceptjs from '../utils/PlaywrightToCodeceptjs';
import * as aiChatClient from '../../utils/aiChatClient';

// Mock the aiChatClient module
vi.mock('../../utils/aiChatClient', () => ({
  sendChatMessage: vi.fn(),
  testConnection: vi.fn(),
  getDefaultModel: vi.fn(() => ({ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 4096, provider: 'openai' })),
}));

describe('PlaywrightToCodeceptjs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render the component with default mode selected', () => {
    render(<PlaywrightToCodeceptjs />);
    
    expect(screen.getByText('Playwright to CodeceptJS Test Converter')).toBeInTheDocument();
    expect(screen.getByText('Default (Regex-based)')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
  });

  it('should switch to AI mode when AI-Powered button is clicked', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    expect(screen.getByText('AI Configuration')).toBeInTheDocument();
    expect(screen.getByText('AI Provider')).toBeInTheDocument();
  });

  it('should show AI configuration panel in AI mode', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your API key')).toBeInTheDocument();
  });

  it('should perform default conversion without AI', async () => {
    render(<PlaywrightToCodeceptjs />);
    
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here');
    const convertButton = screen.getByText('Convert');
    
    const playwrightCode = `test('basic test', async ({ page }) => {
      await page.goto('https://example.com');
    });`;
    
    fireEvent.change(textarea, { target: { value: playwrightCode } });
    fireEvent.click(convertButton);
    
    await waitFor(() => {
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Feature("Converted Playwright Tests")') ?? false;
      });
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should save API key to localStorage', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    const saveButton = screen.getByText('Save API Key');
    
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {
      // Mock implementation - do nothing
    });
    
    fireEvent.click(saveButton);
    
    expect(localStorage.getItem('playwright_converter_openai_apiKey')).toBe('test-api-key');
    expect(alertMock).toHaveBeenCalledWith('API key saved successfully!');
    
    alertMock.mockRestore();
  });

  it('should test connection when API key is entered', async () => {
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    testConnectionMock.mockResolvedValue(true);
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(testConnectionMock).toHaveBeenCalled();
    });
  });

  it('should show connected status when connection is successful', async () => {
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    testConnectionMock.mockResolvedValue(true);
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(screen.getByText('✓ Connected to AI provider')).toBeInTheDocument();
    });
  });

  it('should show disconnected status when connection fails', async () => {
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    testConnectionMock.mockResolvedValue(false);
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to connect to AI provider/)).toBeInTheDocument();
    });
  });

  it('should perform AI conversion when AI mode is selected', async () => {
    const sendChatMessageMock = vi.mocked(aiChatClient.sendChatMessage);
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    
    testConnectionMock.mockResolvedValue(true);
    sendChatMessageMock.mockResolvedValue({
      message: 'Feature("Test");\n\nScenario("basic test", ({ I }) => {\n  I.amOnPage("https://example.com");\n});',
      model: 'gpt-3.5-turbo',
    });
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(screen.getByText('✓ Connected to AI provider')).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here');
    const playwrightCode = `test('basic test', async ({ page }) => {
      await page.goto('https://example.com');
    });`;
    
    fireEvent.change(textarea, { target: { value: playwrightCode } });
    
    const convertButton = screen.getByText('Convert');
    fireEvent.click(convertButton);
    
    await waitFor(() => {
      expect(sendChatMessageMock).toHaveBeenCalled();
    });
  });

  it('should fallback to default conversion when AI conversion fails', async () => {
    const sendChatMessageMock = vi.mocked(aiChatClient.sendChatMessage);
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    
    testConnectionMock.mockResolvedValue(true);
    sendChatMessageMock.mockRejectedValue(new Error('API error'));
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(screen.getByText('✓ Connected to AI provider')).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here');
    const playwrightCode = `test('basic test', async ({ page }) => {
      await page.goto('https://example.com');
    });`;
    
    fireEvent.change(textarea, { target: { value: playwrightCode } });
    
    const convertButton = screen.getByText('Convert');
    fireEvent.click(convertButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Falling back to default conversion/)).toBeInTheDocument();
    });
  });

  it('should clear input and output when Clear button is clicked', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here');
    const clearButton = screen.getByText('Clear');
    
    const playwrightCode = 'test code';
    fireEvent.change(textarea, { target: { value: playwrightCode } });
    
    expect(textarea).toHaveValue(playwrightCode);
    
    fireEvent.click(clearButton);
    
    expect(textarea).toHaveValue('');
  });

  it('should fill sample code when Example button is clicked', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const exampleButton = screen.getByText('Example Playwright Tests code');
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here') as HTMLTextAreaElement;
    
    fireEvent.click(exampleButton);
    
    expect(textarea.value).toContain('test.beforeEach');
    expect(textarea.value).toContain('basic interaction');
  });

  it('should disable convert button when no code is entered', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const convertButton = screen.getByText('Convert');
    
    expect(convertButton).toBeDisabled();
  });

  it('should disable convert button when disconnected in AI mode', async () => {
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    testConnectionMock.mockResolvedValue(false);
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to connect to AI provider/)).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here');
    fireEvent.change(textarea, { target: { value: 'test code' } });
    
    const convertButton = screen.getByText('Convert');
    expect(convertButton).toBeDisabled();
  });

  it('should show loading spinner during conversion', async () => {
    const sendChatMessageMock = vi.mocked(aiChatClient.sendChatMessage);
    const testConnectionMock = vi.mocked(aiChatClient.testConnection);
    
    testConnectionMock.mockResolvedValue(true);
    sendChatMessageMock.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      message: 'converted code',
      model: 'gpt-3.5-turbo',
    }), 1000)));
    
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const apiKeyInput = screen.getByPlaceholderText('Enter your API key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    await waitFor(() => {
      expect(screen.getByText('✓ Connected to AI provider')).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText('Paste your Playwright test code here');
    fireEvent.change(textarea, { target: { value: 'test code' } });
    
    const convertButton = screen.getByText('Convert');
    fireEvent.click(convertButton);
    
    expect(screen.getByText('Converting...')).toBeInTheDocument();
  });

  it('should change provider when a different provider is selected', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const providerSelect = screen.getByRole('combobox');
    fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
    
    expect(providerSelect).toHaveValue('anthropic');
  });

  it('should show endpoint field for Ollama provider', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const providerSelect = screen.getByRole('combobox');
    fireEvent.change(providerSelect, { target: { value: 'ollama' } });
    
    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
  });

  it('should not show API key field for Ollama provider', () => {
    render(<PlaywrightToCodeceptjs />);
    
    const aiButton = screen.getByText('AI-Powered');
    fireEvent.click(aiButton);
    
    const providerSelect = screen.getByRole('combobox');
    fireEvent.change(providerSelect, { target: { value: 'ollama' } });
    
    expect(screen.queryByPlaceholderText('Enter your API key')).not.toBeInTheDocument();
  });
});
