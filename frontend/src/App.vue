<template>
  <div class="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-ink selection:text-paper">
    <!-- Masthead -->
    <HeaderArchive :stats="stats" @open-create="openCreateModal" />

    <!-- Control & Search Strip -->
    <section class="border-b border-ink/30 bg-paper-aged py-3 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <!-- Search Input with Keyboard Shortcut -->
          <div class="relative flex-1 max-w-xl">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-ink-muted font-mono text-xs pointer-events-none">
              § QUERY:
            </span>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search title, commands, flags, or tags... (Press '/' to focus)"
              class="w-full border border-ink bg-paper-sheet pl-24 pr-16 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ink"
            />
            <span
              v-if="!searchQuery"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-mono text-ink-muted pointer-events-none"
            >
              [/]
            </span>
            <button
              v-else
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-mono text-ink-muted hover:text-ink"
            >
              CLEAR
            </button>
          </div>

          <!-- Filters Row -->
          <div class="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <!-- Language Quick Tabs -->
            <button
              v-for="lang in languageOptions"
              :key="lang.value"
              @click="setLanguage(lang.value)"
              class="border px-2.5 py-1 text-[11px] font-mono uppercase tracking-tight transition-all"
              :class="
                selectedLanguage === lang.value
                  ? 'bg-ink text-paper border-ink font-bold shadow-raw-sm'
                  : 'bg-paper-sheet text-ink-light border-ink/40 hover:border-ink hover:text-ink'
              "
            >
              {{ lang.label }}
            </button>

            <span class="text-ink-muted hidden sm:inline">|</span>

            <!-- Pinned Filter Toggle -->
            <button
              @click="togglePinnedFilter"
              class="border px-2.5 py-1 text-[11px] font-mono uppercase tracking-tight transition-all"
              :class="
                onlyPinned
                  ? 'bg-editorial-red text-paper border-editorial-red font-bold'
                  : 'bg-paper-sheet text-ink-light border-ink/40 hover:border-ink'
              "
            >
              {{ onlyPinned ? '★ PINNED ONLY' : '☆ SHOW ALL' }}
            </button>
          </div>
        </div>

        <!-- Active Tag Indicator -->
        <div v-if="selectedTag" class="mt-2.5 pt-2 border-t border-ink/10 flex items-center gap-2 text-xs font-mono">
          <span class="text-ink-muted">FILTERED BY TAG:</span>
          <span class="bg-ink text-paper px-2 py-0.5 text-[11px] font-bold">#{{ selectedTag }}</span>
          <button @click="selectedTag = ''" class="text-editorial-red text-[11px] hover:underline ml-2">
            [REMOVE TAG FILTER]
          </button>
        </div>
      </div>
    </section>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 4" :key="i" class="border border-ink/30 bg-paper-sheet p-6 animate-pulse space-y-4">
          <div class="h-4 bg-ink/10 w-1/3"></div>
          <div class="h-6 bg-ink/15 w-3/4"></div>
          <div class="h-28 bg-ink/10 w-full"></div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="isError"
        class="border-2 border-editorial-red bg-editorial-redlight p-8 text-center space-y-4 max-w-xl mx-auto my-12"
      >
        <div class="text-editorial-red font-mono font-bold text-sm">CATALOG RETRIEVAL FAILURE</div>
        <p class="font-serif text-ink text-base">
          {{ error?.message || 'Unable to establish pipe to archive database.' }}
        </p>
        <button @click="() => refetch()" class="btn-raw-solid">
          RETRY CONNECTION
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!snippets || snippets.length === 0"
        class="border border-dashed border-ink/40 bg-paper-sheet p-12 text-center max-w-xl mx-auto my-12 space-y-4"
      >
        <div class="text-4xl font-serif text-ink font-bold">§</div>
        <h3 class="font-serif text-2xl font-bold text-ink">No Snippets Found in Vault</h3>
        <p class="font-serif text-sm text-ink-muted max-w-md mx-auto italic">
          No records match your query. Archive your first shell command or clear active filters.
        </p>
        <div class="pt-2 flex justify-center gap-3">
          <button
            v-if="searchQuery || selectedLanguage !== 'all' || selectedTag || onlyPinned"
            @click="resetFilters"
            class="btn-raw"
          >
            RESET ALL FILTERS
          </button>
          <button @click="openCreateModal" class="btn-raw-solid">
            + FILE NEW SNIPPET
          </button>
        </div>
      </div>

      <!-- Snippets Editorial Grid -->
      <div v-else class="space-y-6">
        <!-- Results Count Bar -->
        <div class="flex items-center justify-between text-xs font-mono text-ink-muted border-b border-ink/20 pb-2">
          <span>FOUND {{ snippets.length }} ARCHIVED ITEM(S)</span>
          <span class="hidden sm:inline">SORTED BY: PINNED FIRST, THEN RECENCY</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SnippetCard
            v-for="s in snippets"
            :key="s.id"
            :snippet="s"
            @pin="handleTogglePin"
            @delete="handleDeleteSnippet"
            @copy="handleCopyEvent"
            @filter-tag="handleFilterByTag"
          />
        </div>
      </div>
    </main>

    <!-- Editorial Footer -->
    <footer class="border-t-2 border-ink bg-paper-aged py-6 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-muted">
        <div>
          <span>RAW SNIPPET VAULT</span> · <span>ENGINEERED BY <a href="https://github.com/DevisRoomi" target="_blank" class="text-ink font-bold hover:underline">DEVISROOMI</a></span>
        </div>
        <div class="flex items-center gap-4">
          <span>BUN 1.4</span>
          <span>·</span>
          <span>HONO V4 + ZOD</span>
          <span>·</span>
          <span>VUE 3.5</span>
          <span>·</span>
          <span>LARAVEL HERD PROXY</span>
        </div>
      </div>
    </footer>

    <!-- Ingestion Modal -->
    <CreateSnippetModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCreateSnippet"
    />

    <!-- Notice Banner -->
    <NoticeBanner :show="toast.show" :text="toast.text" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HeaderArchive from './components/HeaderArchive.vue';
