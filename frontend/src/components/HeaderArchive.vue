<template>
  <header class="border-b-2 border-ink bg-paper pt-6 pb-4">
    <!-- Top Meta Strip -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-ink/30 pb-3 mb-4">
      <div class="flex items-center gap-4">
        <span class="font-bold tracking-widest uppercase">DISPATCH VOL. XXVI</span>
        <span class="text-ink-muted">·</span>
        <span class="text-ink-muted hidden sm:inline">OFFICIAL ARCHIVE REGISTER</span>
        <span class="text-ink-muted hidden sm:inline">·</span>
        <span class="text-ink-muted">{{ currentDate }}</span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Live Stats Ticker -->
        <div v-if="stats" class="flex items-center gap-3 text-ink-light">
          <span><strong class="font-mono text-ink">{{ stats.total }}</strong> ENTRIES</span>
          <span class="text-ink-muted">|</span>
          <span><strong class="font-mono text-ink">{{ stats.totalCopies }}</strong> COPIES FIRED</span>
        </div>

        <!-- Sound Toggle -->
        <button
          @click="toggleSound"
          class="inline-flex items-center gap-1.5 border border-ink/40 bg-paper-aged px-2.5 py-1 text-[11px] font-mono hover:bg-ink hover:text-paper transition-colors"
          :title="soundEnabled ? 'Mute haptic sound' : 'Enable haptic clicks'"
        >
          <span>{{ soundEnabled ? '🔊 HAPTIC: ON' : '🔈 HAPTIC: OFF' }}</span>
        </button>
      </div>
    </div>

    <!-- Masthead Main -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div class="space-y-1">
          <div class="inline-block text-[11px] font-mono tracking-widest uppercase bg-ink text-paper px-2 py-0.5 mb-1">
            TERMINAL & SCRIPT REPOSITORY
          </div>
          <h1 class="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-ink leading-none">
            Raw Snippet Vault<span class="text-editorial-red">.</span>
          </h1>
          <p class="font-serif italic text-ink-muted text-base sm:text-lg max-w-2xl pt-1">
            A permanent shelf for stubborn shell one-liners, uncommitted docker compose recipes, and regex incantations you keep losing in terminal history.
          </p>
        </div>

        <!-- Action Section -->
        <div class="flex items-center gap-3 self-start md:self-end">
          <button
            @click="$emit('open-create')"
            class="btn-raw-solid flex items-center gap-2 text-sm px-4 py-2"
          >
            <span class="font-bold">+</span>
            <span>ARCHIVE NEW SNIPPET</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SnippetStats } from '../types/snippet';
import { useAudioHaptic } from '../composables/useAudioHaptic';

defineProps<{
  stats?: SnippetStats;
}>();

defineEmits<{
  (e: 'open-create'): void;
}>();

const { soundEnabled, toggleSound } = useAudioHaptic();

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date()).toUpperCase();
});
</script>
