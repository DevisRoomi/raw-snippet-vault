import mysql from 'mysql2/promise';
import { Database } from 'bun:sqlite';

export interface SnippetRecord {
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

let isMySQL = true;
let pool: mysql.Pool | null = null;
let sqliteDb: Database | null = null;

export async function initDb() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'raw_snippet_vault',
      waitForConnections: true,
      connectionLimit: 10,
    });

    await pool.query('SELECT 1');
    console.log('[DB] Connected to MySQL (FlyEnv: raw_snippet_vault)');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        code MEDIUMTEXT NOT NULL,
        language VARCHAR(50) NOT NULL DEFAULT 'bash',
        tags VARCHAR(255) NOT NULL DEFAULT '',
        is_pinned TINYINT(1) NOT NULL DEFAULT 0,
        copy_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_lang (language),
        INDEX idx_pinned (is_pinned),
        FULLTEXT INDEX idx_search (title, code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if initial records exist
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM snippets');
    if (rows[0].count === 0) {
      await seedInitialSnippets();
    }

    isMySQL = true;
  } catch (err: any) {
    console.warn('[DB] MySQL connection fallback to Bun SQLite:', err.message);
    isMySQL = false;
    sqliteDb = new Database('snippets.sqlite');
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'bash',
        tags TEXT NOT NULL DEFAULT '',
        is_pinned INTEGER NOT NULL DEFAULT 0,
        copy_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const countRow: any = sqliteDb.query('SELECT COUNT(*) as count FROM snippets').get();
    if (countRow?.count === 0) {
      await seedInitialSnippets();
    }
  }
}

async function seedInitialSnippets() {
  const seeds = [
    {
      title: 'Docker Cleanup Hard Reset',
      description: 'Nuke all stopped containers, dangling images, unused networks, and build caches in one go.',
      code: 'docker system prune -af --volumes',
      language: 'docker',
      tags: 'docker,devops,cleanup',
      is_pinned: 1,
    },
    {
      title: 'Git Force Rebase with Lease',
      description: 'Safe alternative to git push --force. Rejects push if someone else pushed commits to the remote branch in the meantime.',
      code: 'git push --force-with-lease origin HEAD',
      language: 'git',
      tags: 'git,safety,workflow',
      is_pinned: 1,
    },
    {
      title: 'Find Open Port & Kill Process on Linux/macOS',
      description: 'Lsof listening port extraction piped directly into kill -9.',
      code: 'lsof -ti :3000 | xargs kill -9',
      language: 'bash',
      tags: 'bash,terminal,port,process',
      is_pinned: 1,
    },
    {
      title: 'PostgreSQL Active Connections & Queries',
      description: 'Inspect live queries running for more than 5 seconds in pg_stat_activity.',
      code: `SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state\nFROM pg_stat_activity\nWHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'\nAND state != 'idle';`,
      language: 'sql',
      tags: 'sql,postgres,dba,performance',
      is_pinned: 0,
    },
    {
      title: 'FFmpeg Compress Screen Recording to Crisp MP4',
      description: 'H.264 CRF 23 preset slow with faststart for web streaming without bloated bitrate.',
      code: 'ffmpeg -i input.mov -vcodec h264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart output.mp4',
      language: 'bash',
      tags: 'ffmpeg,video,compression,cli',
      is_pinned: 0,
    },
    {
      title: 'Nginx FastCGI Buffer Sizing for Heavy Payloads',
      description: 'Prevent upstream sent too big header 502 Bad Gateway on large JWT cookies.',
      code: 'fastcgi_buffer_size 128k;\nfastcgi_buffers 4 256k;\nfastcgi_busy_buffers_size 256k;',
      language: 'nginx',
      tags: 'nginx,fastcgi,proxy,sysadmin',
      is_pinned: 0,
    },
  ];

  for (const s of seeds) {
    await execute(
      'INSERT INTO snippets (title, description, code, language, tags, is_pinned, copy_count) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [s.title, s.description, s.code, s.language, s.tags, s.is_pinned]
    );
  }
  console.log('[DB] Seeded 6 archival snippets.');
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isMySQL && pool) {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params) as T[];
  }
  return [];
}

export async function execute(sql: string, params: any[] = []): Promise<{ insertId: number; affectedRows: number }> {
  if (isMySQL && pool) {
    const [res] = await pool.execute(sql, params);
    const result = res as any;
    return { insertId: result.insertId || 0, affectedRows: result.affectedRows || 0 };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    const res = stmt.run(...params);
    return { insertId: Number(res.lastInsertRowid), affectedRows: res.changes };
  }
  return { insertId: 0, affectedRows: 0 };
}
