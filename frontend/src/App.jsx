import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { RequireAuth, RequireRole, NotFound } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'));
const SupervisorDashboard = lazy(() => import('./pages/SupervisorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PublicTransparency = lazy(() => import('./pages/PublicTransparency'));
const AwarenessPage = lazy(() => import('./pages/AwarenessPage'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));

function RouteProgress() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(false), 620);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-progress"
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-gradient-to-r from-lime-300 via-leaf-400 to-lime-300"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}

function PageFallback() {
  return (
    <div className="flex min-h-[50svh] flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <span className="relative grid h-11 w-11 place-items-center">
        <span className="absolute inset-0 rounded-2xl border-2 border-leaf-200 border-t-leaf-500 animate-spin" />
      </span>
      <span className="text-sm font-semibold text-slate-500">Loading workspace…</span>
    </div>
  );
}

function App() {
  const { role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');

  useEffect(() => {
    if (role && role !== 'CITIZEN') {
      setActiveTab(role.toLowerCase());
    }
  }, [role]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-sm font-semibold text-slate-600">
        <span className="h-4 w-4 rounded-full border-2 border-leaf-200 border-t-leaf-500 animate-spin" />
        Loading SwachDrishti…
      </div>
    );
  }

  return (
    <Router>
      <RouteProgress />
      <div className="flex min-h-screen flex-col">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 bg-paper">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route path="/public" element={<PublicTransparency />} />
              <Route path="/awareness" element={<AwarenessPage />} />
              <Route
                path="/citizen"
                element={
                  <RequireRole roles={['CITIZEN']}>
                    <CitizenDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/worker"
                element={
                  <RequireRole roles={['WORKER']}>
                    <WorkerDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/supervisor"
                element={
                  <RequireRole roles={['SUPERVISOR']}>
                    <SupervisorDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireRole roles={['ADMIN']}>
                    <AdminDashboard />
                  </RequireRole>
                }
              />
              <Route path="/me" element={<RequireAuth><Navigate to="/" replace /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
