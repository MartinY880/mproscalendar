/**
 * Main App Component
 * Routing and layout
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Header from './components/layout/Header';

// Pages
import CalendarPage from './pages/CalendarPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHolidays from './pages/admin/AdminHolidays';
import AdminSettings from './pages/admin/AdminSettings';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CalendarPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/holidays"
            element={
              <ProtectedRoute>
                <AdminHolidays />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
