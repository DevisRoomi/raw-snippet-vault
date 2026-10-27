<template>
  <article
    class="card-raw relative flex flex-col justify-between p-5 transition-shadow duration-150"
    :class="snippet.is_pinned ? 'border-2 border-ink bg-paper-sheet shadow-raw' : 'hover:shadow-raw'"
  >
    <!-- Top Metadata Header -->
    <div class="border-b border-ink/20 pb-3 mb-4">
      <div class="flex items-center justify-between gap-2 text-xs font-mono mb-2">
        <div class="flex items-center gap-2">
          <span class="font-bold text-ink-muted">§ REC #{{ String(snippet.id).padStart(4, '0') }}</span>
          <span class="text-ink-muted">/</span>
          <span class="uppercase font-bold tracking-wider px-1.5 py-0.5 bg-paper-aged border border-ink/40 text-[10px]">
            {{ snippet.language }}
          </span>
          <span v-if="snippet.is_pinned" class="bg-editorial-red text-paper px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">
            PINNED
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-ink-muted text-[11px] font-mono hidden sm:inline">
            COPIED {{ snippet.copy_count }}x
          </span>

          <!-- Pin Button -->
          <button
            @click.stop="handlePin"
            class="text-[11px] font-mono border border-ink/30 px-2 py-0.5 hover:bg-ink hover:text-paper transition-colors"
            :title="snippet.is_pinned ? 'Unpin snippet' : 'Pin snippet to top'"
          >
            {{ snippet.is_pinned ? '★ PINNED' : '☆ PIN' }}
          </button>

          <!-- Delete Button -->
          <button
            @click.stop="handleDelete"
            class="text-[11px] font-mono border border-ink/30 px-1.5 py-0.5 text-editorial-red hover:bg-editorial-red hover:text-paper transition-colors"
            title="Purge from vault"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Title -->
      <h3 class="font-serif text-xl sm:text-2xl font-bold text-ink leading-snug">
        {{ snippet.title }}
      </h3>

      <!-- Description / Context -->
      <p v-if="snippet.description" class="font-serif text-sm text-ink-light mt-1.5 italic leading-relaxed">
        {{ snippet.description }}
      </p>
    </div>

    <!-- Code Display Area -->
    <div class="relative my-2 border border-ink bg-ink text-paper text-xs font-mono overflow-hidden">
      <!-- Top Code Bar -->
      <div class="flex items-center justify-between px-3 py-1.5 bg-[#1F1D1B] border-b border-ink/80 text-[10px] text-paper/70 font-mono">
        <span>{{ snippet.code.split('\n').length }} LINES · {{ snippet.code.length }} CHARS</span>
        <button
          @click="handleCopy"
          class="border border-paper/40 px-2.5 py-0.5 text-paper hover:bg-paper hover:text-ink transition-colors uppercase font-bold tracking-wide flex items-center gap-1.5"
        >
          <span v-if="copied">✓ COPIED</span>
          <span v-else>COPY RAW</span>
        </button>
      </div>

      <!-- Code Text with Line Numbers -->
      <div class="overflow-x-auto p-3 text-paper/90 select-all font-mono leading-relaxed max-h-56">
        <pre class="font-mono text-xs">{{ snippet.code }}</pre>
      </div>
    </div>

    <!-- Bottom Footer (Tags & Date) -->
    <div class="pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink-muted mt-2">
      <!-- Tags -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          v-for="tag in cleanTags"
          :key="tag"
          @click="$emit('filter-tag', tag)"
          class="tag-raw cursor-pointer hover:border-ink hover:text-ink"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- Date -->
      <span class="text-[10px] text-ink-faint">
        FILED: {{ formatDate(snippet.created_at) }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Snippet } from '../types/snippet';
import { useAudioHaptic } from '../composables/useAudioHaptic';

const props = defineProps<{
  snippet: Snippet;
}>();

const emit = defineEmits<{
  (e: 'pin', id: number): void;
  (e: 'delete', id: number): void;
  (e: 'copy', snippet: Snippet): void;
  (e: 'filter-tag', tag: string): void;
}>();

const { playClick, playCopySuccess } = useAudioHaptic();
const copied = ref(false);

const cleanTags = computed(() => {
  if (!props.snippet.tags) return [];
  return props.snippet.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
});

const handleCopy = async () => {
  playCopySuccess();
  await navigator.clipboard.writeText(props.snippet.code);
  copied.value = true;
  emit('copy', props.snippet);
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const handlePin = () => {
  playClick();
  emit('pin', props.snippet.id);
};

const handleDelete = () => {
  playClick();
  if (confirm(`Purge "${props.snippet.title}" permanently from vault catalog?`)) {
    emit('delete', props.snippet.id);
  }
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};
</script>
