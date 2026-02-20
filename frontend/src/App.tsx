import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ExamProvider } from './context/ExamContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ExamLayoutWrapper } from './components/ExamLayoutWrapper';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ExamConfig = lazy(() => import('./pages/ExamConfig').then((m) => ({ default: m.ExamConfig })));
const PreviousTests = lazy(() => import('./pages/PreviousTests').then((m) => ({ default: m.PreviousTests })));
const PracticeHistory = lazy(() => import('./pages/PracticeHistory').then((m) => ({ default: m.PracticeHistory })));
const Performance = lazy(() => import('./pages/Performance').then((m) => ({ default: m.Performance })));
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })));
const Notes = lazy(() => import('./pages/Notes').then((m) => ({ default: m.Notes })));
const Flashcards = lazy(() => import('./pages/Flashcards').then((m) => ({ default: m.Flashcards })));
const Bookmarks = lazy(() => import('./pages/Bookmarks').then((m) => ({ default: m.Bookmarks })));
const LabValues = lazy(() => import('./pages/LabValues').then((m) => ({ default: m.LabValues })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const ToS = lazy(() => import('./pages/ToS').then((m) => ({ default: m.ToS })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const StudyPlan = lazy(() => import('./pages/StudyPlan').then((m) => ({ default: m.StudyPlan })));
const Pricing = lazy(() => import('./pages/Pricing').then((m) => ({ default: m.Pricing })));

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function AuthLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SidebarProvider>
          <Outlet />
        </SidebarProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="h-14 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]" />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-96 rounded" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card space-y-3">
              <div className="skeleton h-5 w-1/3" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
              </div>
              <div className="skeleton h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public pages — no auth providers, no Supabase session check */}
            <Route path="/tos" element={<ToS />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Everything else — wrapped in auth/toast/sidebar providers */}
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/exam/config" element={<ProtectedPage><ExamConfig /></ProtectedPage>} />
              <Route path="/previous-tests" element={<ProtectedPage><PreviousTests /></ProtectedPage>} />
              <Route path="/practice-history" element={<ProtectedPage><PracticeHistory /></ProtectedPage>} />
              <Route path="/performance" element={<ProtectedPage><Performance /></ProtectedPage>} />
              <Route path="/search" element={<ProtectedPage><Search /></ProtectedPage>} />
              <Route path="/notes" element={<ProtectedPage><Notes /></ProtectedPage>} />
              <Route path="/flashcards" element={<ProtectedPage><Flashcards /></ProtectedPage>} />
              <Route path="/bookmarks" element={<ProtectedPage><Bookmarks /></ProtectedPage>} />
              <Route path="/lab-values" element={<ProtectedPage><LabValues /></ProtectedPage>} />
              <Route path="/study-plan" element={<ProtectedPage><StudyPlan /></ProtectedPage>} />
              <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
              <Route
                path="/exam"
                element={
                  <ProtectedRoute>
                    <ExamProvider>
                      <ExamLayoutWrapper />
                    </ExamProvider>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
          </Suspense>
        </ThemeProvider>
      </BrowserRouter>
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
