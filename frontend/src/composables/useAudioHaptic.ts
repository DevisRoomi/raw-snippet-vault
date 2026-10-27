import { ref } from 'vue';

const soundEnabled = ref(localStorage.getItem('vault_sound') !== 'muted');

export function useAudioHaptic() {
  let ctx: AudioContext | null = null;

  const initContext = () => {
    if (!ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
  };

  const playClick = () => {
    if (!soundEnabled.value) return;
    try {
      initContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy guard
    }
  };

  const playCopySuccess = () => {
    if (!soundEnabled.value) return;
    try {
      initContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.06); // E5

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.17);
    } catch {}
  };

  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value;
    localStorage.setItem('vault_sound', soundEnabled.value ? 'enabled' : 'muted');
    if (soundEnabled.value) {
      playClick();
    }
  };

  return {
    soundEnabled,
    playClick,
    playCopySuccess,
    toggleSound,
  };
}
