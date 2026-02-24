import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, type ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ComplaintPage from './pages/ComplaintPage';
import SchemeExplorerPage from './pages/SchemeExplorerPage';
import ProfilePage from './pages/ProfilePage';
import InsightsPage from './pages/InsightsPage';
import { Loader2 } from 'lucide-react';

// ─── Protected Route ─────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isDemoMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060D1F' }}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin" style={{ color: '#60A5FA', margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.875rem' }}>Loading Senate Bot...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDemoMode) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// ─── App shell with sidebar + topbar ─────────────────────────────────────────

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-otp" element={<OtpPage />} />

      {/* Protected */}
      <Route path="/chat" element={
        <ProtectedRoute>
          <AppShell><ChatPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell><DashboardPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/applications" element={
        <ProtectedRoute>
          <AppShell><ApplicationsPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/complaint" element={
        <ProtectedRoute>
          <AppShell><ComplaintPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/schemes" element={
        <ProtectedRoute>
          <AppShell><SchemeExplorerPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppShell><ProfilePage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/insights" element={
        <ProtectedRoute>
          <AppShell><InsightsPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0D1F3C',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: '#0D1F3C' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0D1F3C' },
            },
          }}
        />
        <Suspense fallback={<div className="min-h-screen bg-navy-900 flex items-center justify-center"><Loader2 className="animate-spin text-electric-400" size={36} /></div>}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
