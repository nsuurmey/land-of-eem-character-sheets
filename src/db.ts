import Database from 'better-sqlite3';
import { DATABASE_PATH } from './config.js';

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

  CREATE UNIQUE INDEX IF NOT EXISTS idx_char_owner
    ON characters(guild_id, owner_user_id);
`);

const stmtGetByOwner = db.prepare('SELECT * FROM characters WHERE guild_id = ? AND owner_user_id = ?');
const stmtGetById = db.prepare('SELECT * FROM characters WHERE id = ?');
const stmtInsert = db.prepare(`
  INSERT INTO characters (guild_id, owner_user_id, name, pronouns, folk, class, homeland)
  VALUES (@guild_id, @owner_user_id, @name, @pronouns, @folk, @class, @homeland)
`);

export function getCharByOwner(guildId: string, userId: string): CharRow | undefined {
  return stmtGetByOwner.get(guildId, userId) as CharRow | undefined;
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
}): CharRow {
  const info = stmtInsert.run(partial);
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
