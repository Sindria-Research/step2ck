import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

// Mock auth
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { email: 'test@example.com', display_name: 'Test User' }, loading: false }),
}));

// Mock branding
vi.mock('../config/branding', () => ({
    APP_NAME: 'Chiron',
    getLogoUrl: () => '/logo.svg',
}));

// Mock API
vi.mock('../api/api', () => ({
    api: {
        progress: {
            stats: vi.fn().mockResolvedValue({
                total: 100,
                correct: 75,
                incorrect: 25,
                by_section: [
                    { name: 'Cardiology', total: 40, correct: 30, accuracy: 75 },
                    { name: 'Neurology', total: 30, correct: 20, accuracy: 67 },
                    { name: 'GI', total: 30, correct: 25, accuracy: 83 },
                ],
            }),
            list: vi.fn().mockResolvedValue([
                { question_id: '1', correct: true, section: 'Cardiology', created_at: new Date().toISOString() },
            ]),
        },
    },
}));

// Mock hooks
vi.mock('../hooks/useQuestionGoal', () => ({
    useQuestionGoal: () => [200, vi.fn()],
}));

// Mock analytics components to avoid complex SVG rendering
vi.mock('../components/analytics/ProgressChart', () => ({
    ProgressChart: () => <div data-testid="progress-chart">ProgressChart</div>,
}));
vi.mock('../components/analytics/SectionBreakdown', () => ({
    SectionBreakdown: () => <div data-testid="section-breakdown">SectionBreakdown</div>,
}));

function renderDashboard() {
    return import('../pages/Dashboard').then(({ Dashboard }) => {
        return render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <ThemeProvider>
                    <ToastProvider>
                        <Dashboard />
                    </ToastProvider>
                </ThemeProvider>
            </MemoryRouter>
        );
    });
}

describe('Dashboard', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders welcome message', async () => {
        await renderDashboard();
        await waitFor(() => {
            expect(screen.getByText(/Hey, Test User/)).toBeInTheDocument();
        });
    });

    it('shows stat panels after loading', async () => {
        await renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Questions')).toBeInTheDocument();
        });
        // 'Correct' and 'Incorrect' may appear both as stat label and section breakdown text
        const correctElements = screen.getAllByText('Correct');
        expect(correctElements.length).toBeGreaterThan(0);
        const incorrectElements = screen.getAllByText('Incorrect');
        expect(incorrectElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('shows section performance', async () => {
        await renderDashboard();
        await waitFor(() => {
            const cardiology = screen.getAllByText('Cardiology');
            expect(cardiology.length).toBeGreaterThan(0);
        });
    });

    it('shows quick action links', async () => {
        await renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Configure new test')).toBeInTheDocument();
        });
        expect(screen.getByText('Reference lab values')).toBeInTheDocument();
    });

    it('shows analytics section', async () => {
        await renderDashboard();
        await waitFor(() => {
            expect(screen.getByText('Analytics')).toBeInTheDocument();
        });
    });
});
