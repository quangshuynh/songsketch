import { normalizeSong, uid, copyOf } from "./song.js";

const LIBRARY_KEY = "songsketch:library:v1";
const LEGACY_KEY = "songsketch:v1"; // the single-song save from before

const read = () => {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.songs) ? parsed.songs : null;
  } catch {
    return null;
  }
};

const write = (songs) => {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify({ songs }));
    return true;
  } catch {
    return false; // quota or private mode, the in-memory song still works
  }
};

// Only the musical fields: never carry another row's id or timestamps along.
const songFields = ({ title, bpm, progression, sections }) => ({ title, bpm, progression, sections });

const entry = (song) => {
  const now = Date.now();
  return { ...songFields(song), id: uid(), createdAt: now, updatedAt: now };
};

/** One-time lift of the old single-song save into the library. */
const migrateLegacy = () => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const song = normalizeSong(JSON.parse(raw));
    return song ? [entry(song)] : [];
  } catch {
    return [];
  }
};

/** Every saved sketch, newest edit first. */
export function listSongs() {
  let songs = read();
  if (!songs) {
    songs = migrateLegacy();
    write(songs);
  }
  return songs
    .map((s) => {
      const clean = normalizeSong(s);
      return clean ? { ...clean, id: s.id || uid(), createdAt: s.createdAt || 0, updatedAt: s.updatedAt || 0 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export const getSong = (id) => listSongs().find((s) => s.id === id) || null;

/** Insert a song and return the stored entry (with its new id). */
export function addSong(song) {
  const row = entry(song);
  write([row, ...listSongs()]);
  return row;
}

/** Save edits to an existing sketch. No-op if the id is gone (e.g. deleted in another tab). */
export function updateSong(id, song) {
  const songs = listSongs();
  const i = songs.findIndex((s) => s.id === id);
  if (i === -1) return null;
  const row = { ...songs[i], ...songFields(song), updatedAt: Date.now() };
  songs[i] = row;
  write(songs);
  return row;
}

export function deleteSong(id) {
  write(listSongs().filter((s) => s.id !== id));
}

export function duplicateSong(id) {
  const src = getSong(id);
  if (!src) return null;
  return addSong({ ...copyOf(src), title: `${src.title} (copy)` });
}
