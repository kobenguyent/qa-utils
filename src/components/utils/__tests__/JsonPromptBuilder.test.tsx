import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JsonPromptBuilder } from '../JsonPromptBuilder';

describe('JsonPromptBuilder Component', () => {
    it('renders without crashing', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getByText('JSON Prompt Builder')).toBeInTheDocument();
    });

    it('renders Builder and Import JSON tabs', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getByRole('button', { name: /builder/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /import json/i })).toBeInTheDocument();
    });

    it('shows provider format buttons', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getByRole('button', { name: /openai/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /anthropic/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /gemini/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generic/i })).toBeInTheDocument();
    });

    it('renders default messages (system + user)', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getAllByRole('combobox').some(
            (el) => (el as HTMLSelectElement).value === 'system'
        )).toBe(true);
        expect(screen.getAllByRole('combobox').some(
            (el) => (el as HTMLSelectElement).value === 'user'
        )).toBe(true);
    });

    it('renders add message buttons', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getByRole('button', { name: /add system message/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add user message/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add assistant message/i })).toBeInTheDocument();
    });

    it('adds a new user message when + user is clicked', () => {
        render(<JsonPromptBuilder />);
        const initialSelects = screen.getAllByRole('combobox').filter(
            (el) => (el as HTMLSelectElement).options.length === 3,
        ).length;

        fireEvent.click(screen.getByRole('button', { name: /add user message/i }));

        const updatedSelects = screen.getAllByRole('combobox').filter(
            (el) => (el as HTMLSelectElement).options.length === 3,
        ).length;
        expect(updatedSelects).toBe(initialSelects + 1);
    });

    it('shows JSON output panel', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getByText('📋 JSON Output')).toBeInTheDocument();
    });

    it('shows generated JSON in output', () => {
        render(<JsonPromptBuilder />);
        // The pre element should exist and contain JSON
        const preEls = document.querySelectorAll('pre');
        expect(preEls.length).toBeGreaterThan(0);
    });

    it('detects template variables in message content', () => {
        render(<JsonPromptBuilder />);
        // Default state has {{userMessage}} variable — "Template Variables" header is shown
        const headers = screen.getAllByText(/template variables/i);
        expect(headers.length).toBeGreaterThan(0);
    });

    it('shows variable input field for {{userMessage}}', () => {
        render(<JsonPromptBuilder />);
        // The InputGroup label shows {{userMessage}}
        const labels = screen.getAllByText('{{userMessage}}');
        expect(labels.length).toBeGreaterThan(0);
    });

    it('switches to Import tab', () => {
        render(<JsonPromptBuilder />);
        fireEvent.click(screen.getByRole('button', { name: /import json/i }));
        expect(screen.getByText(/import existing json prompt/i)).toBeInTheDocument();
    });

    it('shows import error for invalid JSON', () => {
        render(<JsonPromptBuilder />);
        fireEvent.click(screen.getByRole('button', { name: /import json/i }));

        const textarea = screen.getByRole('textbox', { name: /json prompt to import/i });
        fireEvent.change(textarea, { target: { value: 'not valid json' } });

        // Click the Import & Edit button (not the tab button)
        fireEvent.click(screen.getByRole('button', { name: /import & edit/i }));
        // Should show an error
        expect(document.querySelector('.alert-danger')).toBeInTheDocument();
    });

    it('validates prompt on clicking Validate button', () => {
        render(<JsonPromptBuilder />);
        fireEvent.click(screen.getByRole('button', { name: /validate/i }));
        // Default template is valid → should show success alert
        expect(document.querySelector('.alert-success')).toBeInTheDocument();
    });

    it('shows About section', () => {
        render(<JsonPromptBuilder />);
        expect(screen.getByText(/about json prompt builder/i)).toBeInTheDocument();
    });

    it('changes provider format to Anthropic', () => {
        render(<JsonPromptBuilder />);
        fireEvent.click(screen.getByRole('button', { name: /anthropic/i }));
        // The model field should now show the Anthropic default model
        const modelInput = screen.getByRole('textbox', { name: /model name/i }) as HTMLInputElement;
        expect(modelInput.value).toContain('claude');
    });

    it('resets to defaults when Reset is clicked', () => {
        render(<JsonPromptBuilder />);
        // Add a message first
        fireEvent.click(screen.getByRole('button', { name: /add assistant message/i }));
        // Reset
        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
        // Should be back to 2 messages (system + user)
        const selects = screen.getAllByRole('combobox').filter(
            (el) => (el as HTMLSelectElement).options.length === 3,
        );
        expect(selects).toHaveLength(2);
    });
});
