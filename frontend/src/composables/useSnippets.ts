import { ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { Snippet, SnippetStats, CreateSnippetPayload } from '../types/snippet';

const API_BASE = '/api/snippets';

export function useSnippets() {
  const queryClient = useQueryClient();
  const searchQuery = ref('');
  const selectedLanguage = ref('all');
  const selectedTag = ref('');
  const onlyPinned = ref(false);

  const fetchSnippets = async (): Promise<Snippet[]> => {
    const params = new URLSearchParams();
    if (searchQuery.value.trim()) params.append('q', searchQuery.value.trim());
    if (selectedLanguage.value && selectedLanguage.value !== 'all') params.append('language', selectedLanguage.value);
    if (selectedTag.value) params.append('tag', selectedTag.value);
    if (onlyPinned.value) params.append('pinned', '1');

    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve snippets from vault');
    const json = await res.json();
    return json.data || [];
  };

  const fetchStats = async (): Promise<SnippetStats> => {
    const res = await fetch(`${API_BASE}/meta/stats`);
    if (!res.ok) throw new Error('Failed to load vault statistics');
    const json = await res.json();
    return json.stats;
  };

  const snippetsQuery = useQuery({
    queryKey: ['snippets', searchQuery, selectedLanguage, selectedTag, onlyPinned],
    queryFn: fetchSnippets,
  });

  const statsQuery = useQuery({
    queryKey: ['snippets-stats'],
    queryFn: fetchStats,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateSnippetPayload) => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Parse Zod error if returned from Hono zValidator
        if (data.error && data.error.issues) {
          const first = data.error.issues[0]?.message || 'Validation error';
          throw new Error(first);
        }
        throw new Error(data.message || 'Failed to archive snippet');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['snippets-stats'] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/${id}/pin`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle pin');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });

  const copyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/${id}/copy`, { method: 'POST' });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['snippets-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to purge snippet');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['snippets-stats'] });
    },
  });

  return {
    searchQuery,
    selectedLanguage,
    selectedTag,
    onlyPinned,
    snippets: snippetsQuery.data,
    isLoading: snippetsQuery.isLoading,
    isError: snippetsQuery.isError,
    error: snippetsQuery.error,
    refetch: snippetsQuery.refetch,
    stats: statsQuery.data,
    createSnippet: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    togglePin: pinMutation.mutateAsync,
    recordCopy: copyMutation.mutateAsync,
    deleteSnippet: deleteMutation.mutateAsync,
  };
}
