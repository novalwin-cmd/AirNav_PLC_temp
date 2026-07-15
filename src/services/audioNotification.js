/**
 * Audio Notification Service
 * Provides alarm beep/sound notifications
 */

let audioContext = null;
let externalAlarmPath = '/sounds/alarm.mp3';
let useExternalAlarm = false;

// probe for an external alarm file (best-effort)
async function probeExternalAlarm() {
  try {
    // If the URL is a blob: or data: URL, assume it's valid (no network probe needed)
    if (externalAlarmPath && (externalAlarmPath.startsWith('blob:') || externalAlarmPath.startsWith('data:'))) {
      useExternalAlarm = true;
      return;
    }
    const res = await fetch(externalAlarmPath, { method: 'HEAD' });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.startsWith('audio')) {
      useExternalAlarm = true;
    }
  } catch (e) {
    // ignore
  }
}

// start probe but don't block module load
probeExternalAlarm();

/**
 * Initialize Web Audio API context
 */
function initAudioContext() {
  if (audioContext) return audioContext;

  if (typeof window !== 'undefined' && window.AudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Best-effort: attempt to resume the AudioContext on first user interaction
    const resumeOnce = () => {
      try {
        if (audioContext && audioContext.state === 'suspended' && typeof audioContext.resume === 'function') {
          audioContext.resume().catch(() => {});
        }
      } catch (e) {
        // ignore
      } finally {
        window.removeEventListener('click', resumeOnce);
        window.removeEventListener('touchstart', resumeOnce);
        window.removeEventListener('keydown', resumeOnce);
      }
    };
    window.addEventListener('click', resumeOnce);
    window.addEventListener('touchstart', resumeOnce);
    window.addEventListener('keydown', resumeOnce);
  }
  return audioContext;
}

/**
 * Play a beep sound using Web Audio API
 * @param {number} frequency - Frequency in Hz (default 800)
 * @param {number} duration - Duration in milliseconds (default 200)
 * @param {number} volume - Volume 0-1 (default 0.3)
 */
export function playBeep(frequency = 800, duration = 200, volume = 0.3) {
  try {
    const ctx = initAudioContext();
    if (!ctx) return; // Audio not supported

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    console.warn('Could not play beep:', e);
  }
}

/**
 * Play alarm sound (two beeps)
 * @param {number} volume - Volume 0-1 (default 0.3)
 */
export function playAlarmSound(volume = 0.3) {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // First beep
    playBeep(800, 200, volume);

    // Second beep after 300ms
    setTimeout(() => {
      playBeep(800, 200, volume);
    }, 300);
  } catch (e) {
    console.warn('Could not play alarm sound:', e);
  }
}

/**
 * Play critical alarm sound (three fast beeps)
 * @param {number} volume - Volume 0-1 (default 0.35)
 */
export function playCriticalAlarmSound(volume = 0.35) {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    // First beep
    playBeep(1000, 150, volume);

    // Second beep after 200ms
    setTimeout(() => {
      playBeep(1000, 150, volume);
    }, 200);

    // Third beep after 400ms
    setTimeout(() => {
      playBeep(1000, 150, volume);
    }, 400);
  } catch (e) {
    console.warn('Could not play critical alarm sound:', e);
  }
}

/**
 * Play notification sound
 * @param {number} volume - Volume 0-1 (default 0.2)
 */
export function playNotificationSound(volume = 0.2) {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
}

/**
 * Trigger alarm notification with appropriate sound
 * @param {'warn'|'crit'} level - Alarm severity level
 */
export function triggerAlarmNotification(level = 'warn') {
  // If an external alarm file is available, prefer that (simple audio element play)
  if (useExternalAlarm) {
    try {
      const a = new Audio(externalAlarmPath);
      a.volume = level === 'crit' ? 0.9 : 0.6;
      a.play().catch(() => {
        // fallback to synthesized
        if (level === 'crit') playCriticalAlarmSound(); else playAlarmSound();
      });
      return;
    } catch (e) {
      // fallback to synthesized
    }
  }
  try {
    const ctx = initAudioContext();
    // Try to resume audio context if suspended (best-effort; may require user gesture)
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {
        // ignore resume errors
      });
    }
  } catch (e) {
    // ignore
  }

  if (level === 'crit') {
    playCriticalAlarmSound(0.35);
  } else {
    playAlarmSound(0.3);
  }
}

/**
 * Set a custom external alarm URL to prefer over synthesized beeps
 * @param {string} url
 */
export function setExternalAlarmUrl(url) {
  try {
    externalAlarmPath = url;
    useExternalAlarm = false;
    // re-probe the provided URL
    probeExternalAlarm();
  } catch (e) {}
}

/**
 * Enable audio explicitly (call from a user gesture)
 * Returns the AudioContext or null
 */
export function enableAudio() {
  try {
    const ctx = initAudioContext();
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch (e) {
    return null;
  }
}
