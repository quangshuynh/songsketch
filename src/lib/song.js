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

export const DEFAULT_SONG = {
  title: "I Just Wanna Feel Alive",
  bpm: 74,
  progression: ["Am", "F", "C", "G"],
  sections: [
    { id: "s1", label: "Verse 1", tag: "the ache", warmth: 0.0, pluck: false, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Just voice + one instrument. Stay low, almost talking.",
      lyric: ["Trapped inside this box of resentment", "These feelings spiral in my brain", "…oo oh oh, ooo oh oh oh…", "Growing up feels so long"] },
    { id: "s2", label: "Verse 2", tag: "the isolation", warmth: 0.15, pluck: true, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Fingerpicking comes in. Keep the melody flat and close.",
      lyric: ["No missed calls, phone's been quiet a while", "Same four walls, same afternoon light", "Been staring at the ceiling half the night", "There's a door right there but I never go"] },
    { id: "s3", label: "Pre-chorus", tag: "the pressure", warmth: 0.28, pluck: true, bass: true, kick: false, hat: false, kickFour: false,
      cue: "Tension builds. Lean into the words a little more.",
      lyric: ["Choking on my words, feeling so conflicted", "Everything I wanna say", "Just dies before I said it"] },
    { id: "s4", label: "Chorus 1", tag: "yearning", warmth: 0.4, pluck: true, bass: true, kick: false, hat: false, kickFour: false,
      cue: "The hook, but held back. Sung low and aching.",
      lyric: ["I just wanna feel alive", "This feeling I have trapped inside", "I just wanna feel alive", "Been holding my breath, don't know why"] },
    { id: "s5", label: "Verse 3", tag: "the bottom", warmth: 0.22, pluck: true, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Strip it back. The most vulnerable moment, barely there.",
      lyric: ["Mother shouldn't have kept me", "Like she gave away my brother", "Been carrying that quiet", "Trying not to become her"] },
    { id: "s6", label: "Bridge", tag: "the turn", warmth: 0.65, pluck: true, bass: true, kick: true, hat: false, kickFour: false,
      cue: "It lifts. Drums enter. Start opening your voice up.",
      lyric: ["But the lock was never on the outside", "It's my hands, it's my hands this time", "I can't undo it, I can just decide", "To breathe, to move, to be alive"] },
    { id: "s7", label: "Chorus 2", tag: "release", warmth: 1.0, pluck: true, bass: true, kick: true, hat: true, kickFour: true,
      cue: "Let it soar. Full voice. Windows down, wide awake.",
      lyric: ["I just wanna feel alive", "And this feeling isn't trapped inside", "I just wanna feel alive", "Windows down, I'm wide awake tonight"] },
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
