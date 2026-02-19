import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE, getLogoUrl } from '../config/branding';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';

const WaveCanvas = lazy(() =>
  import('../components/landing/WaveCanvas').then((m) => ({ default: m.WaveCanvas }))
);

const DEMO_EMAIL = 'demo@chiron.local';
const isDev = import.meta.env.DEV;

export function Login() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleDemo = async () => {
    try {
      await login(DEMO_EMAIL);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="chiron-login-page min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] p-4 sm:p-6 relative overflow-hidden">
      <Suspense fallback={null}>
        <WaveCanvas isDark={theme === 'dark'} />
      </Suspense>
      <div
        className="relative z-10 w-full max-w-md panel p-8 text-center animate-slide-up"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src={getLogoUrl(theme)} alt="" className="w-10 h-10 rounded-lg object-contain shrink-0" />
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tracking-[0.14em] uppercase">
            {APP_NAME}
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          {APP_TAGLINE}
        </p>

        <div className="space-y-4">
          <GoogleLoginButton />

          {isDev && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-[var(--color-border)]" />
                <span className="text-xs text-[var(--color-text-muted)]">dev only</span>
                <div className="flex-1 border-t border-[var(--color-border)]" />
              </div>
              <button
                type="button"
                onClick={handleDemo}
                className="btn btn-secondary w-full focus-ring text-sm"
              >
                Continue as Demo User
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          For study use only.
        </p>
      </div>
    </div>
  );
}
