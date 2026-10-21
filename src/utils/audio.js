// Web Audio API Synthesizer + Background Music Player for STREAM ITGB TRIVIA
let audioCtx = null;
let soundEnabled = true;
let bgmAudio = null;
let bgmInitialized = false;

// Volume levels based on requirements:
// Lofi Background Music: 20% - 25% (0.22)
// SFX: 80% (0.80) to stand out cleanly above the music
export const BGM_VOLUME = 0.22;
export const SFX_VOLUME = 0.80;

// Subscribed listeners for sound state changes
const soundListeners = new Set();

// Load sound preference from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('itgb_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
}

// Subscribe to sound state changes
export const subscribeSoundChange = (callback) => {
  soundListeners.add(callback);
  return () => soundListeners.delete(callback);
};

const notifySoundListeners = (state) => {
  soundListeners.forEach(cb => {
    try {
      cb(state);
    } catch (err) {
      console.warn("Error en sound listener:", err);
    }
  });
};

// Singleton Web Audio Context
function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Background Music Singleton Initialization
export function initBackgroundMusic() {
  if (typeof window === 'undefined' || bgmInitialized) return bgmAudio;

  try {
    // Encoded URI to support spaces in file name "AUDIO HIP HOP LOFI STREAM.mpeg"
    const audioUrl = encodeURI('/AUDIO HIP HOP LOFI STREAM.mpeg');
    bgmAudio = new Audio(audioUrl);
    bgmAudio.loop = true;
    bgmAudio.volume = soundEnabled ? BGM_VOLUME : 0;
    bgmAudio.preload = 'auto';

    bgmInitialized = true;

    // Browser Autoplay Policy Handler:
    // If play is blocked, resume on the first user interaction anywhere
    const playAttempt = () => {
      if (!soundEnabled || !bgmAudio) return;
      bgmAudio.play().then(() => {
        window.removeEventListener('click', playAttempt);
        window.removeEventListener('touchstart', playAttempt);
        window.removeEventListener('keydown', playAttempt);
      }).catch(() => {
        // Autoplay policy prevented immediate playback; wait for user gesture
      });
    };

    if (soundEnabled) {
      playAttempt();
      window.addEventListener('click', playAttempt, { once: true });
      window.addEventListener('touchstart', playAttempt, { once: true });
      window.addEventListener('keydown', playAttempt, { once: true });
    }
  } catch (err) {
    console.warn("No se pudo inicializar la música de fondo:", err);
  }

  return bgmAudio;
}

// Start / Resume BGM
export const playBgm = () => {
  if (!bgmAudio) initBackgroundMusic();
  if (bgmAudio && soundEnabled) {
    bgmAudio.volume = BGM_VOLUME;
    bgmAudio.play().catch(() => {});
  }
};

// Pause BGM
export const pauseBgm = () => {
  if (bgmAudio) {
    bgmAudio.pause();
  }
};

// Sound Status Helpers
export const isSoundEnabled = () => soundEnabled;

export const toggleSound = () => {
  soundEnabled = !soundEnabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('itgb_sound_enabled', String(soundEnabled));
  }

  if (bgmAudio) {
    if (soundEnabled) {
      bgmAudio.volume = BGM_VOLUME;
      bgmAudio.play().catch(() => {});
    } else {
      bgmAudio.pause();
    }
  } else if (soundEnabled) {
    initBackgroundMusic();
  }

  notifySoundListeners(soundEnabled);
  return soundEnabled;
};

// --- SFX SYNTHESIS (80% VOLUME) ---

// 1. Countdown Tick: Called every second of the 15-second timer
// isUrgent: True during final 5 seconds for tense audio escalation
export const playTick = (isUrgent = false) => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Urgent: higher tension frequency (980Hz), Normal: crisp high-hat tick (750Hz)
    osc.type = isUrgent ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 980 : 750, ctx.currentTime);

    if (isUrgent) {
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.09);
    }

    // 80% Capacity Volume (0.80)
    gain.gain.setValueAtTime(SFX_VOLUME, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isUrgent ? 0.09 : 0.06));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isUrgent ? 0.09 : 0.06));
  } catch (e) {
    // ignore
  }
};

// 2. Energetic countdown start sound (¡YA!)
export const playCountdownGo = () => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);
      gain.gain.setValueAtTime(SFX_VOLUME, ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + i * 0.04 + 0.35);
    });
  } catch (e) {
    // ignore
  }
};

// 3. Correct Answer sound (Chime arpeggio at 80% volume)
export const playCorrect = () => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(SFX_VOLUME, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.38);
    });
  } catch (e) {
    // ignore
  }
};

// 4. Wrong Answer sound (Buzzer at 80% volume)
export const playWrong = () => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(SFX_VOLUME, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    // ignore
  }
};

// 5. Button Click
export const playClick = () => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // ignore
  }
};

// 6. Victory Fanfare
export const playVictory = () => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.45 }, // C6
    ];
    let time = ctx.currentTime;
    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, time);
      gain.gain.setValueAtTime(SFX_VOLUME, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + note.d);
      time += note.d * 0.85;
    });
  } catch (e) {
    // ignore
  }
};

// 7. Haptic feedback helper
export const triggerVibrate = (pattern = 15) => {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // ignore
    }
  }
};
