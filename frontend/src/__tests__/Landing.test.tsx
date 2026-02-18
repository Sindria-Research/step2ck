import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

// Mock the auth context
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: null, loading: false }),
}));

// Mock the branding config
vi.mock('../config/branding', () => ({
    APP_NAME: 'Chiron',
    getLogoUrl: () => '/logo.svg',
}));

function renderLanding() {
    return import('../pages/Landing').then(({ Landing }) => {
        return render(
            <BrowserRouter>
                <ThemeProvider>
                    <ToastProvider>
                        <Landing />
                    </ToastProvider>
                </ThemeProvider>
            </BrowserRouter>
        );
    });
}

describe('Landing Page', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('renders the hero heading with prep text', async () => {
        await renderLanding();
        // The typewriter starts empty but "Prep for " is always rendered
        expect(screen.getByText(/prep for/i)).toBeInTheDocument();
    });

    it('renders navigation with brand name', async () => {
        await renderLanding();
        // Brand name appears multiple times (nav + footer), so use getAllByText
        const brandElements = screen.getAllByText('Chiron');
        expect(brandElements.length).toBeGreaterThan(0);
    });

    it('renders feature link in nav', async () => {
        await renderLanding();
        // "Features" appears as link text in nav
        const featureLinks = screen.getAllByText('Features');
        expect(featureLinks.length).toBeGreaterThan(0);
    });

    it('renders social proof section', async () => {
        await renderLanding();
        expect(screen.getByText(/trusted by students/i)).toBeInTheDocument();
        expect(screen.getByText(/1,200\+/)).toBeInTheDocument();
        expect(screen.getByText(/50,000\+/)).toBeInTheDocument();
    });

    it('renders footer with copyright', async () => {
        await renderLanding();
        const year = new Date().getFullYear().toString();
        expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });

    it('has dark mode toggle in nav', async () => {
        await renderLanding();
        const toggles = screen.getAllByLabelText(/switch to/i);
        expect(toggles.length).toBeGreaterThan(0);
    });

    it('renders CTA section', async () => {
        await renderLanding();
        expect(screen.getByText('Enter Chiron.')).toBeInTheDocument();
    });

    it('renders Get started link', async () => {
        await renderLanding();
        expect(screen.getByText('Get started')).toBeInTheDocument();
    });
});
