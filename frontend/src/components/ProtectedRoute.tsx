import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showSlowMsg, setShowSlowMsg] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setShowSlowMsg(true), 4_000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] p-6 gap-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="skeleton h-8 w-3/4 rounded-md" />
          <div className="skeleton h-4 w-full rounded-md" />
          <div className="skeleton h-4 w-5/6 rounded-md" />
          <div className="skeleton h-10 w-full rounded-md mt-6" />
        </div>
        {showSlowMsg && (
          <p className="text-sm text-[var(--color-text-muted)] animate-fade-in text-center max-w-xs">
            Waking up the server — this can take up to 30 seconds on the first visit.
          </p>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
