import { CHORDS, CHORD_NAMES } from "./chords.js";

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now().toString(36);

// Guard rails for anything coming in from a link, a paste, or old storage.
export const LIMITS = {
  title: 120,
  tag: 60,
  label: 60,
  cue: 300,
  line: 200,
  lines: 40,
  chords: 32,
  sections: 40,
};

export const blankSection = () => ({
  id: uid(), label: "New section", tag: "", warmth: 0.3,
  pluck: true, bass: true, kick: false, hat: false, kickFour: false,
  cue: "Describe how to sing this part.", lyric: ["", ""],
});

// The example everyone sees, so it ships nothing private and nothing owned.
// "The House of the Rising Sun" is a traditional folk ballad in the public
// domain, and chord progressions aren't copyrightable, so the chords, shape,
// and cues below are free to publish. The lyric lines are left as placeholders
// on purpose: the wording most people know is The Animals' 1964 arrangement,
// which is still under copyright. Type your own words over it.
export const DEMO_SONG = {
  title: "House of the Rising Sun (traditional)",
  bpm: 72,
  progression: ["Am", "C", "D", "F", "Am", "C", "E", "E"],
  sections: [
    { id: "s1", label: "Verse 1", tag: "the room", warmth: 0.0, pluck: false, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Just voice and the pad. Almost spoken, let each line sit.",
      lyric: ["Verse 1 goes here", "Eight bars, one line per chord pair", "Hum it first, words later"] },
    { id: "s2", label: "Verse 2", tag: "the telling", warmth: 0.14, pluck: true, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Fingerpicking enters. Same restraint, a little more air.",
      lyric: ["Verse 2 goes here", "Keep the melody low and close"] },
    { id: "s3", label: "Verse 3", tag: "the warning", warmth: 0.28, pluck: true, bass: true, kick: false, hat: false, kickFour: false,
      cue: "Bass underneath now. Lean into the story.",
      lyric: ["Verse 3 goes here", "Push a little harder on the line ends"] },
    { id: "s4", label: "Instrumental", tag: "the turn", warmth: 0.45, pluck: true, bass: true, kick: false, hat: false, kickFour: false,
      cue: "No words. This is the solo. Hum a countermelody over the loop.",
      lyric: [""] },
    { id: "s5", label: "Verse 4", tag: "back down", warmth: 0.3, pluck: true, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Strip it back so the last build has somewhere to climb from.",
      lyric: ["Verse 4 goes here", "Quietest moment, barely there"] },
    { id: "s6", label: "Build", tag: "rising", warmth: 0.68, pluck: true, bass: true, kick: true, hat: false, kickFour: false,
      cue: "Drums enter. Start opening your voice up.",
      lyric: ["The turn goes here", "Let the phrasing stretch"] },
    { id: "s7", label: "Final verse", tag: "full", warmth: 1.0, pluck: true, bass: true, kick: true, hat: true, kickFour: true,
      cue: "Everything in. Full voice, top of your range.",
      lyric: ["Last verse goes here", "Sing it like the first one, but wide open"] },
  ],
};

// A fresh sketch: a skeleton to fill in, not an empty screen.
export const starterSong = () => ({
  title: "Untitled sketch",
  bpm: 78,
  progression: ["Am", "F", "C", "G"],
  sections: [
    { ...blankSection(), label: "Verse", tag: "quiet", warmth: 0.1, pluck: true, bass: false,
      cue: "Sparse. Stay low, almost talking.", lyric: [""] },
    { ...blankSection(), label: "Chorus", tag: "open", warmth: 0.7, pluck: true, bass: true, kick: true,
      cue: "Lift here. Open your voice up.", lyric: [""] },
  ],
});

// ---- validation ------------------------------------------------------------
const str = (v, max, fallback = "") =>
  typeof v === "string" ? v.slice(0, max) : fallback;

const clamp = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

const normalizeSection = (raw) => {
  const s = raw && typeof raw === "object" ? raw : {};
  const lyric = Array.isArray(s.lyric)
    ? s.lyric.slice(0, LIMITS.lines).map((l) => str(l, LIMITS.line))
    : [""];
  return {
    id: typeof s.id === "string" && s.id ? s.id.slice(0, 64) : uid(),
    label: str(s.label, LIMITS.label, "Section"),
    tag: str(s.tag, LIMITS.tag),
    warmth: clamp(s.warmth, 0, 1, 0.3),
    pluck: !!s.pluck, bass: !!s.bass, kick: !!s.kick, hat: !!s.hat, kickFour: !!s.kickFour,
    cue: str(s.cue, LIMITS.cue),
    lyric: lyric.length ? lyric : [""],
  };
};

/**
 * Coerce untrusted song data (share link, pasted JSON, old localStorage) into a
 * song we can safely play and render. Returns null when it isn't a song at all.
 */
export function normalizeSong(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!Array.isArray(raw.sections) || !Array.isArray(raw.progression)) return null;

  const progression = raw.progression
    .filter((c) => typeof c === "string" && Object.hasOwn(CHORDS, c))
    .slice(0, LIMITS.chords);
  const sections = raw.sections.slice(0, LIMITS.sections).map(normalizeSection);
  if (!progression.length || !sections.length) return null;

  return {
    title: str(raw.title, LIMITS.title, "Untitled sketch"),
    bpm: Math.round(clamp(raw.bpm, 40, 200, 78)),
    progression,
    sections,
  };
}

/** Strip identity so a song can be re-saved as a separate copy. */
export const copyOf = (song) => ({
  ...song,
  sections: song.sections.map((s) => ({ ...s, id: uid() })),
});

export const summarize = (song) =>
  `${song.progression.join(" ")} · ${song.bpm} bpm · ${song.sections.length} section${song.sections.length === 1 ? "" : "s"}`;

export { CHORDS, CHORD_NAMES };
