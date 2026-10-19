import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from '../firebase';
import Header from '../components/Header';
import { DEFAULT_QUESTIONS } from './Game';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  X, 
  ArrowLeft,
  UserPlus,
  Users,
  Database
} from 'lucide-react';
import { playClick, triggerVibrate } from '../utils/audio';

export default function Admin() {
  const { user, allowedEmails, loading } = useAuth();
  const navigate = useNavigate();

  // Verify authorization: Super Admin OR in Firestore whitelist
  const userEmail = user?.email ? user.email.toLowerCase().trim() : '';
  const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase().trim();
  const isInAdminList = Array.isArray(allowedEmails) && allowedEmails.some(
    e => e && e.toLowerCase().trim() === userEmail
  );
  const isAuthorized = isSuperAdmin || isInAdminList;

  // 2. VERIFICACIÓN DE PERMISOS:
  // Si no es el Súper Admin ni está en la lista autorizada, redirige DE INMEDIATO al Hub ('/')
  useEffect(() => {
    if (!loading) {
      if (!user || !isAuthorized) {
        console.warn("Acceso no autorizado a /admin. Redirigiendo a '/'...");
        navigate('/', { replace: true });
      }
    }
  }, [user, isAuthorized, loading, navigate]);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Question Form State (Add / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formText, setFormText] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formCorrect, setFormCorrect] = useState(0);
  const [formOrder, setFormOrder] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);

  // New admin email input
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // 1. Real-time questions listener with Error Handling
  useEffect(() => {
    if (!isAuthorized) return;

    const qRef = collection(db, 'questions');
    const qQuery = query(qRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(qQuery, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setQuestions(list);
      setLoadingQuestions(false);
    }, (error) => {
      console.error("Error al leer preguntas de Firestore:", error);
      showNotification('error', `Error al cargar preguntas de Firestore: ${error.message}`);
      setLoadingQuestions(false);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  const showNotification = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg({ type: '', text: '' });
    }, 4500);
  };

  // 2. Add New Admin Email with Error Handling
  const handleAddAdminEmail = async (e) => {
    e.preventDefault();
    const cleanEmail = newAdminEmail.toLowerCase().trim();
    if (!cleanEmail) return;

    try {
      playClick();
      if (allowedEmails.map(e => e.toLowerCase()).includes(cleanEmail) || cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        showNotification('info', 'Ese correo ya está registrado como administrador.');
        return;
      }

      const updated = [...allowedEmails, cleanEmail];
      
      // Update admin_config/whitelist document
      const whitelistRef = doc(db, 'admin_config', 'whitelist');
      await setDoc(whitelistRef, { allowedEmails: updated }, { merge: true });

      // Also create a doc in admins collection for redundancy
      try {
        const adminDocRef = doc(db, 'admins', cleanEmail);
        await setDoc(adminDocRef, { 
          email: cleanEmail, 
          addedAt: serverTimestamp(),
          addedBy: userEmail 
        }, { merge: true });
      } catch (colErr) {
        console.warn("Nota: No se pudo escribir en admins colección directa, pero whitelist se guardó:", colErr);
      }

      setNewAdminEmail('');
      showNotification('success', `Administrador autorizado: ${cleanEmail}`);
    } catch (err) {
      console.error("Error al guardar nuevo administrador en Firestore:", err);
      showNotification('error', `Error al autorizar administrador: ${err.message}`);
    }
  };

  // 3. Remove Admin Email with Error Handling
  const handleRemoveAdminEmail = async (emailToRemove) => {
    const targetEmail = emailToRemove.toLowerCase().trim();
    if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      showNotification('error', 'Acción no permitida: No se puede remover al Súper Administrador principal.');
      return;
    }
    if (!window.confirm(`¿Quitar permisos de administrador a ${emailToRemove}?`)) return;

    try {
      playClick();
      const updated = allowedEmails.filter(e => e.toLowerCase() !== targetEmail);
      
      // Update whitelist
      const whitelistRef = doc(db, 'admin_config', 'whitelist');
      await setDoc(whitelistRef, { allowedEmails: updated }, { merge: true });

      // Delete from admins collection if exists
      try {
        await deleteDoc(doc(db, 'admins', targetEmail));
      } catch (colErr) {
        // ignore if not present in separate collection
      }

      showNotification('success', `Se removieron los permisos de administrador a ${emailToRemove}.`);
    } catch (err) {
      console.error("Error al remover administrador de Firestore:", err);
      showNotification('error', `Error al revocar permisos: ${err.message}`);
    }
  };

  // 4. Save Question (Create or Edit) with Error Handling
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!formText.trim() || !formOptionA.trim() || !formOptionB.trim() || !formOptionC.trim()) {
      showNotification('error', 'Por favor completa todos los campos de la pregunta.');
      return;
    }

    try {
      playClick();
      const questionPayload = {
        text: formText.trim(),
        options: [formOptionA.trim(), formOptionB.trim(), formOptionC.trim()],
        correctAnswer: Number(formCorrect),
        order: Number(formOrder) || (questions.length + 1),
        updatedAt: serverTimestamp()
      };

      if (isEditing && editingId) {
        const qRef = doc(db, 'questions', editingId);
        await updateDoc(qRef, questionPayload);
        showNotification('success', 'Pregunta actualizada exitosamente en Firestore.');
      } else {
        questionPayload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'questions'), questionPayload);
        showNotification('success', 'Nueva pregunta creada exitosamente en Firestore.');
      }

      resetForm();
    } catch (err) {
      console.error("Error al guardar la pregunta en Firestore:", err);
      showNotification('error', `Error de Firestore: ${err.message}`);
    }
  };

  const handleEditClick = (q) => {
    playClick();
    setIsEditing(true);
    setEditingId(q.id);
    setFormText(q.text || '');
    setFormOptionA(q.options?.[0] || '');
    setFormOptionB(q.options?.[1] || '');
    setFormOptionC(q.options?.[2] || '');
    setFormCorrect(q.correctAnswer || 0);
    setFormOrder(q.order || 1);
    setShowFormModal(true);
  };

  // 5. Delete Question with Error Handling
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('¿Deseas eliminar definitivamente esta pregunta?')) return;
    try {
      playClick();
      await deleteDoc(doc(db, 'questions', id));
      showNotification('success', 'Pregunta eliminada de Firestore.');
    } catch (err) {
      console.error("Error al eliminar pregunta de Firestore:", err);
      showNotification('error', `Error al eliminar de Firestore: ${err.message}`);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormText('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormCorrect(0);
    setFormOrder(questions.length + 1);
    setShowFormModal(false);
  };

  // 6. Seed official ITGB questions with Error Handling
  const handleSeedQuestions = async () => {
    if (!window.confirm('¿Deseas precargar las preguntas técnicas oficiales del ITGB en Firestore?')) return;

    try {
      playClick();
      for (const q of DEFAULT_QUESTIONS) {
        await addDoc(collection(db, 'questions'), {
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          order: q.order,
          createdAt: serverTimestamp()
        });
      }
      showNotification('success', '¡Preguntas oficiales cargadas exitosamente en Firestore!');
    } catch (err) {
      console.error("Error al precargar preguntas en Firestore:", err);
      showNotification('error', `Error al precargar en Firestore: ${err.message}`);
    }
  };

  // 7. Reset My Test Progress with Error Handling
  const handleResetMyScore = async () => {
    if (!user) return;
    try {
      playClick();
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        score: 0,
        totalTimeSeconds: 0,
        currentQuestionIndex: 0,
        status: 'registered',
        completedAt: null
      });
      showNotification('success', 'Tu progreso fue reiniciado a 0. Ya puedes jugar de nuevo.');
    } catch (err) {
      console.error("Error al reiniciar tu progreso en Firestore:", err);
      showNotification('error', `Error al reiniciar progreso: ${err.message}`);
    }
  };

  // 8. Reset All Scores with Error Handling
  const handleResetAllScores = async () => {
    const confirmation = window.prompt('Escribe "RESET" para reiniciar los puntajes de TODOS los participantes:');
    if (confirmation !== 'RESET') return;

    try {
      playClick();
      const usersSnap = await getDocs(collection(db, 'users'));
      const batchPromises = [];
      usersSnap.forEach(userDoc => {
        batchPromises.push(
          updateDoc(doc(db, 'users', userDoc.id), {
            score: 0,
            totalTimeSeconds: 0,
            currentQuestionIndex: 0,
            status: 'registered',
            completedAt: null
          })
        );
      });
      await Promise.all(batchPromises);
      showNotification('success', 'Se reiniciaron los puntajes de todos los participantes.');
    } catch (err) {
      console.error("Error al reiniciar puntajes generales en Firestore:", err);
      showNotification('error', `Error al reiniciar puntajes: ${err.message}`);
    }
  };

  // While checking authorization state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If unauthorized, return null while redirect effect executes
  if (!user || !isAuthorized) {
    return null;
  }

  // PROTECTED ADMIN VIEW
  return (
    <div className="min-h-screen flex flex-col justify-between pb-8 font-sans">
      <Header />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col">
        {/* Header Title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 border border-red-500/40 text-red-300 text-[11px] font-bold uppercase tracking-wider mb-1">
              <ShieldAlert size={12} />
              PANEL OFICIAL ITGB
            </div>
            <h1 className="text-2xl font-black text-white">
              ADMINISTRACIÓN
            </h1>
          </div>

          <button
            onClick={() => {
              playClick();
              resetForm();
              setShowFormModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <Plus size={16} />
            <span>NUEVA PREGUNTA</span>
          </button>
        </div>

        {/* Notifications */}
        {feedbackMsg.text && (
          <div className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
              : feedbackMsg.type === 'info'
                ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tools Section */}
        <div className="bg-slate-900/90 rounded-2xl p-4 mb-5 border border-slate-700/60 space-y-2.5 shadow-sm">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Database size={14} className="text-cyan-400" />
            HERRAMIENTAS DE PRUEBA Y TRANSMISIÓN
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResetMyScore}
              className="p-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>REINICIAR MI JUEGO</span>
            </button>

            <button
              onClick={handleSeedQuestions}
              className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>CARGAR OFICIALES</span>
            </button>
          </div>

          <button
            onClick={handleResetAllScores}
            className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>REINICIAR TODOS LOS PUNTAJES (INICIAR STREAM)</span>
          </button>
        </div>

        {/* Active Questions List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>PREGUNTAS ACTIVAS ({questions.length})</span>
            <span>ORDEN ASCENDENTE</span>
          </div>

          {loadingQuestions ? (
            <div className="p-8 text-center text-xs text-cyan-400 font-bold">
              Cargando preguntas de Firestore...
            </div>
          ) : questions.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-900/70 border border-slate-800 text-slate-400 text-xs">
              No hay preguntas cargadas aún. Presiona "CARGAR OFICIALES" o "NUEVA PREGUNTA".
            </div>
          ) : (
            questions.map((q, idx) => (
              <div 
                key={q.id}
                className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 hover:border-cyan-500/40 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center">
                      #{q.order || idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Pregunta {idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-white mb-3">
                  {q.text}
                </p>

                {/* Options display */}
                <div className="space-y-1.5">
                  {q.options?.map((opt, optIdx) => {
                    const isRight = optIdx === q.correctAnswer;
                    const letter = ['A', 'B', 'C'][optIdx];
                    return (
                      <div 
                        key={optIdx} 
                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                          isRight 
                            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold' 
                            : 'bg-slate-950/60 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center ${
                          isRight ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letter}
                        </span>
                        <span className="truncate">{opt}</span>
                        {isRight && <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400">(Correcta)</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Admin Whitelist Management Section */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/60 shadow-sm mb-5">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users size={14} className="text-yellow-400" />
            ADMINISTRADORES AUTORIZADOS ({allowedEmails.length + 1})
          </div>

          <form onSubmit={handleAddAdminEmail} className="flex gap-2 mb-3">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="nuevo.admin@gmail.com"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs uppercase active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-1"
            >
              <UserPlus size={14} />
              <span>Agregar</span>
            </button>
          </form>

          {/* List of current admins */}
          <div className="space-y-1.5">
            {/* Super Admin */}
            <div className="text-[11px] text-cyan-300 font-mono py-1 px-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-between">
              <span>• {SUPER_ADMIN_EMAIL}</span>
              <span className="text-[9px] uppercase font-bold bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded">Super Admin</span>
            </div>

            {/* Allowed Emails from Whitelist */}
            {allowedEmails.map((email, i) => (
              <div key={i} className="text-[11px] text-slate-300 font-mono py-1 px-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <span>• {email}</span>
                <button
                  onClick={() => handleRemoveAdminEmail(email)}
                  className="text-slate-500 hover:text-red-400 p-0.5 cursor-pointer"
                  title="Eliminar de administradores"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              playClick();
              navigate('/hub');
            }}
            className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Volver al Menú Principal</span>
          </button>
        </div>
      </main>

      {/* MODAL: ADD / EDIT QUESTION */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 border border-cyan-500/40 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="font-bold text-base text-white">
                {isEditing ? 'EDITAR PREGUNTA' : 'NUEVA PREGUNTA'}
              </h2>
              <button 
                onClick={resetForm}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Texto de la Pregunta
                </label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="¿Cuál es el componente que...?"
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Opción A
                </label>
                <input
                  type="text"
                  value={formOptionA}
                  onChange={(e) => setFormOptionA(e.target.value)}
                  placeholder="Primera alternativa"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Opción B
                </label>
                <input
                  type="text"
                  value={formOptionB}
                  onChange={(e) => setFormOptionB(e.target.value)}
                  placeholder="Segunda alternativa"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Opción C
                </label>
                <input
                  type="text"
                  value={formOptionC}
                  onChange={(e) => setFormOptionC(e.target.value)}
                  placeholder="Tercera alternativa"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Respuesta Correcta
                  </label>
                  <select
                    value={formCorrect}
                    onChange={(e) => setFormCorrect(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value={0}>Opción A</option>
                    <option value={1}>Opción B</option>
                    <option value={2}>Opción C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Orden de Aparición
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all duration-300 cursor-pointer shadow-md"
                >
                  {isEditing ? 'Guardar Cambios' : 'Crear Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
