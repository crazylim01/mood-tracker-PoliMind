
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Journal } from './pages/Journal';
import { Wellness } from './pages/Wellness';
import { Study } from './pages/Study';
import { useMoodStore } from './store';
import './i18n';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useMoodStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, fetchUserData, currentUser } = useMoodStore();

  // Global Sync: Reload user data when the app starts if they are already logged in
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchUserData();
    }
  }, [isAuthenticated, currentUser, fetchUserData]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="journal" element={<Journal />} />
                <Route path="wellness" element={<Wellness />} />
                <Route path="study" element={<Study />} />
                <Route path="history" element={<History />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
