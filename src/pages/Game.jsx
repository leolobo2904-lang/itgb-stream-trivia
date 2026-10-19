import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from '../firebase';
import CelebrationModal from '../components/CelebrationModal';
import { 
  playTick, 
  playCorrect, 
  playWrong, 
  triggerVibrate, 
  playClick 
} from '../utils/audio';
import { ArrowLeft, Check, X, Sparkles, Zap, Trophy, Radio } from 'lucide-react';

// Default ITGB technical questions (grounded in technical school curriculum)
export const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    text: '¿Qué tipo de robot se utiliza comúnmente en líneas de montaje industriales para tareas complejas?',
    options: ['Robot Articulado', 'Robot Delta', 'Robot SCARA'],
    correctAnswer: 0,
    order: 1
  },
  {
    id: 'q2',
    text: '¿Cuál es la función principal de un microcontrolador en un sistema embebido?',
    options: ['Almacenar terabytes de datos', 'Controlar y procesar señales de sensores y actuadores', 'Reemplazar la fuente de alimentación'],
    correctAnswer: 1,
    order: 2
  },
  {
    id: 'q3',
    text: 'En el Instituto Técnico General Belgrano, ¿cuál es el principio fundamental de la Ley de Ohm?',
    options: ['V = I × R', 'P = V × I²', 'F = m × a'],
    correctAnswer: 0,
    order: 3
  },
  {
    id: 'q4',
    text: '¿Qué protocolo de red se utiliza principalmente para la transmisión de streaming de baja latencia?',
    options: ['FTP', 'WebRTC / RTMP', 'SMTP'],
    correctAnswer: 1,
    order: 4
  },
  {
    id: 'q5',
    text: '¿Qué componente electrónico pasivo almacena energía en forma de campo electrostático?',
    options: ['Inductor', 'Diodo Zener', 'Capacitor / Condensador'],
    correctAnswer: 2,
    order: 5
  },
  {
    id: 'q6',
    text: 'En transmisiones de streaming en vivo, ¿qué codec de video moderno ofrece la mejor eficiencia de compresión?',
    options: ['H.264 / AVC', 'AV1 / HEVC', 'MPEG-1'],
    correctAnswer: 1,
    order: 6
  },
  {
    id: 'q7',
    text: '¿Cuál es el sensor comúnmente utilizado en robótica para medir distancias mediante ondas de sonido?',
    options: ['Sensor Ultrasonido HC-SR04', 'Termocupla Tipo K', 'Potenciómetro Lineal'],
    correctAnswer: 0,
    order: 7
  },
  {
    id: 'q8',
    text: 'En programación de sistemas técnicos, ¿cuál es el significado de las siglas GPIO?',
    options: ['Global Protocol Input Output', 'General Purpose Input/Output', 'Graphical Processing Interface Online'],
    correctAnswer: 1,
    order: 8
  }
];