import SnippetCard from './components/SnippetCard.vue';
import CreateSnippetModal from './components/CreateSnippetModal.vue';
import NoticeBanner from './components/NoticeBanner.vue';
import { useSnippets } from './composables/useSnippets';
import { useAudioHaptic } from './composables/useAudioHaptic';
import type { CreateSnippetPayload, Snippet } from './types/snippet';

const {
  searchQuery,
  selectedLanguage,
  selectedTag,
  onlyPinned,
  snippets,
  isLoading,
  isError,
  error,
  refetch,
  stats,
  createSnippet,
  togglePin,
  recordCopy,
  deleteSnippet,
} = useSnippets();

const { playClick, playCopySuccess } = useAudioHaptic();

const showCreateModal = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

const toast = ref({
  show: false,
  text: '',
});

let toastTimer: any = null;
const showToast = (msg: string) => {
  toast.value = { show: true, text: msg };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 2400);
};

const languageOptions = [
  { label: 'ALL', value: 'all' },
  { label: 'BASH', value: 'bash' },
  { label: 'DOCKER', value: 'docker' },
  { label: 'GIT', value: 'git' },
  { label: 'SQL', value: 'sql' },
  { label: 'NGINX', value: 'nginx' },
  { label: 'REGEX', value: 'regex' },
  { label: 'TS/JS', value: 'typescript' },
  { label: 'PYTHON', value: 'python' },
];

const setLanguage = (lang: string) => {
  playClick();
  selectedLanguage.value = lang;
};

const togglePinnedFilter = () => {
  playClick();
  onlyPinned.value = !onlyPinned.value;
};

const resetFilters = () => {
  playClick();
  searchQuery.value = '';
  selectedLanguage.value = 'all';
  selectedTag.value = '';
  onlyPinned.value = false;
};

const openCreateModal = () => {
  playClick();
  showCreateModal.value = true;
};

const handleCreateSnippet = async (payload: CreateSnippetPayload) => {
  try {
    await createSnippet(payload);
    showCreateModal.value = false;
    playCopySuccess();
    showToast(`SUCCESSFULLY ARCHIVED: "${payload.title}"`);
  } catch (err: any) {
    showToast(`REJECTED: ${err.message}`);
    throw err;
  }
};

const handleTogglePin = async (id: number) => {
  try {
    await togglePin(id);
    showToast('PIN STATUS UPDATED');
  } catch (err: any) {
    showToast(err.message);
  }
};

const handleDeleteSnippet = async (id: number) => {
  try {
    await deleteSnippet(id);
    showToast('SNIPPET PURGED FROM ARCHIVE');
  } catch (err: any) {
    showToast(err.message);
  }
};

const handleCopyEvent = (snippet: Snippet) => {
  recordCopy(snippet.id);
  showToast(`COPIED "${snippet.title}" (${snippet.code.length} CHARS)`);
};

const handleFilterByTag = (tag: string) => {
  playClick();
  selectedTag.value = tag;
};

// Keyboard shortcut listener
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === '/' && document.activeElement !== searchInputRef.value && !showCreateModal.value) {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
  if (e.key === 'Escape') {
    if (showCreateModal.value) {
      showCreateModal.value = false;
    } else if (searchQuery.value) {
      searchQuery.value = '';
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>
