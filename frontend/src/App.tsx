import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <SidebarProvider>
                <Routes>
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
                </Routes>
              </SidebarProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