export default function Game() {
  const { user, userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active React Timer State
  const [timeLeft, setTimeLeft] = useState(15);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Motion & Transition States
  const [transitionState, setTransitionState] = useState('entering'); // 'entering' | 'active' | 'exiting'
  const [floatingPoints, setFloatingPoints] = useState(null); // { points: number, optIndex: number }

  // Accumulated Session Stats
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  // 1. Fetch questions from Firestore
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const qRef = collection(db, 'questions');
        const qQuery = query(qRef, orderBy('order', 'asc'));
        const snap = await getDocs(qQuery);
        
        let loaded = [];
        if (!snap.empty) {
          snap.forEach(docSnap => {
            loaded.push({ id: docSnap.id, ...docSnap.data() });
          });
        }

        if (loaded.length === 0) {
          loaded = DEFAULT_QUESTIONS;
        }

        setQuestions(loaded);
      } catch (err) {
        console.warn("Usando preguntas por defecto:", err);
        setQuestions(DEFAULT_QUESTIONS);
      } finally {
        setLoadingQuestions(false);
      }
    }

    fetchQuestions();
  }, []);

  // 2. Sync with user profile on mount
  useEffect(() => {
    if (userProfile) {
      if (userProfile.status === 'completed') {
        navigate('/ranking');
        return;
      }

      setSessionScore(userProfile.score || 0);
      setSessionTime(userProfile.totalTimeSeconds || 0);

      const savedIdx = userProfile.currentQuestionIndex || 0;
      setCurrentIndex(savedIdx);

      if (userProfile.status === 'registered') {
        updateProfileData({ status: 'in_progress' });
      }
    }
  }, [userProfile, navigate]);

  // 3. Reset Timer & trigger entrance animation on question change
  useEffect(() => {
    if (questions.length === 0 || currentIndex >= questions.length) return;

    setTimeLeft(15);
    setIsLocked(false);
    setSelectedOption(null);
    setFloatingPoints(null);
    setTransitionState('entering');

    const timer = setTimeout(() => {
      setTransitionState('active');
    }, 350);

    return () => clearTimeout(timer);
  }, [currentIndex, questions.length]);

  // 4. Real 1-Second Timer Effect (useState + useEffect)
  useEffect(() => {
    if (isLocked || loadingQuestions || questions.length === 0 || currentIndex >= questions.length) {
      return;
    }

    if (timeLeft === 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        const nextVal = prev - 1;
        if (nextVal <= 5 && nextVal > 0) {
          playTick();
          triggerVibrate(15);
        }
        return nextVal >= 0 ? nextVal : 0;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isLocked, loadingQuestions, questions.length, currentIndex]);

  // Timeout Handler: 0 pts, advances after 1s
  const handleTimeout = () => {
    setIsLocked(true);
    playWrong();
    triggerVibrate(60);

    const timeSpent = 15;
    const newTotalTime = sessionTime + timeSpent;
    setSessionTime(newTotalTime);

    // Wait 1 second feedback then transition out
    setTimeout(() => {
      triggerQuestionAdvance(0, newTotalTime);
    }, 1000);
  };

  // Option Click Handler with microinteraction
  const handleSelectOption = (index) => {
    if (isLocked || timeLeft === 0) return;

    // Lock immediately to prevent double-clicks
    setIsLocked(true);
    setSelectedOption(index);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctAnswer;

    // Speed-based Scoring Rules:
    // 15s a 11s = 5 Puntos
    // 10s a 6s = 3 Puntos
    // 5s a 1s = 2 Puntos
    let points = 0;
    if (isCorrect) {
      if (timeLeft >= 11) points = 5;
      else if (timeLeft >= 6) points = 3;
      else if (timeLeft >= 1) points = 2;
      else points = 0;

      setFloatingPoints({ points, optIndex: index });
      playCorrect();
      triggerVibrate([30, 20, 50]);
    } else {
      playWrong();
      triggerVibrate(70);
    }

    const timeSpent = 15 - timeLeft;
    const newTotalTime = sessionTime + timeSpent;
    const newScore = sessionScore + points;

    setSessionScore(newScore);
    setSessionTime(newTotalTime);

    // Wait 1 second visual feedback before fluid exit
    setTimeout(() => {
      triggerQuestionAdvance(points, newTotalTime);
    }, 1100);
  };

  // Fluid transition advance
  const triggerQuestionAdvance = (pointsEarned, updatedTime) => {
    const nextIdx = currentIndex + 1;
    const isLast = nextIdx >= questions.length;

    if (isLast) {
      advanceQuestion(pointsEarned, updatedTime, true);
    } else {
      setTransitionState('exiting');
      setTimeout(() => {
        advanceQuestion(pointsEarned, updatedTime, false);
      }, 200);
    }
  };

  // Firestore update
  const advanceQuestion = async (pointsEarned, updatedTime, isLast) => {
    const nextIdx = currentIndex + 1;
    const finalScore = sessionScore + pointsEarned;

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        if (isLast) {
          await updateDoc(userRef, {
            score: finalScore,
            totalTimeSeconds: updatedTime,
            currentQuestionIndex: nextIdx,
            status: 'completed',
            completedAt: serverTimestamp()
          });
        } else {
          await updateDoc(userRef, {
            score: finalScore,
            totalTimeSeconds: updatedTime,
            currentQuestionIndex: nextIdx,
            status: 'in_progress'
          });
        }
      } catch (err) {
        console.error("Error al actualizar Firestore:", err);
      }
    }

    if (isLast) {
      setShowCelebration(true);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  // Timer Color & Animation Styles
  const getTimerStyles = () => {
    if (timeLeft >= 11) {
      return {
        stroke: '#00E676',
        text: 'text-emerald-400',
        ring: 'shadow-emerald-950/40',
        pulse: ''
      };
    } else if (timeLeft >= 6) {
      return {
        stroke: '#FF9100',
        text: 'text-amber-400',
        ring: 'shadow-amber-950/40',
        pulse: ''
      };
    } else {
      return {
        stroke: '#FF3B3B',
        text: 'text-red-500 animate-pulse',
        ring: 'shadow-red-950/60 shadow-[0_0_15px_rgba(255,59,59,0.4)]',
        pulse: 'scale-105'
      };
    }
  };

  const timerStyle = getTimerStyles();
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 15) * circumference;

  if (loadingQuestions) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-cyan-400 font-bold tracking-widest text-xs uppercase animate-pulse">
          CARGANDO PREGUNTAS...
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];
  const progressPercent = Math.min(100, Math.round(((currentIndex) / questions.length) * 100));

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md w-full mx-auto px-4 py-4 relative font-sans select-none">
      {/* Top Gaming HUD Header */}
      <div className="flex items-center justify-between pt-1 pb-3">
        {/* Back to Hub Button with Bevel */}
        <button
          onClick={() => {
            playClick();
            navigate('/hub');
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 border-b-2 border-b-slate-950 text-slate-300 hover:text-white active:translate-y-0.5 active:border-b-0 transition-all duration-150 cursor-pointer shadow-md"
          title="Volver al menú"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Center Game HUD Badges */}
        <div className="flex flex-col items-center gap-1">
          <div className="px-3.5 py-1 rounded-full bg-slate-900/95 border border-cyan-500/40 text-[11px] font-display font-black text-cyan-400 tracking-widest uppercase shadow-md flex items-center gap-1.5">
            <Radio size={11} className="text-cyan-400" />
            <span>RONDA {currentIndex + 1} / {questions.length}</span>
          </div>

          <div className="text-[11px] font-bold text-yellow-400 flex items-center gap-1 bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-yellow-500/30">
            <Zap size={11} className="fill-yellow-400" />
            <span>{sessionScore} PTS EN JUEGO</span>
          </div>
        </div>

        {/* 15s Circular Animated Arcade Clock */}
        <div className={`relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-900/95 border border-white/15 ${timerStyle.pulse} transition-all duration-300 shadow-lg`}>
          <svg className="w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke={timerStyle.stroke}
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Digital Timer Value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-display font-black text-2xl tracking-tight ${timerStyle.text}`}>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Main Question Card with Fluid Motion Transition */}
      <div className={`my-auto py-2 transition-all ${
        transitionState === 'exiting' ? 'animate-question-exit' : 'animate-question-enter'
      }`}>
        {/* Question Card: Technical Cyber Terminal */}
        <div className="bg-slate-900/95 rounded-3xl p-5 sm:p-6 relative overflow-hidden border border-cyan-500/30 shadow-2xl drop-shadow-md mb-5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          
          {/* Terminal Mini Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-[11px] font-bold text-cyan-400">
            <span className="flex items-center gap-1.5 uppercase font-display tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              RETO TÉCNICO BELGRANO
            </span>
            <span className="text-slate-400 text-[10px] font-mono">15s MÁX</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white text-center leading-relaxed">
            {currentQ.text}
          </h2>
        </div>

        {/* 3 Answer Options with Arcade Tactile Push-Buttons */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const letter = ['A', 'B', 'C'][idx];
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = idx === currentQ.correctAnswer;

            let buttonStyle = 'bg-slate-900/90 border border-white/10 border-b-4 border-b-slate-950 text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800/90 shadow-md active:translate-y-1 active:border-b-2';
            let letterStyle = 'bg-cyan-950 text-cyan-400 border-cyan-500/40';
            let shakeClass = '';

            if (isLocked) {
              if (isSelected && isCorrectAnswer) {
                // Correct button pressed: luminous emerald with physical spring pop
                buttonStyle = 'bg-emerald-600 border-emerald-400 border-b-4 border-b-emerald-800 text-white shadow-lg shadow-emerald-950/70 scale-[1.02] ring-2 ring-emerald-400/50';
                letterStyle = 'bg-emerald-900 text-white border-emerald-300 font-black';
              } else if (isSelected && !isCorrectAnswer) {
                // Wrong button pressed: solid rose with physical horizontal shake
                buttonStyle = 'bg-rose-600 border-rose-400 border-b-4 border-b-rose-800 text-white shadow-lg shadow-rose-950/70 ring-2 ring-rose-400/40';
                letterStyle = 'bg-rose-900 text-white border-rose-300 font-black';
                shakeClass = 'animate-shake-wrong';
              } else if (!isSelected && isCorrectAnswer) {
                // Correct answer flashes to guide learning
                buttonStyle = 'bg-emerald-950/90 border-2 border-emerald-400 border-b-4 border-b-emerald-900 text-emerald-200 animate-pulse';
                letterStyle = 'bg-emerald-500 text-slate-950 border-emerald-400 font-black';
              } else {
                buttonStyle = 'opacity-30 border-transparent border-b-0 pointer-events-none';
              }
            }

            return (
              <div 
                key={`${currentIndex}-${idx}`} 
                className="relative"
                style={{ '--opt-idx': idx }}
              >
                {/* Floating Score Badge on Correct Answer */}
                {floatingPoints && floatingPoints.optIndex === idx && (
                  <div className="absolute -top-8 right-6 z-20 animate-float-points">
                    <div className="px-3.5 py-1 rounded-full bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-400/60 flex items-center gap-1 border border-emerald-200">
                      <Sparkles size={12} className="fill-slate-950" />
                      +{floatingPoints.points} PTS
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleSelectOption(idx)}
                  disabled={isLocked}
                  className={`w-full min-h-[60px] p-3.5 px-4 rounded-2xl flex items-center gap-3.5 text-left transition-all duration-150 cursor-pointer animate-option-stagger ${buttonStyle} ${shakeClass}`}
                >
                  {/* Arcade Keycap Badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-base border shrink-0 transition-transform duration-150 shadow-inner ${letterStyle}`}>
                    {isLocked && isSelected && isCorrectAnswer ? (
                      <Check size={18} className="text-white animate-in zoom-in-75 duration-150" />
                    ) : isLocked && isSelected && !isCorrectAnswer ? (
                      <X size={18} className="text-white animate-in zoom-in-75 duration-150" />
                    ) : (
                      letter
                    )}
                  </div>

                  {/* Option Text */}
                  <div className="flex-1 font-semibold text-sm leading-snug">
                    {option}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Laser Charging Progress Bar with Smooth Gradient Fill & Indicator */}
      <div className="w-full pb-3 pt-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
          <span>PROGRESO DE LA TRIVIA</span>
          <span className="text-cyan-400">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5 shadow-inner relative">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Luminous comet head */}
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/80 rounded-full blur-[1px]" />
          </div>
        </div>
      </div>

      {/* Celebration Modal when reaching the end */}
      <CelebrationModal
        isOpen={showCelebration}
        userName={userProfile?.displayName || user?.displayName}
        score={sessionScore}
        totalTimeSeconds={sessionTime}
        onNavigateRanking={() => navigate('/ranking')}
      />
    </div>
  );
}
