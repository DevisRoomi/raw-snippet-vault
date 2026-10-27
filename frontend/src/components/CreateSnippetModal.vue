<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-none">
    <div
      class="card-raw w-full max-w-2xl bg-paper p-6 shadow-raw border-2 border-ink animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="border-b-2 border-ink pb-3 mb-5 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-mono tracking-widest uppercase bg-ink text-paper px-1.5 py-0.5">
            INGESTION FORM
          </span>
          <h2 class="font-serif text-2xl font-bold text-ink mt-1">Archive Code Snippet</h2>
        </div>
        <button
          @click="$emit('close')"
          class="font-mono text-xl border border-ink/40 w-7 h-7 flex items-center justify-center hover:bg-ink hover:text-paper"
        >
          ×
        </button>
      </div>

      <!-- Error Message if Zod Fails -->
      <div
        v-if="errorMessage"
        class="border border-editorial-red bg-editorial-redlight p-3 mb-4 text-xs font-mono text-editorial-red"
      >
        <strong>REJECTION:</strong> {{ errorMessage }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Title & Language Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-mono font-bold uppercase mb-1">
              Title / Command Summary <span class="text-editorial-red">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g. Fast Docker Image Prune with Volumes"
              class="w-full border border-ink bg-paper-sheet px-3 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-ink"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-mono font-bold uppercase mb-1">
              Language Syntax <span class="text-editorial-red">*</span>
            </label>
            <select
              v-model="form.language"
              class="w-full border border-ink bg-paper-sheet px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <option value="bash">bash / shell</option>
              <option value="docker">docker</option>
              <option value="git">git</option>
              <option value="sql">sql</option>
              <option value="nginx">nginx</option>
              <option value="regex">regex</option>
              <option value="typescript">typescript</option>
              <option value="javascript">javascript</option>
              <option value="python">python</option>
              <option value="yaml">yaml / k8s</option>
              <option value="json">json</option>
              <option value="other">other</option>
            </select>
          </div>
        </div>

        <!-- Code Area -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-mono font-bold uppercase">
              Raw Code / Terminal Command <span class="text-editorial-red">*</span>
            </label>
            <span class="text-[11px] font-mono text-ink-muted">
              {{ form.code.length }} chars (Ctrl+Enter to save)
            </span>
          </div>
          <textarea
            v-model="form.code"
            rows="6"
            placeholder="Paste raw shell command, query, or configuration..."
            class="w-full border border-ink bg-[#141312] text-paper font-mono text-xs p-3 leading-relaxed focus:outline-none selection:bg-paper selection:text-ink"
            @keydown.ctrl.enter="handleSubmit"
            @keydown.meta.enter="handleSubmit"
            required
          ></textarea>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-mono font-bold uppercase mb-1">
            Context / Why this exists (Optional)
          </label>
          <input
            v-model="form.description"
            type="text"
            placeholder="e.g. Prevents upstream sent too big header 502 in reverse proxy"
            class="w-full border border-ink bg-paper-sheet px-3 py-2 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <!-- Tags & Pinned -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
          <div>
            <label class="block text-xs font-mono font-bold uppercase mb-1">
              Tags (comma separated)
            </label>
            <input
              v-model="form.tags"
              type="text"
              placeholder="devops, nginx, proxy"
              class="w-full border border-ink bg-paper-sheet px-3 py-1.5 text-xs font-mono focus:outline-none"
            />
          </div>

          <div class="flex items-center gap-2 sm:pt-4">
            <input
              id="pinned-check"
              v-model="form.is_pinned"
              type="checkbox"
              class="h-4 w-4 rounded-none border border-ink text-ink focus:ring-0 cursor-pointer"
            />
            <label for="pinned-check" class="text-xs font-mono cursor-pointer select-none">
              PIN TO FRONT OF REPOSITORY
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="border-t border-ink/20 pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-raw"
          >
            DISCARD
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn-raw-solid flex items-center gap-2"
          >
            <span v-if="isSubmitting">SAVING TO VAULT...</span>
            <span v-else>FILE TO ARCHIVE</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { CreateSnippetPayload } from '../types/snippet';
import { useAudioHaptic } from '../composables/useAudioHaptic';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', payload: CreateSnippetPayload): void;
}>();

const { playClick, playCopySuccess } = useAudioHaptic();
const isSubmitting = ref(false);
const errorMessage = ref('');

const form = reactive<CreateSnippetPayload>({
  title: '',
  description: '',
  code: '',
  language: 'bash',
  tags: '',
  is_pinned: 0,
});

const handleSubmit = async () => {
  errorMessage.value = '';
  if (!form.title.trim() || !form.code.trim()) {
    errorMessage.value = 'Title and code fields are strictly mandatory.';
    return;
  }

  isSubmitting.value = true;
  try {
    playClick();
    emit('created', { ...form, is_pinned: form.is_pinned ? 1 : 0 });
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to archive snippet';
  } finally {
    isSubmitting.value = false;
  }
};
</script>
