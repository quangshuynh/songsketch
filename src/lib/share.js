import { normalizeSong } from "./song.js";

/* ============================================================
   Share links. Everything lives in the URL hash, there's no
   server, so a link IS the song. We pack it into short keys,
   deflate it when the browser can, then base64url it.
   ============================================================ */

const HASH_KEY = "s";
const PLAIN = "1";   // base64url(utf8 json)
const PACKED = "2";  // base64url(deflate-raw(utf8 json))

const FLAGS = [["pluck", 1], ["bass", 2], ["kick", 4], ["hat", 8], ["kickFour", 16]];

const pack = (song) => ({
  v: 1,
  t: song.title,
  b: song.bpm,
  p: song.progression,
  s: song.sections.map((s) => ({
    l: s.label,
    g: s.tag || undefined,
    w: Math.round(s.warmth * 100),
    f: FLAGS.reduce((m, [k, bit]) => m | (s[k] ? bit : 0), 0),
    c: s.cue || undefined,
    y: s.lyric,
  })),
});

const unpack = (o) => ({
  title: o.t,
  bpm: o.b,
  progression: o.p,
  sections: (Array.isArray(o.s) ? o.s : []).map((s) => ({
    label: s.l,
    tag: s.g,
    warmth: Number(s.w) / 100,
    ...Object.fromEntries(FLAGS.map(([k, bit]) => [k, !!(Number(s.f) & bit)])),
    cue: s.c,
    lyric: s.y,
  })),
});

// ---- bytes <-> base64url ---------------------------------------------------
const toBase64url = (bytes) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64url = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

// ---- optional deflate (Safari 16.4+/Chrome 80+/Firefox 113+) ---------------
const squeeze = async (bytes, Ctor, format) => {
  const stream = new Blob([bytes]).stream().pipeThrough(new Ctor(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

/** Song -> URL-safe payload string. */
export async function encodeSong(song) {
  const json = new TextEncoder().encode(JSON.stringify(pack(song)));
  if (typeof CompressionStream !== "undefined") {
    try {
      return PACKED + toBase64url(await squeeze(json, CompressionStream, "deflate-raw"));
    } catch {
      /* fall through to plain */
    }
  }
  return PLAIN + toBase64url(json);
}

/** Payload string -> song, or null if it's damaged (truncated link, typo, junk). */
export async function decodeSong(payload) {
  try {
    const kind = payload[0];
    const body = fromBase64url(payload.slice(1));
    let json;
    if (kind === PACKED) {
      if (typeof DecompressionStream === "undefined") return null;
      json = new TextDecoder().decode(await squeeze(body, DecompressionStream, "deflate-raw"));
    } else if (kind === PLAIN) {
      json = new TextDecoder().decode(body);
    } else {
      return null;
    }
    return normalizeSong(unpack(JSON.parse(json)));
  } catch {
    return null;
  }
}

/** Full link for a payload, e.g. https://you.github.io/songsketch/#s=2AbC... */
export const shareUrl = (payload) =>
  `${window.location.origin}${window.location.pathname}#${HASH_KEY}=${payload}`;

/** Pull the payload out of the address bar, if this visit is a shared link. */
export function readShareHash() {
  const m = window.location.hash.match(new RegExp(`[#&]${HASH_KEY}=([^&]+)`));
  return m ? m[1] : null;
}

/** Accept a pasted full link, a bare "#s=..." fragment, or a raw payload. */
export function payloadFromText(text) {
  const t = text.trim();
  if (!t) return null;
  const m = t.match(new RegExp(`[#&]${HASH_KEY}=([^&\\s]+)`));
  if (m) return m[1];
  return /^[12][A-Za-z0-9_-]+$/.test(t) ? t : null;
}

/** Drop the payload from the address bar without reloading or adding history. */
export function clearShareHash() {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
