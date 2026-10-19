import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Zap, Clock, Sparkles, Award } from 'lucide-react';
import { playVictory, playClick, triggerVibrate } from '../utils/audio';

export default function CelebrationModal({ 
  isOpen, 
  userName, 
  score = 0, 
  totalTimeSeconds = 0,
  onNavigateRanking 
}) {
  const [countdown, setCountdown] = useState(4);

  // Belgraniano Honorific Rank based on points
  const getRankBadge = (pts) => {
    if (pts >= 30) return { title: 'TÉCNICO MAESTRO ITGB', color: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/60' };
    if (pts >= 20) return { title: 'OPERADOR DESTACADO', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60' };
    if (pts >= 10) return { title: 'TÉCNICO ESPECIALISTA', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60' };
    return { title: 'ASPIRANTE BELGRANIANO', color: 'text-slate-300 border-slate-600/40 bg-slate-900/60' };
  };

  const rankBadge = getRankBadge(score);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger Victory Audio & Vibration
    playVictory();
    triggerVibrate([80, 50, 100, 50, 150]);

    // Canvas Confetti Celebration
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;
    const colors = ['#00E5FF', '#FFC700', '#FF3B3B', '#00E676', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // 4-second auto redirect countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onNavigateRanking();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onNavigateRanking]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div 
        className="w-full max-w-md bg-slate-900/95 rounded-3xl p-6 sm:p-7 text-center relative overflow-hidden border border-yellow-500/40 shadow-2xl shadow-amber-950/70"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-yellow-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500" />

        {/* Crown / Trophy Icon with Glowing Ring */}
        <div className="relative inline-flex items-center justify-center mb-3 mt-1">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_35px_rgba(255,199,0,0.55)]">
            <div className="w-full h-full rounded-3xl bg-slate-950 flex items-center justify-center">
              <Trophy size={42} className="text-yellow-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Dynamic Celebration Greeting */}
        <h2 className="title-3d text-3xl sm:text-4xl tracking-tight leading-none uppercase">
          ¡DESAFÍO COMPLETADO!
        </h2>

        {/* Rank honorific pill */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-display font-extrabold tracking-wider uppercase shadow-sm">
          <Sparkles size={13} className="text-yellow-400" />
          <span className={rankBadge.color}>{rankBadge.title}</span>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-2.5 px-2 leading-relaxed">
          ¡Gracias por jugar y apoyar a nuestro juego, <span className="text-cyan-400 font-bold">{userName || 'Estudiante ITGB'}</span>!
        </p>

        {/* Score & Time Summary Card */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-yellow-500/40 text-center shadow-inner">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-1">
              <Zap size={14} className="fill-yellow-400" />
              PUNTAJE FINAL
            </div>
            <div className="font-display font-black text-3xl text-white drop-shadow-[0_0_12px_rgba(255,199,0,0.5)]">
              {score} <span className="text-xs text-yellow-400">PTS</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-cyan-500/40 text-center shadow-inner">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <Clock size={14} />
              TIEMPO TOTAL
            </div>
            <div className="font-display font-black text-3xl text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.5)]">
              {totalTimeSeconds} <span className="text-xs text-cyan-400">SEG</span>
            </div>
          </div>
        </div>

        {/* Action Button with 3D Bevel */}
        <button
          onClick={() => {
            playClick();
            onNavigateRanking();
          }}
          className="w-full h-14 rounded-2xl btn-arcade-gold font-display font-black text-lg tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>VER TABLA DE POSICIONES</span>
          <ArrowRight size={20} />
        </button>

        {/* Countdown Progress Meter */}
        <div className="mt-4">
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/10 p-0.5">
            <div 
              className="bg-yellow-400 h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 4) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Redirigiendo automáticamente al Ranking en {countdown}s...
          </p>
        </div>
      </div>
    </div>
  );
}
