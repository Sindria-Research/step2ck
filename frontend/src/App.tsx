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
import { LabValues } from './pages/LabValues';
import { Settings } from './pages/Settings';

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
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Dashboard />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exam/config"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <ExamConfig />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lab-values"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <LabValues />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Settings />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
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
