import { expect, test, describe } from 'bun:test';
import { createSnippetSchema } from '../src/schemas/snippet';

describe('Raw Snippet Vault Zod Validation', () => {
  test('Valid bash snippet passes Zod parsing', () => {
    const validData = {
      title: 'Kill port 3000',
      description: 'Finds PID and kills immediately',
      code: 'lsof -ti :3000 | xargs kill -9',
      language: 'bash' as const,
      tags: 'bash,port',
      is_pinned: true,
    };

    const parsed = createSnippetSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.is_pinned).toBe(1);
      expect(parsed.data.title).toBe('Kill port 3000');
    }
  });

  test('Fails on empty code snippet', () => {
    const invalidData = {
      title: 'Empty Code',
      code: '   ',
      language: 'bash' as const,
    };
    const parsed = createSnippetSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  test('Fails on unsupported language enum', () => {
    const invalidData = {
      title: 'Weird Code',
      code: 'echo test',
      language: 'brainfuck' as any,
    };
    const parsed = createSnippetSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
