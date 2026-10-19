import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ItgbLogo from './ItgbLogo';
import { Volume2, VolumeX, LogOut, ShieldAlert, Trophy, Radio } from 'lucide-react';
import { isSoundEnabled, toggleSound, playClick } from '../utils/audio';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    playClick();
  };

  const handleLogout = async () => {
    playClick();
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 py-2.5 flex items-center justify-between backdrop-blur-xl bg-slate-950/85 border-b border-white/10 select-none transition-all">
      {/* Brand & Logo */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        onClick={() => {
          playClick();
          navigate('/hub');
        }}
      >
        <div className="relative">
          <ItgbLogo variant="circular" size="sm" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-sm tracking-wider text-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              STREAM ITGB
            </span>
            {/* Live broadcast mini indicator */}
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
          </div>
          <div className="text-[9px] uppercase font-mono font-extrabold text-slate-400 tracking-wider">
            TRIVIA EN VIVO
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Admin Panel button: STRICTLY CONDITIONAL. Only visible if user is authorized admin */}
        {isAdmin && location.pathname !== '/admin' && (
          <button
            onClick={() => {
              playClick();
              navigate('/admin');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-display font-bold flex items-center gap-1.5 active:translate-y-0.5 transition-all shadow-md cursor-pointer"
            title="Panel de Administración"
          >
            <ShieldAlert size={14} className="text-rose-400" />
            <span className="hidden xs:inline">ADMIN</span>
          </button>
        )}

        {/* Quick Ranking Button */}
        {location.pathname !== '/ranking' && (
          <button
            onClick={() => {
              playClick();
              navigate('/ranking');
            }}
            className="p-2 rounded-xl bg-slate-900/90 border border-yellow-500/30 hover:border-yellow-400 text-yellow-400 active:translate-y-0.5 transition-all cursor-pointer shadow-sm"
            title="Ver Ranking General"
          >
            <Trophy size={16} />
          </button>
        )}

        {/* Audio Toggle Button with Active State */}
        <button
          onClick={handleSoundToggle}
          className={`p-2 rounded-xl border active:translate-y-0.5 transition-all cursor-pointer shadow-sm ${
            soundOn 
              ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-400' 
              : 'bg-slate-900/90 border-white/10 text-slate-500'
          }`}
          title={soundOn ? 'Silenciar Efectos de Sonido' : 'Activar Sonidos del Juego'}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* User Mini Profile & Sign Out */}
        {user && (
          <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Usuario'} 
                className="w-7 h-7 rounded-xl border border-cyan-400/50 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-xs font-black text-cyan-300">
                {(user.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 active:scale-95 transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
