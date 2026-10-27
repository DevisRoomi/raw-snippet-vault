import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { query, execute, SnippetRecord } from '../db';
import { createSnippetSchema, updateSnippetSchema } from '../schemas/snippet';

const snippets = new Hono();

// GET /api/snippets
snippets.get('/', async (c) => {
  try {
    const q = c.req.query('q')?.trim();
    const language = c.req.query('language')?.trim();
    const tag = c.req.query('tag')?.trim();
    const pinned = c.req.query('pinned');

    let sql = 'SELECT * FROM snippets WHERE 1=1';
    const params: any[] = [];

    if (q) {
      sql += ' AND (title LIKE ? OR code LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (language && language !== 'all') {
      sql += ' AND language = ?';
      params.push(language);
    }

    if (tag) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }

    if (pinned === '1' || pinned === 'true') {
      sql += ' AND is_pinned = 1';
    }

    sql += ' ORDER BY is_pinned DESC, id DESC';

    const items = await query<SnippetRecord>(sql, params);
    return c.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/snippets/meta/stats
snippets.get('/meta/stats', async (c) => {
  try {
    const totalRows = await query<any>('SELECT COUNT(*) as total, SUM(copy_count) as total_copies FROM snippets');
    const langRows = await query<any>('SELECT language, COUNT(*) as count FROM snippets GROUP BY language ORDER BY count DESC');
    const popularRows = await query<SnippetRecord>('SELECT * FROM snippets ORDER BY copy_count DESC LIMIT 3');

    return c.json({
      success: true,
      stats: {
        total: Number(totalRows[0]?.total) || 0,
        totalCopies: Number(totalRows[0]?.total_copies) || 0,
        languages: langRows,
        popular: popularRows,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// GET /api/snippets/:id
snippets.get('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const rows = await query<SnippetRecord>('SELECT * FROM snippets WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return c.json({ success: false, message: 'Snippet not found in vault' }, 404);
    }
    return c.json({ success: true, data: rows[0] });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/snippets (Validated with Zod)
snippets.post('/', zValidator('json', createSnippetSchema), async (c) => {
  try {
    const payload = c.req.valid('json');

    const result = await execute(
      'INSERT INTO snippets (title, description, code, language, tags, is_pinned, copy_count) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [
        payload.title,
        payload.description || '',
        payload.code,
        payload.language,
        payload.tags || '',
        payload.is_pinned ?? 0,
      ]
    );

    const inserted = await query<SnippetRecord>('SELECT * FROM snippets WHERE id = ?', [result.insertId]);

    return c.json(
      {
        success: true,
        message: 'Snippet archived to vault',
        data: inserted[0],
      },
      201
    );
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// PATCH /api/snippets/:id/pin (Toggle Pinned)
snippets.patch('/:id/pin', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const rows = await query<SnippetRecord>('SELECT id, is_pinned FROM snippets WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return c.json({ success: false, message: 'Snippet not found' }, 404);
    }

    const nextPin = rows[0].is_pinned ? 0 : 1;
    await execute('UPDATE snippets SET is_pinned = ? WHERE id = ?', [nextPin, id]);

    return c.json({
      success: true,
      data: { id, is_pinned: nextPin },
      message: nextPin ? 'Pinned to top of catalog' : 'Unpinned from top',
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// POST /api/snippets/:id/copy (Increment Copy Counter)
snippets.post('/:id/copy', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    await execute('UPDATE snippets SET copy_count = copy_count + 1 WHERE id = ?', [id]);
    const updated = await query<SnippetRecord>('SELECT id, copy_count FROM snippets WHERE id = ?', [id]);

    return c.json({
      success: true,
      copy_count: updated[0]?.copy_count || 1,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// DELETE /api/snippets/:id
snippets.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const res = await execute('DELETE FROM snippets WHERE id = ?', [id]);
    if (res.affectedRows === 0) {
      return c.json({ success: false, message: 'Snippet not found' }, 404);
    }

    return c.json({ success: true, message: 'Archived snippet purged from catalog' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default snippets;
