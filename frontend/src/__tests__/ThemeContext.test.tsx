import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function ThemeDisplay() {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={toggleTheme}>Toggle</button>
        </div>
    );
}

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('defaults to light theme', () => {
        render(
            <ThemeProvider>
                <ThemeDisplay />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme').textContent).toBe('light');
    });

    it('toggles to dark theme', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeDisplay />
            </ThemeProvider>
        );

        await user.click(screen.getByText('Toggle'));
        expect(screen.getByTestId('current-theme').textContent).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('toggles back to light', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeDisplay />
            </ThemeProvider>
        );

        await user.click(screen.getByText('Toggle'));
        expect(screen.getByTestId('current-theme').textContent).toBe('dark');

        await user.click(screen.getByText('Toggle'));
        expect(screen.getByTestId('current-theme').textContent).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists theme to localStorage', async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeDisplay />
            </ThemeProvider>
        );

        await user.click(screen.getByText('Toggle'));
        expect(localStorage.getItem('step2ck-theme')).toBe('dark');
    });

    it('reads persisted theme from localStorage', () => {
        localStorage.setItem('step2ck-theme', 'dark');
        render(
            <ThemeProvider>
                <ThemeDisplay />
            </ThemeProvider>
        );
        expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    });

    it('throws when used outside provider', () => {
        function Bad() {
            useTheme();
            return null;
        }
        expect(() => render(<Bad />)).toThrow('useTheme must be used within ThemeProvider');
    });
});
