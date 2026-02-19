import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock API - use vi.fn() at module level so mocks resolve in the same microtask queue
const mockSections = vi.fn().mockResolvedValue({ sections: ['Cardiology', 'Neurology', 'GI', 'Pulmonology', 'Renal', 'OB/GYN', 'Psych', 'Endocrine'] });
const mockList = vi.fn().mockResolvedValue({ items: [], total: 50 });

vi.mock('../api/api', () => ({
    api: {
        questions: {
            sections: (...args: unknown[]) => mockSections(...args),
            list: (...args: unknown[]) => mockList(...args),
        },
    },
}));

function renderExamConfig() {
    return import('../pages/ExamConfig').then(({ ExamConfig }) => {
        return render(
            <BrowserRouter>
                <ExamConfig />
            </BrowserRouter>
        );
    });
}

describe('ExamConfig', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        mockSections.mockResolvedValue({ sections: ['Cardiology', 'Neurology', 'GI', 'Pulmonology', 'Renal', 'OB/GYN', 'Psych', 'Endocrine'] });
        mockList.mockResolvedValue({ items: [], total: 50 });
    });

    it('renders the page title', async () => {
        await renderExamConfig();
        expect(screen.getByText('New practice')).toBeInTheDocument();
    });

    it.skip('renders subject list after loading', async () => {
        await renderExamConfig();
        await waitFor(() => {
            expect(screen.getByText('Cardiology')).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it.skip('renders mode selection card', async () => {
        await renderExamConfig();
        // "Mode" may appear multiple times
        await waitFor(() => {
            const modeLabels = screen.getAllByText('Mode');
            expect(modeLabels.length).toBeGreaterThan(0);
        });
        expect(screen.getByText('All Questions')).toBeInTheDocument();
        expect(screen.getByText('Personalized')).toBeInTheDocument();
    });

    it('renders question count buttons', async () => {
        await renderExamConfig();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument();
        expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('shows summary info in count panel', async () => {
        await renderExamConfig();
        expect(screen.getAllByText('Subjects').length).toBeGreaterThan(0);
        expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('shows first-time tip', async () => {
        await renderExamConfig();
        expect(screen.getByText('Try Personalized Mode')).toBeInTheDocument();
    });

    it('dismisses tip and remembers', async () => {
        const user = userEvent.setup();
        await renderExamConfig();

        const gotItBtn = screen.getByText('Got it');
        await user.click(gotItBtn);

        expect(screen.queryByText(/Tip: Try Personalized Mode/)).not.toBeInTheDocument();
        expect(localStorage.getItem('chiron-exam-tip-dismissed')).toBe('1');
    });

    it('renders start button', async () => {
        await renderExamConfig();
        expect(screen.getByText('Start Practice')).toBeInTheDocument();
    });

    it('shows back to dashboard link', async () => {
        await renderExamConfig();
        expect(screen.getByText('Back to dashboard')).toBeInTheDocument();
    });
});
