import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DummyDataGenerator } from '../DummyDataGenerator';

describe('DummyDataGenerator Component', () => {
    it('renders without crashing', () => {
        render(<DummyDataGenerator />);
        expect(screen.getByText('Dummy Data Generator')).toBeInTheDocument();
    });

    it('renders all category tabs', () => {
        render(<DummyDataGenerator />);
        expect(screen.getByText('👤 Person')).toBeInTheDocument();
        expect(screen.getByText('📍 Location')).toBeInTheDocument();
        expect(screen.getByText('🌐 Internet')).toBeInTheDocument();
        expect(screen.getByText('💳 Finance')).toBeInTheDocument();
        expect(screen.getByText('🏢 Company')).toBeInTheDocument();
        expect(screen.getByText('📅 Date/Time')).toBeInTheDocument();
        expect(screen.getByText('📝 Text')).toBeInTheDocument();
        expect(screen.getByText('🎲 Miscellaneous')).toBeInTheDocument();
    });

    it('renders settings panel with controls', () => {
        render(<DummyDataGenerator />);
        expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
        expect(screen.getByText('Select Fields')).toBeInTheDocument();
        expect(screen.getByText('Output Format')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate Data/i })).toBeInTheDocument();
    });

    it('renders output format dropdown with all options', () => {
        render(<DummyDataGenerator />);
        const formatSelect = screen.getByRole('combobox');
        expect(formatSelect).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'JSON' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'CSV' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Table View' })).toBeInTheDocument();
    });

    it('generates data when generate button is clicked', () => {
        render(<DummyDataGenerator />);
        const generateButton = screen.getByRole('button', { name: /Generate Data/i });
        fireEvent.click(generateButton);

        // After generating, Quick Stats should appear
        expect(screen.getByText('📊 Quick Stats')).toBeInTheDocument();
    });

    it('renders about section', () => {
        render(<DummyDataGenerator />);
        expect(screen.getByText('ℹ️ About Dummy Data Generator')).toBeInTheDocument();
        expect(screen.getByText('@ngneat/falso')).toBeInTheDocument();
    });
});
