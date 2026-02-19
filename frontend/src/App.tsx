import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ExamProvider } from './context/ExamContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ExamLayoutWrapper } from './components/ExamLayoutWrapper';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ExamConfig } from './pages/ExamConfig';
import { PreviousTests } from './pages/PreviousTests';
import { PracticeHistory } from './pages/PracticeHistory';
import { Performance } from './pages/Performance';
import { Search } from './pages/Search';
import { Notes } from './pages/Notes';
import { Flashcards } from './pages/Flashcards';
import { Bookmarks } from './pages/Bookmarks';
import { LabValues } from './pages/LabValues';
import { Settings } from './pages/Settings';
import { ToS } from './pages/ToS';
import { Privacy } from './pages/Privacy';

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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            {/* Public pages — no auth providers, no Supabase session check */}
            <Route path="/tos" element={<ToS />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Everything else — wrapped in auth/toast/sidebar providers */}
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
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
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
