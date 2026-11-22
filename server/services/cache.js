import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

/**
 * Universal Cache Service:
 * Uses SQLite (via built-in node:sqlite) with automatic fallback to JSON file storage.
 * Keyed by SHA-256 hash of normalized review text.
 */
class CacheService {
  constructor() {
    this.dataDir = config.dataDir;
    this.jsonPath = path.join(this.dataDir, 'cache.json');
    this.sqlitePath = path.join(this.dataDir, 'reviews_cache.sqlite');
    this.engine = 'json'; // default fallback
    this.db = null;
    this.memoryCache = new Map();
    this.init();
  }

  init() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Try initializing node:sqlite
    try {
      // Dynamic import / require of node:sqlite
      const sqliteModule = awaitImport('node:sqlite');
      if (sqliteModule && sqliteModule.DatabaseSync) {
        this.db = new sqliteModule.DatabaseSync(this.sqlitePath);
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS review_cache (
            hash TEXT PRIMARY KEY,
            sentiment TEXT NOT NULL,
            topics TEXT NOT NULL,
            summary TEXT NOT NULL,
            needs_reply INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            provider TEXT
          );
        `);
        this.engine = 'sqlite';
        return;
      }
    } catch {
      // SQLite unavailable, fallback gracefully to JSON file storage
    }

    // Fallback: JSON file cache
    this.engine = 'json';
    if (fs.existsSync(this.jsonPath)) {
      try {
        const raw = fs.readFileSync(this.jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [key, value] of Object.entries(parsed)) {
          this.memoryCache.set(key, value);
        }
      } catch {
        this.memoryCache = new Map();
      }
    }
  }

  get(hash) {
    if (!hash) return null;

    if (this.engine === 'sqlite' && this.db) {
      try {
        const stmt = this.db.prepare('SELECT * FROM review_cache WHERE hash = ?');
        const row = stmt.get(hash);
        if (!row) return null;
        return {
          sentiment: row.sentiment,
          topics: JSON.parse(row.topics),
          summary: row.summary,
          needs_reply: Boolean(row.needs_reply),
          created_at: row.created_at,
          provider: row.provider,
          cached: true
        };
      } catch {
        // Fallback to memory
      }
    }

    if (this.memoryCache.has(hash)) {
      const item = this.memoryCache.get(hash);
      return { ...item, cached: true };
    }

    return null;
  }

  set(hash, data) {
    if (!hash || !data) return;

    const payload = {
      sentiment: data.sentiment,
      topics: data.topics,
      summary: data.summary,
      needs_reply: Boolean(data.needs_reply),
      created_at: new Date().toISOString(),
      provider: data.provider || config.llmProvider
    };

    if (this.engine === 'sqlite' && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO review_cache 
          (hash, sentiment, topics, summary, needs_reply, created_at, provider)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          hash,
          payload.sentiment,
          JSON.stringify(payload.topics),
          payload.summary,
          payload.needs_reply ? 1 : 0,
          payload.created_at,
          payload.provider
        );
        return;
      } catch {
        // Fallback to json persistence
      }
    }

    // JSON persistence
    this.memoryCache.set(hash, payload);
    this._persistJson();
  }

  has(hash) {
    return Boolean(this.get(hash));
  }

  _persistJson() {
    try {
      const obj = Object.fromEntries(this.memoryCache.entries());
      fs.writeFileSync(this.jsonPath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist cache to disk:', err.message);
    }
  }

  clear() {
    if (this.engine === 'sqlite' && this.db) {
      this.db.exec('DELETE FROM review_cache');
    }
    this.memoryCache.clear();
    if (fs.existsSync(this.jsonPath)) {
      try {
        fs.unlinkSync(this.jsonPath);
      } catch {}
    }
  }

  getStats() {
    let size = 0;
    if (this.engine === 'sqlite' && this.db) {
      try {
        const row = this.db.prepare('SELECT COUNT(*) as count FROM review_cache').get();
        size = row ? row.count : 0;
      } catch {}
    } else {
      size = this.memoryCache.size;
    }
    return {
      engine: this.engine,
      cachedEntries: size
    };
  }
}

// Helper for synchronous import of node:sqlite
function awaitImport(specifier) {
  try {
    // eslint-disable-next-line no-eval
    return eval(`require('${specifier}')`);
  } catch {
    return null;
  }
}

export const cacheService = new CacheService();
