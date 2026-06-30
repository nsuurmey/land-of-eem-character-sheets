import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DATABASE_PATH } from './config.js';

mkdirSync(dirname(resolve(DATABASE_PATH)), { recursive: true });

export interface CharRow {
  id: number;
  guild_id: string;
  owner_user_id: string;
  name: string;
  pronouns: string;
  folk: string;
  class: string;
  homeland: string;
  level: number;
  xp: number;
  tier: 'lite' | 'full';
  kind: 'pc' | 'npc';
  vim: number;
  vigor: number;
  knack: number;
  knowhow: number;
  attack: number;
  defense: number;
  dread_die: string;
  courage_current: number;
  courage_max: number;
  quest_pts: number;
  slots_used: number;
  slots_max: number;
  inv_worn: string;
  inv_carried: string;
  perks: string;
  skills: string;
  portrait_url: string;
  conditions: string;
  created_at: string;
  updated_at: string;
}

const db = new Database(DATABASE_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    pronouns TEXT DEFAULT '',
    folk TEXT DEFAULT '',
    class TEXT DEFAULT '',
    homeland TEXT DEFAULT '',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'lite',
    kind TEXT DEFAULT 'pc',
    vim INTEGER DEFAULT 0,
    vigor INTEGER DEFAULT 0,
    knack INTEGER DEFAULT 0,
    knowhow INTEGER DEFAULT 0,
    attack INTEGER DEFAULT 0,
    defense INTEGER DEFAULT 10,
    dread_die TEXT DEFAULT 'd6',
    courage_current INTEGER DEFAULT 6,
    courage_max INTEGER DEFAULT 6,
    quest_pts INTEGER DEFAULT 0,
    slots_used INTEGER DEFAULT 0,
    slots_max INTEGER DEFAULT 6,
    inv_worn TEXT DEFAULT '',
    inv_carried TEXT DEFAULT '',
    perks TEXT DEFAULT '',
    skills TEXT DEFAULT '{}',
    portrait_url TEXT DEFAULT '',
    conditions TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Idempotent migration: drop unique constraint, add kind column if missing
function migrate() {
  const cols = (db.prepare('PRAGMA table_info(characters)').all() as { name: string }[]).map(c => c.name);
  if (!cols.includes('kind')) {
    db.exec("ALTER TABLE characters ADD COLUMN kind TEXT DEFAULT 'pc'");
  }
  db.exec(`
    DROP INDEX IF EXISTS idx_char_owner;
    CREATE INDEX IF NOT EXISTS idx_char_owner ON characters(guild_id, owner_user_id);
  `);
}

migrate();

const stmtGetsByOwner = db.prepare('SELECT * FROM characters WHERE guild_id = ? AND owner_user_id = ? ORDER BY id');
const stmtGetAll = db.prepare('SELECT * FROM characters WHERE guild_id = ? ORDER BY kind, name');
const stmtGetById = db.prepare('SELECT * FROM characters WHERE id = ?');
const stmtInsert = db.prepare(`
  INSERT INTO characters (guild_id, owner_user_id, name, pronouns, folk, class, homeland, kind)
  VALUES (@guild_id, @owner_user_id, @name, @pronouns, @folk, @class, @homeland, @kind)
`);

export function getCharsByOwner(guildId: string, userId: string): CharRow[] {
  return stmtGetsByOwner.all(guildId, userId) as CharRow[];
}

export function getAllChars(guildId: string): CharRow[] {
  return stmtGetAll.all(guildId) as CharRow[];
}

export function getCharById(id: number): CharRow | undefined {
  return stmtGetById.get(id) as CharRow | undefined;
}

export function createChar(partial: {
  guild_id: string;
  owner_user_id: string;
  name: string;
  pronouns: string;
  folk: string;
  class: string;
  homeland: string;
  kind?: 'pc' | 'npc';
}): CharRow {
  const info = stmtInsert.run({ kind: 'pc', ...partial });
  return getCharById(info.lastInsertRowid as number)!;
}

export function updateChar(id: number, patch: Partial<Omit<CharRow, 'id' | 'created_at' | 'updated_at'>>): CharRow {
  const entries = Object.entries(patch).filter(([k]) => !['id', 'created_at', 'updated_at'].includes(k));
  if (entries.length === 0) return getCharById(id)!;

  const setClauses = entries.map(([k]) => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE characters SET ${setClauses}, updated_at = datetime('now') WHERE id = @id`);
  stmt.run({ ...Object.fromEntries(entries), id });
  return getCharById(id)!;
}
