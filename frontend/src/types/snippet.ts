export interface Snippet {
  id: number;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string;
  is_pinned: number;
  copy_count: number;
  created_at: string;
  updated_at: string;
}

export interface SnippetStats {
  total: number;
  totalCopies: number;
  languages: { language: string; count: number }[];
  popular: Snippet[];
}

export interface CreateSnippetPayload {
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string;
  is_pinned?: number | boolean;
}
