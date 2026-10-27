import { z } from 'zod';

export const SupportedLanguages = [
  'bash',
  'sh',
  'sql',
  'docker',
  'git',
  'typescript',
  'javascript',
  'python',
  'nginx',
  'regex',
  'json',
  'yaml',
  'other',
] as const;

export const createSnippetSchema = z.object({
  title: z
    .string({ required_error: 'Title is mandatory' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .default(''),
  code: z
    .string({ required_error: 'Code snippet cannot be empty' })
    .trim()
    .min(1, 'Code snippet cannot be empty')
    .max(25000, 'Snippet size exceeds 25KB ceiling'),
  language: z
    .enum(SupportedLanguages, {
      errorMap: () => ({ message: 'Unsupported language syntax' }),
    })
    .default('bash'),
  tags: z
    .string()
    .trim()
    .max(200, 'Tags string too long')
    .optional()
    .default(''),
  is_pinned: z
    .union([z.boolean(), z.number()])
    .transform((val) => (val ? 1 : 0))
    .optional()
    .default(0),
});

export const updateSnippetSchema = createSnippetSchema.partial();

export const querySnippetSchema = z.object({
  q: z.string().optional(),
  language: z.string().optional(),
  tag: z.string().optional(),
  pinned: z.string().optional(),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
