import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

// Layouts
import MainLayout from '@components/layouts/MainLayout';
import AuthLayout from '@components/layouts/AuthLayout';

// Pages
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import DashboardPage from '@pages/DashboardPage';
import RepositoriesPage from '@pages/RepositoriesPage';
import RepositoryDetailPage from '@pages/RepositoryDetailPage';
import AnalysisPage from '@pages/AnalysisPage';
import ArchitecturePage from '@pages/ArchitecturePage';
import ChatPage from '@pages/ChatPage';
import DocumentationPage from '@pages/DocumentationPage';
import SettingsPage from '@pages/SettingsPage';
import SearchPage from '@pages/SearchPage';
import ComparisonPage from '@pages/ComparisonPage';
import ExportPage from '@pages/ExportPage';
import NotFoundPage from '@pages/NotFoundPage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        useAuthStore.getState().login(user, token);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, [setLoading]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="repositories" element={<RepositoriesPage />} />
        <Route path="repositories/:id" element={<RepositoryDetailPage />} />
        <Route path="repositories/:id/analysis" element={<AnalysisPage />} />
        <Route path="repositories/:id/architecture" element={<ArchitecturePage />} />
        <Route path="repositories/:id/chat" element={<ChatPage />} />
        <Route path="repositories/:id/documentation" element={<DocumentationPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="comparison" element={<ComparisonPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

// Made with Bob
