import { useNavigate } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE, getLogoUrl } from '../config/branding';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';

const DEMO_EMAIL = 'demo@step2ck.local';

export function Login() {
  const { login, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div
          className="w-10 h-10 border-2 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] p-4 sm:p-6">
      <div
        className="w-full max-w-md panel p-8 text-center animate-slide-up"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-6">
          <img src={getLogoUrl(theme)} alt="" className="w-7 h-7 object-contain" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight mb-1">
          {APP_NAME}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          {APP_TAGLINE}
        </p>

        <div className="space-y-4">
          <GoogleLoginButton />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            or
          </p>
          <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
            Continue in demo mode. Progress is saved for this session only.
          </p>
          <button
            type="button"
            onClick={handleDemo}
            className="btn btn-primary w-full focus-ring"
          >
            Continue in Demo Mode
          </button>
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          For study use only.
        </p>
      </div>
    </div>
  );
}
