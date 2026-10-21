import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ItgbLogo from '../components/ItgbLogo';
import { playClick, triggerVibrate, isSoundEnabled, toggleSound, subscribeSoundChange } from '../utils/audio';
import { Sparkles, AlertCircle, Zap, Timer, Trophy, Radio, Volume2, VolumeX } from 'lucide-react';

export default function LandingPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    return subscribeSoundChange((state) => {
      setSoundOn(state);
    });
  }, []);

  const handleSoundToggle = () => {
    toggleSound();
    playClick();
  };

  useEffect(() => {
    if (!loading && user) {
      navigate('/hub');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      setIsLoggingIn(true);
      playClick();
      triggerVibrate(20);
      await loginWithGoogle();
      navigate('/hub');
    } catch (error) {
      console.error("Login failed:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError('Error al iniciar sesión con Google. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between px-4 py-6 sm:py-10 max-w-md mx-auto z-10 font-sans select-none">
      {/* Top Header Row: Live Pill + Audio Mute Toggle */}
      <div className="w-full flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase shadow-md shadow-cyan-950/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <Radio size={13} className="text-cyan-400" />
          <span>STREAMING ITGB • EN VIVO</span>
        </div>

        <button
          onClick={handleSoundToggle}
          className={`p-2 rounded-xl border border-b-2 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer shadow-md ${
            soundOn 
              ? 'bg-cyan-950/80 border-cyan-500/40 border-b-cyan-700 text-cyan-400' 
              : 'bg-slate-900/90 border-white/10 border-b-slate-950 text-slate-500'
          }`}
          title={soundOn ? 'Silenciar Música y Efectos' : 'Activar Música y Efectos'}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Main Game Showcase */}
      <div className="w-full text-center flex flex-col items-center my-auto py-4">
        {/* Institutional Shield Badge with Glow Ring */}
        <div className="relative mb-4 group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-500/20 to-yellow-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
          <div className="relative p-2 rounded-2xl bg-slate-950/70 border border-white/10 shadow-xl">
            <ItgbLogo size="lg" className="w-24 h-32" />
          </div>
        </div>

        {/* 3D Esports Game Title */}
        <div className="space-y-0.5 mb-4">
          <div className="font-display font-black text-2xl sm:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase drop-shadow-[0_2px_8px_rgba(0,229,255,0.4)]">
            STREAMING
          </div>
          <h1 className="title-3d-white text-5xl sm:text-6xl tracking-tight leading-none">
            ITGB
          </h1>
          <h2 className="title-3d text-5xl sm:text-6xl tracking-tight leading-none">
            TRIVIA
          </h2>
        </div>

        {/* Subtitle Badge */}
        <div className="inline-block px-4 py-1.5 rounded-xl bg-slate-900/90 border border-yellow-500/30 text-yellow-400 text-xs font-display font-extrabold tracking-widest uppercase mb-6 shadow-sm">
          EL RETO DEL INSTITUTO TÉCNICO BELGRANO F29
        </div>

        {/* Game Rules Mini Feature Row */}
        <div className="w-full grid grid-cols-3 gap-2 mb-6">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
            <Timer size={18} className="mx-auto text-cyan-400 mb-1" />
            <div className="font-black text-xs text-white">15 SEG</div>
            <div className="text-[10px] text-slate-400">Por pregunta</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
            <Zap size={18} className="mx-auto text-yellow-400 mb-1" />
            <div className="font-black text-xs text-white">VELOCIDAD</div>
            <div className="text-[10px] text-slate-400">Hasta 5 pts</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
            <Trophy size={18} className="mx-auto text-emerald-400 mb-1" />
            <div className="font-black text-xs text-white">RANKING</div>
            <div className="text-[10px] text-slate-400">Top 3 Podio</div>
          </div>
        </div>

        {/* Arcade Login Card */}
        <div className="w-full bg-slate-900/90 rounded-3xl p-6 relative overflow-hidden text-center border border-cyan-500/30 shadow-2xl shadow-cyan-950/60">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug mb-5">
            Ingresa con tu cuenta de Google para registrar tu puntaje oficial y competir en vivo
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 text-left">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Google Sign-In Arcade Button with Physical Bevel */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || loading}
            className="w-full h-14 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-display font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-lg border-b-4 border-slate-300 active:translate-y-1 active:border-b-0 transition-all duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {/* Official Google G Logo */}
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>JUGAR CON GOOGLE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center pt-2 text-[11px] text-slate-500 font-medium">
        Instituto Técnico General Belgrano F29 • Reto Institucional 2026
      </footer>
    </div>
  );
}
