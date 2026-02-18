import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../context/ToastContext';

function TestTrigger() {
    const { addToast } = useToast();
    return (
        <div>
            <button onClick={() => addToast('Success!', 'success')}>
                Show Success
            </button>
            <button onClick={() => addToast('Error!', 'error')}>
                Show Error
            </button>
            <button onClick={() => addToast('Info!', 'info')}>
                Show Info
            </button>
        </div>
    );
}

describe('Toast System', () => {
    it('renders toast when addToast is called', async () => {
        const user = userEvent.setup();
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Success'));
        expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('renders multiple toasts', async () => {
        const user = userEvent.setup();
        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Success'));
        await user.click(screen.getByText('Show Error'));
        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    it('dismisses toast when X is clicked', async () => {
        const user = userEvent.setup();
        vi.useFakeTimers({ shouldAdvanceTime: true });

        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Info'));
        expect(screen.getByText('Info!')).toBeInTheDocument();

        const dismissBtn = screen.getByLabelText('Dismiss');
        await user.click(dismissBtn);

        // Wait for exit animation
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        expect(screen.queryByText('Info!')).not.toBeInTheDocument();
        vi.useRealTimers();
    });

    it('auto-dismisses toast after duration', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        vi.useFakeTimers({ shouldAdvanceTime: true });

        render(
            <ToastProvider>
                <TestTrigger />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Success'));
        expect(screen.getByText('Success!')).toBeInTheDocument();

        // Fast-forward past the 5s auto-dismiss + 300ms exit animation
        await act(async () => {
            vi.advanceTimersByTime(5500);
        });

        expect(screen.queryByText('Success!')).not.toBeInTheDocument();
        vi.useRealTimers();
    });

    it('throws when useToast is used outside provider', () => {
        function Bad() {
            useToast();
            return null;
        }

        expect(() => render(<Bad />)).toThrow('useToast must be inside ToastProvider');
    });
});
