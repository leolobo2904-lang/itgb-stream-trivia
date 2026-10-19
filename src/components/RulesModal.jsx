import React, { useState, useEffect } from 'react';
import { Timer, Zap, XCircle, Lock, Play, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { playClick, playTick, playCountdownGo, triggerVibrate } from '../utils/audio';

export default function RulesModal({ isOpen, onClose, onStartGame }) {
  const [phase, setPhase] = useState('rules'); // 'rules' | 'countdown'
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setPhase('rules');
      setCountdown(5);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || phase !== 'countdown') return;

    if (countdown > 0) {
      playTick();
      triggerVibrate(25);
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown reaches 0 ("¡YA!")
      playCountdownGo();
      triggerVibrate([40, 30, 80]);
      const timer = setTimeout(() => {
        onStartGame();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen, phase, countdown, onStartGame]);

  if (!isOpen) return null;

  const handleStartCountdown = () => {
    playClick();
    triggerVibrate(30);
    setPhase('countdown');
    setCountdown(5);
  };

  // Phase 2: Massive Arcade Countdown Overlay
  if (phase === 'countdown') {
    const isGo = countdown === 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080D1A]/95 backdrop-blur-2xl select-none">
        {/* Pulsing Cyber Background Concentric Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full border border-cyan-500/20 animate-ping opacity-30" />
          <div className="w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] rounded-full border border-yellow-500/20 animate-pulse opacity-40" />
        </div>

        <div className="text-center px-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest mb-6 shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>INICIANDO EN</span>
          </div>

          {/* Punchy Animated Number / YA! */}
          <div
            key={countdown}
            className={`font-display font-black tracking-tighter leading-none select-none drop-shadow-2xl animate-countdown-pop ${
              isGo
                ? 'text-7xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 via-emerald-400 to-cyan-400 drop-shadow-[0_0_40px_rgba(0,230,118,0.85)]'
                : 'text-8xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-400 drop-shadow-[0_0_35px_rgba(0,229,255,0.8)]'
            }`}
          >
            {isGo ? '¡YA!' : countdown}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm font-semibold">
            <Flame size={16} className="text-yellow-400 animate-bounce" />
            <span>¡Prepárate para responder a máxima velocidad!</span>
          </div>
        </div>
      </div>
    );
  }

  // Phase 1: Rules Modal (Game Briefing)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-md bg-slate-900/95 rounded-3xl p-5 sm:p-6 relative overflow-hidden border border-cyan-500/40 shadow-2xl shadow-cyan-950/70"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-yellow-400 to-cyan-400" />

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles size={12} className="text-yellow-400" />
            PROTOCOLO OFICIAL • ITGB STREAM
          </div>
          <h2 className="text-2xl font-display font-black text-white tracking-wide uppercase title-3d-white">
            REGLAS DEL DESAFÍO
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Revisa la puntuación antes de que comience tu ronda única
          </p>
        </div>

        {/* Rules Grid */}
        <div className="space-y-3 mb-6">
          {/* Rule 1: 15 seconds */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5 border border-cyan-500/20">
              <Timer size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>15 Segundos por Pregunta</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Cada pregunta tiene un cronómetro digital activo. Al llegar a 0s, se marca errónea y avanza automáticamente.
              </p>
            </div>
          </div>

          {/* Rule 2: Dynamic scoring by speed */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-yellow-500/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 shrink-0 mt-0.5 border border-yellow-500/20">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-yellow-400 flex items-center justify-between">
                <span>Puntos por Velocidad</span>
                <span className="text-[10px] font-mono text-slate-400">DESEMPATE X TIEMPO</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-center text-xs">
                <div className="p-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                  <div className="font-black text-sm text-white">5 PTS</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">15s a 11s</div>
                </div>
                <div className="p-1.5 rounded-xl bg-yellow-950/70 border border-yellow-500/40 text-yellow-300">
                  <div className="font-black text-sm text-white">3 PTS</div>
                  <div className="text-[10px] text-yellow-400 font-semibold">10s a 6s</div>
                </div>
                <div className="p-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300">
                  <div className="font-black text-sm text-white">2 PTS</div>
                  <div className="text-[10px] text-rose-400 font-semibold">5s a 1s</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rule 3: Error rule */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
              <XCircle size={18} />
            </div>
            <div className="text-xs text-slate-300 leading-snug">
              <span className="font-bold text-white">Respuesta errónea o tiempo agotado: </span>
              Suma <span className="font-bold text-rose-400">0 Puntos</span>.
            </div>
          </div>

          {/* Rule 4: Single attempt */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
              <Lock size={18} />
            </div>
            <div className="text-xs text-slate-300 leading-snug">
              <span className="font-bold text-white">Intento Único: </span>
              Tu puntaje final se registra directamente en el ranking del streaming.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleStartCountdown}
            className="w-full h-14 rounded-2xl btn-arcade-cyan font-display font-black text-lg tracking-wider uppercase flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play size={20} className="fill-slate-950" />
            <span>¡ENTENDIDO, EMPEZAR!</span>
          </button>
          
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-medium text-center transition-colors cursor-pointer"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}
