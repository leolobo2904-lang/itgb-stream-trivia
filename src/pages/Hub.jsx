import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import RulesModal from '../components/RulesModal';
import { Play, Trophy, ShieldAlert, CheckCircle2, RotateCcw, Sparkles, Zap, Clock, ChevronRight } from 'lucide-react';
import { playClick, triggerVibrate } from '../utils/audio';

// Super Admin Email constant
export const SUPER_ADMIN_EMAIL = "liolobo2904@gmail.com";

export default function Hub() {
  const { user, userProfile, isAdmin, allowedEmails } = useAuth();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  // Check if current user is strictly authorized as Super Admin or is in Firestore admin whitelist
  const userEmail = (user?.email || '').toLowerCase().trim();
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase().trim();
  const isInAdminList = Array.isArray(allowedEmails) && allowedEmails.some(
    e => (e || '').toLowerCase().trim() === userEmail
  );
  
  // Real-time access: COMPLETELY HIDDEN for normal users, reacts immediately when added
  const showAdminAccess = Boolean(isAdmin || isSuperAdmin || isInAdminList || userProfile?.role === 'admin' || userProfile?.isAdmin === true);

  const status = userProfile?.status || 'registered';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  // Extract clean first name
  const firstName = userProfile?.displayName 
    ? userProfile.displayName.split(' ')[0] 
    : user?.displayName 
      ? user.displayName.split(' ')[0] 
      : 'Estudiante';

  const handlePlayClick = () => {
    if (isCompleted) return;
    playClick();
    triggerVibrate(20);
    setShowRules(true);
  };

  const handleStartGame = () => {
    setShowRules(false);
    navigate('/game');
  };

  const handleRankingClick = () => {
    playClick();
    triggerVibrate(15);
    navigate('/ranking');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans select-none">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col justify-center">
        {/* Gamer Profile Card (HUD Header) */}
        <div className="bg-slate-900/90 rounded-3xl p-5 mb-5 border border-cyan-500/30 shadow-xl shadow-cyan-950/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="flex items-center gap-4">
            {/* Avatar with Animated Rank Ring */}
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Perfil'} 
                  className="w-16 h-16 rounded-2xl border-2 border-cyan-400 object-cover shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-2xl font-black text-cyan-300 shadow-md">
                  {firstName[0]}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-slate-950 border border-yellow-400 shadow-sm">
                <Sparkles size={12} className="text-yellow-400" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
                <Zap size={13} className="text-yellow-400" />
                <span>ESTUDIANTE BELGRANIANO</span>
              </div>
              <h2 className="text-lg font-black text-white truncate">
                {userProfile?.displayName || user?.displayName || 'Participante'}
              </h2>
              
              {/* Stats badges */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-yellow-500/30 text-[11px] font-black text-yellow-400 flex items-center gap-1">
                  <Trophy size={11} />
                  <span>{userProfile?.score || 0} PTS</span>
                </div>
                {userProfile?.totalTimeSeconds > 0 && (
                  <div className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/10 text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Clock size={11} />
                    <span>{userProfile.totalTimeSeconds}s</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Title */}
        <div className="text-center mb-4">
          <h1 className="title-3d text-3xl sm:text-4xl tracking-tight leading-tight">
            MENÚ PRINCIPAL
          </h1>
          <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
            SELECCIONA TU MODO DE JUEGO
          </p>
        </div>

        {/* Stacked Arcade Action Cards with 3D Depth */}
        <div className="space-y-4 mb-5">
          {/* Card 1: JUGAR AHORA / CONTINUAR DESAFÍO */}
          <button
            onClick={handlePlayClick}
            disabled={isCompleted}
            className={`w-full text-left p-5 sm:p-6 rounded-2xl transition-all duration-150 relative overflow-hidden group border-b-4 border-slate-950 active:translate-y-1 active:border-b-2 shadow-xl ${
              isCompleted 
                ? 'bg-slate-900/60 border border-slate-800 cursor-not-allowed opacity-75' 
                : 'bg-slate-900/95 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-cyan-950/60 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Glowing Play Portal Icon */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                isCompleted 
                  ? 'bg-slate-800 border-2 border-slate-700 text-slate-500' 
                  : 'bg-gradient-to-tr from-cyan-950 to-blue-900 border-2 border-cyan-400 text-cyan-300 group-hover:scale-105 shadow-md shadow-cyan-500/20'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 size={32} className="text-slate-500" />
                ) : isInProgress ? (
                  <RotateCcw size={28} className="text-cyan-400 animate-[spin_6s_linear_infinite]" />
                ) : (
                  <div className="w-10 h-10 rounded-xl border border-cyan-400/50 flex items-center justify-center bg-cyan-500/20">
                    <Play size={22} className="text-white fill-white ml-0.5" />
                  </div>
                )}
              </div>

              {/* Text Block */}
              <div className="flex-1 min-w-0">
                <div className={`font-display font-black text-2xl sm:text-3xl tracking-wide uppercase ${
                  isCompleted ? 'text-slate-400' : 'text-yellow-400 title-3d'
                }`}>
                  {isCompleted ? '¡YA PARTICIPASTE!' : isInProgress ? 'CONTINUAR RETO' : 'JUGAR AHORA'}
                </div>
                
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 truncate">
                  {isCompleted 
                    ? `Puntaje oficial registrado: ${userProfile?.score || 0} pts.` 
                    : isInProgress 
                      ? `Retoma en la pregunta ${(userProfile?.currentQuestionIndex || 0) + 1}` 
                      : 'Reto de 8 Preguntas • Oportunidad única'}
                </p>
              </div>

              <ChevronRight size={22} className={`shrink-0 ${isCompleted ? 'text-slate-600' : 'text-cyan-400 group-hover:translate-x-1 transition-transform'}`} />
            </div>
          </button>

          {/* Card 2: VER RANKING GENERAL */}
          <button
            onClick={handleRankingClick}
            className="w-full text-left p-5 sm:p-6 rounded-2xl bg-slate-900/95 border border-yellow-500/40 hover:border-yellow-400 hover:shadow-amber-950/60 active:translate-y-1 active:border-b-2 border-b-4 border-slate-950 transition-all duration-150 relative overflow-hidden group cursor-pointer shadow-xl"
          >
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Crown / Trophy Portal */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-950 to-yellow-950 border-2 border-yellow-400 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
                <Trophy size={30} className="text-yellow-400" />
              </div>

              {/* Text Block */}
              <div className="flex-1 min-w-0">
                <div className="font-display font-black text-2xl sm:text-3xl tracking-wide uppercase title-3d-white">
                  VER RANKING
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 truncate">
                  Tabla de posiciones y podio en tiempo real
                </p>
              </div>

              <ChevronRight size={22} className="text-yellow-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* BOTÓN DE ADMIN: COMPLETAMENTE OCULTO para usuarios normales.
            Solo se muestra si es SUPER_ADMIN_EMAIL o existe en whitelist/admins */}
        {showAdminAccess && (
          <div className="mt-1 p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/40 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <ShieldAlert size={18} className="text-rose-400" />
              <div>
                <div className="text-xs font-bold text-rose-200 uppercase">
                  Panel de Administración
                </div>
                <div className="text-[10px] text-slate-400">
                  Acceso exclusivo para el equipo de streaming
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                playClick();
                navigate('/admin');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
            >
              Gestionar
            </button>
          </div>
        )}
      </main>

      {/* Rules Modal + 5s Countdown */}
      <RulesModal 
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        onStartGame={handleStartGame}
      />

      <footer className="w-full text-center py-3 text-[11px] text-slate-500 font-medium">
        STREAM ITGB • Instituto Técnico General Belgrano F29
      </footer>
    </div>
  );
}
