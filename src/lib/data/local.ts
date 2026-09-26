import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createMemoryRepo, type StoredData } from './memory';

/*
 * LOCAL mode: all data lives in one JSON file on this server (DATA_DIR/db.json), photos in
 * DATA_DIR/photos. Suited to a single small business on one VPS running a single app process.
 * Back up DATA_DIR regularly.
 */

export const dataDir = () => path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const dbFile = () => path.join(dataDir(), 'db.json');
export const photoDir = () => path.join(dataDir(), 'photos');
/** Customer ID documents — never served publicly. */
const docDir = () => path.join(dataDir(), 'documents');
const safeDocName = (name: string) => (/^[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/.test(name) ? name : null);

const empty = (): StoredData => ({ cars: [], customers: [], rentals: [], invoices: [], pins: {} });

const g = globalThis as unknown as { __tgLocal?: Promise<StoredData>; __tgLocalWrite?: Promise<void> };

async function readDb(): Promise<StoredData> {
  try {
    const parsed = JSON.parse(await readFile(dbFile(), 'utf8'));
    return { ...empty(), ...parsed };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return empty();
    throw e; // never silently replace a file we could not parse
  }
}

const load = () => (g.__tgLocal ??= readDb());

/** Writes are serialised and atomic (write temp file, then rename). */
function save() {
  const run = async () => {
    const data = await load();
    await mkdir(dataDir(), { recursive: true });
    const tmp = dbFile() + '.tmp';
    await writeFile(tmp, JSON.stringify(data, null, 1), { mode: 0o600 });
    await rename(tmp, dbFile());
  };
  g.__tgLocalWrite = (g.__tgLocalWrite ?? Promise.resolve()).then(run, run);
  return g.__tgLocalWrite;
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export const localRepo = createMemoryRepo({
  mode: 'local',
  load,
  save,
  async savePhoto(carId, file) {
    const ext = EXT[file.type];
    if (!ext) throw new Error('Photo must be JPG, PNG or WebP');
    await mkdir(photoDir(), { recursive: true });
    const name = `${carId.replace(/[^a-z0-9]/gi, '')}-${Date.now()}.${ext}`;
    await writeFile(path.join(photoDir(), name), Buffer.from(await file.arrayBuffer()));
    return `/photos/${name}`;
  },
  async saveDocument(file, ext) {
    await mkdir(docDir(), { recursive: true, mode: 0o700 });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(docDir(), name), Buffer.from(await file.arrayBuffer()), { mode: 0o600 });
    return name;
  },
  async readDocument(name) {
    const safe = safeDocName(name);
    if (!safe) return null;
    try {
      return await readFile(path.join(docDir(), safe));
    } catch {
      return null;
    }
  },
  async deleteDocument(name) {
    const safe = safeDocName(name);
    if (safe) await rm(path.join(docDir(), safe), { force: true });
  },
});
