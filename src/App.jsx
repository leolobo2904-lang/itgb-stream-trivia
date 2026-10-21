import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import TechBackground from './components/TechBackground';
import LandingPage from './pages/LandingPage';
import Hub from './pages/Hub';
import Game from './pages/Game';
import RankingPage from './pages/RankingPage';
import Admin from './pages/Admin';
import { initBackgroundMusic } from './utils/audio';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-bold text-xs tracking-widest text-cyan-400 uppercase">
          CONECTANDO CON STREAM ITGB...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  useEffect(() => {
    initBackgroundMusic();
  }, []);

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex flex-col relative font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Cyber Effect */}
      <TechBackground />

      {/* Main Container */}
      <div className="w-full min-h-screen flex flex-col z-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/hub" 
            element={
              <ProtectedRoute>
                <Hub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game" 
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            } 
          />
          <Route path="/ranking" element={<RankingPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
