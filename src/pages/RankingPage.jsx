import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import Header from '../components/Header';
import ItgbLogo from '../components/ItgbLogo';
import { Trophy, Crown, ArrowLeft, Clock, Zap, User, Radio, Sparkles } from 'lucide-react';
import { playClick, triggerVibrate } from '../utils/audio';

export default function RankingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore Leaderboard sync for live streaming broadcast
  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');

    // Helper: process and sort snapshot
    const processLeaderboardSnap = (snapshot) => {
      const usersList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Verify completed status
        if (data.status === 'completed') {
          usersList.push({ id: docSnap.id, ...data });
        }
      });

      // Strict tiebreaker: Score DESC, TotalTimeSeconds ASC
      usersList.sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0);
      });

      setLeaderboard(usersList);
      setLoading(false);
    };

    let unsubscribe = () => {};

    try {
      // Primary required query:
      // query(collection(db, "users"), where("status", "==", "completed"), orderBy("score", "desc"), orderBy("totalTimeSeconds", "asc"))
      const primaryQuery = query(
        usersRef,
        where("status", "==", "completed"),
        orderBy("score", "desc"),
        orderBy("totalTimeSeconds", "asc")
      );

      unsubscribe = onSnapshot(primaryQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Extra client-side tiebreaker reassurance
        list.sort((a, b) => {
          const scoreDiff = (b.score || 0) - (a.score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          return (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0);
        });
        setLeaderboard(list);
        setLoading(false);
      }, (error) => {
        console.warn("Aviso en query compuesta (puede requerir índice compuesto en Firestore):", error?.message);
        // Fallback real-time query that does not require composite index
        const fallbackQuery = query(usersRef, where("status", "==", "completed"));
        unsubscribe = onSnapshot(fallbackQuery, (snap) => {
          processLeaderboardSnap(snap);
        }, (fallbackErr) => {
          console.warn("Aviso en fallback where('status','==','completed'):", fallbackErr?.message);
          // General real-time listener
          unsubscribe = onSnapshot(usersRef, (allSnap) => {
            processLeaderboardSnap(allSnap);
          }, (err) => {
            console.error("Error al escuchar leaderboard:", err);
            setLoading(false);
          });
        });
      });
    } catch (err) {
      console.warn("Excepción al iniciar listener de ranking:", err);
      unsubscribe = onSnapshot(usersRef, (allSnap) => {
        processLeaderboardSnap(allSnap);
      });
    }

    return () => unsubscribe();
  }, []);

  const top1 = leaderboard[0] || null;
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;
  const remainingUsers = leaderboard.slice(3);

  const formatName = (fullName) => {
    if (!fullName) return 'Jugador';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans select-none">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col">
        {/* Title Banner + Live Stream Indicator */}
        <div className="text-center mb-4 animate-in fade-in slide-in-from-top-3 duration-400">
          <div className="flex justify-center mb-2">
            <ItgbLogo size="sm" />
          </div>

          {/* Live broadcast pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2 shadow-sm">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
            </span>
            <Radio size={11} className="text-cyan-400" />
            <span>TABLA EN TIEMPO REAL • STREAMING ITGB</span>
          </div>

          <h1 className="title-3d-white text-3xl tracking-tight leading-tight">
            RANKING GENERAL
          </h1>
          <h2 className="title-3d text-2xl tracking-wide -mt-0.5">
            STREAM ITGB
          </h2>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-cyan-400 tracking-widest font-bold uppercase animate-pulse">
              SINCRONIZANDO POSICIONES EN VIVO...
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* TOP 3 PODIUM SECTION WITH PHYSICAL SPRING RISE ANIMATIONS */}
            <div className="glass-panel-cyan rounded-3xl p-4 sm:p-5 mb-5 border border-cyan-500/30 relative overflow-hidden shadow-xl">
              {/* Specular Top Line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

              <div className="text-center font-display font-black text-xs uppercase tracking-widest text-slate-300 mb-3 flex items-center justify-center gap-1.5">
                <Crown size={15} className="text-yellow-400" />
                <span>TOP 3 PODIO E-SPORTS</span>
              </div>

              {/* Podium Grid: #2 Silver (Left) - #1 Gold (Center, Higher) - #3 Bronze (Right) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 items-end pt-2">
                {/* #2 PUESTO (Plata) */}
                <div 
                  className="glass-panel-silver rounded-2xl p-2.5 sm:p-3 text-center flex flex-col items-center border border-slate-300/40 relative shadow-md animate-podium-rise"
                  style={{ '--podium-delay': '80ms' }}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-display font-black text-xs flex items-center justify-center mb-2 shadow-sm">
                    2
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-slate-300 p-0.5 mb-1.5 overflow-hidden bg-slate-800 shadow-inner">
                    {top2?.photoURL ? (
                      <img 
                        src={top2.photoURL} 
                        alt={top2.displayName} 
                        className="w-full h-full rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-800">
                        {top2 ? formatName(top2.displayName)[0] : <User size={18} />}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-xs text-white truncate max-w-full">
                    {top2 ? formatName(top2.displayName) : '-'}
                  </div>
                  <div className="text-[11px] font-black text-slate-300 mt-0.5">
                    {top2 ? `${top2.score || 0} PTS` : '0 PTS'}
                  </div>
                  {top2?.totalTimeSeconds > 0 && (
                    <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Clock size={9} />
                      <span>{top2.totalTimeSeconds}s</span>
                    </div>
                  )}
                </div>

                {/* #1 PUESTO (Oro - Centro Más Alto) */}
                <div 
                  className="glass-panel-gold rounded-2xl p-3 sm:p-3.5 text-center flex flex-col items-center border-2 border-yellow-400 relative -translate-y-2.5 shadow-lg shadow-amber-950/50 animate-podium-rise"
                  style={{ '--podium-delay': '180ms' }}
                >
                  {/* Physical Crown Drop Animation */}
                  <Crown size={22} className="text-yellow-400 mb-0.5 filter drop-shadow-[0_0_8px_rgba(255,199,0,0.6)] animate-crown-drop" />
                  
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-display font-black text-xs flex items-center justify-center mb-2 shadow-sm">
                    1
                  </div>
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-yellow-400 p-0.5 mb-1.5 overflow-hidden bg-amber-950 shadow-md">
                    {top1?.photoURL ? (
                      <img 
                        src={top1.photoURL} 
                        alt={top1.displayName} 
                        className="w-full h-full rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-amber-300 font-black text-sm bg-amber-950">
                        {top1 ? formatName(top1.displayName)[0] : <User size={22} />}
                      </div>
                    )}
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-white truncate max-w-full">
                    {top1 ? formatName(top1.displayName) : '-'}
                  </div>
                  <div className="text-xs font-black text-yellow-400 mt-0.5 drop-shadow-[0_0_8px_rgba(255,199,0,0.5)]">
                    {top1 ? `${top1.score || 0} PTS` : '0 PTS'}
                  </div>
                  {top1?.totalTimeSeconds > 0 && (
                    <div className="text-[9px] text-yellow-300 flex items-center justify-center gap-0.5 mt-0.5 font-bold">
                      <Clock size={9} />
                      <span>{top1.totalTimeSeconds}s</span>
                    </div>
                  )}
                </div>

                {/* #3 PUESTO (Bronce) */}
                <div 
                  className="glass-panel-bronze rounded-2xl p-2.5 sm:p-3 text-center flex flex-col items-center border border-amber-700/50 relative shadow-md animate-podium-rise"
                  style={{ '--podium-delay': '280ms' }}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-display font-black text-xs flex items-center justify-center mb-2 shadow-sm">
                    3
                  </div>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-amber-600 p-0.5 mb-1.5 overflow-hidden bg-amber-950 shadow-inner">
                    {top3?.photoURL ? (
                      <img 
                        src={top3.photoURL} 
                        alt={top3.displayName} 
                        className="w-full h-full rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-amber-500 font-bold text-xs bg-amber-950">
                        {top3 ? formatName(top3.displayName)[0] : <User size={18} />}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-xs text-white truncate max-w-full">
                    {top3 ? formatName(top3.displayName) : '-'}
                  </div>
                  <div className="text-[11px] font-black text-amber-400 mt-0.5">
                    {top3 ? `${top3.score || 0} PTS` : '0 PTS'}
                  </div>
                  {top3?.totalTimeSeconds > 0 && (
                    <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5 mt-0.5">
                      <Clock size={9} />
                      <span>{top3.totalTimeSeconds}s</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GENERAL LIST (#4 ONWARDS) WITH CASCADE ENTRANCE */}
            <div className="space-y-2 mb-6">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-300 glass-panel rounded-2xl border border-white/10">
                  <Trophy size={28} className="mx-auto text-yellow-400/60 mb-2" />
                  <p className="font-bold text-white">¡Aún no hay participantes en el Ranking!</p>
                  <p className="text-slate-400 mt-1">Completa el desafío para ser el primer Belgraniano en el podio.</p>
                </div>
              ) : remainingUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 glass-panel rounded-2xl">
                  {leaderboard.length <= 3 
                    ? '¡El Top 3 del podio está completo! Los próximos participantes aparecerán en esta lista.' 
                    : 'Cargando lista general...'}
                </div>
              ) : (
                remainingUsers.map((player, idx) => {
                  const rank = idx + 4;
                  const isCurrent = user?.uid === player.id;

                  const rankColors = [
                    'text-emerald-400',
                    'text-amber-400',
                    'text-cyan-400',
                    'text-cyan-300',
                    'text-slate-400'
                  ];
                  const rankColor = rankColors[idx] || 'text-slate-400';

                  return (
                    <div
                      key={player.id}
                      style={{ '--row-idx': Math.min(idx, 15) }}
                      className={`p-3 px-4 rounded-xl flex items-center justify-between transition-all duration-200 animate-row-cascade ${
                        isCurrent 
                          ? 'glass-panel-cyan border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)] ring-1 ring-cyan-400/40' 
                          : 'glass-panel hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Rank & Avatar & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`font-display font-black text-base w-7 ${rankColor}`}>
                          {rank}.
                        </span>

                        <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-slate-800 shrink-0">
                          {player.photoURL ? (
                            <img 
                              src={player.photoURL} 
                              alt={player.displayName} 
                              className="w-full h-full rounded-full object-cover" 
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs bg-slate-800">
                              {formatName(player.displayName)[0]}
                            </div>
                          )}
                        </div>

                        <div className="truncate">
                          <span className={`text-xs sm:text-sm font-bold truncate block ${isCurrent ? 'text-cyan-400' : 'text-slate-100'}`}>
                            {formatName(player.displayName)}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider block">
                              (Tú)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points & Response Time */}
                      <div className="text-right shrink-0 pl-2">
                        <div className="font-display font-black text-sm sm:text-base text-white">
                          {player.score || 0} <span className="text-xs text-yellow-400 font-extrabold">PTS</span>
                        </div>
                        {player.totalTimeSeconds > 0 && (
                          <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-medium">
                            <Clock size={10} />
                            <span>{player.totalTimeSeconds}s</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Fixed Bottom Button with Spring Press State */}
        <div className="sticky bottom-4 pt-2">
          <button
            onClick={() => {
              playClick();
              triggerVibrate(20);
              navigate('/hub');
            }}
            className="w-full h-14 rounded-2xl btn-arcade-cyan font-display font-black text-base tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            VOLVER AL MENÚ
          </button>
        </div>
      </main>
    </div>
  );
}
