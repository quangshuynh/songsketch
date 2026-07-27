import React, { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

/* ============================================================
   SongSketch — a customizable "hum over it" backing-track app.
   Edit sections, lyrics, chords, tempo, and arrangement live.
   ============================================================ */

// Chord library: notes for the pad, a root for the bass, and an arp for picking.
const CHORDS = {
  Am:     { notes: ["A3", "C4", "E4"],       root: "A2", arp: ["A3", "C4", "E4", "A4"] },
  Am7:    { notes: ["A3", "C4", "E4", "G4"],  root: "A2", arp: ["A3", "C4", "E4", "G4"] },
  F:      { notes: ["F3", "A3", "C4"],        root: "F2", arp: ["F3", "A3", "C4", "F4"] },
  Fmaj7:  { notes: ["F3", "A3", "C4", "E4"],  root: "F2", arp: ["F3", "A3", "C4", "E4"] },
  C:      { notes: ["C4", "E4", "G4"],        root: "C3", arp: ["C4", "E4", "G4", "C5"] },
  Cmaj7:  { notes: ["C4", "E4", "G4", "B4"],  root: "C3", arp: ["C4", "E4", "G4", "B4"] },
  G:      { notes: ["G3", "B3", "D4"],        root: "G2", arp: ["G3", "B3", "D4", "G4"] },
  Em:     { notes: ["E3", "G3", "B3"],        root: "E2", arp: ["E3", "G3", "B3", "E4"] },
  Em7:    { notes: ["E3", "G3", "B3", "D4"],  root: "E2", arp: ["E3", "G3", "B3", "D4"] },
  Dm:     { notes: ["D3", "F3", "A3"],        root: "D2", arp: ["D3", "F3", "A3", "D4"] },
  D:      { notes: ["D3", "F#3", "A3"],       root: "D2", arp: ["D3", "F#3", "A3", "D4"] },
  Dsus2:  { notes: ["D3", "E3", "A3"],        root: "D2", arp: ["D3", "E3", "A3", "D4"] },
  E:      { notes: ["E3", "G#3", "B3"],       root: "E2", arp: ["E3", "G#3", "B3", "E4"] },
  A:      { notes: ["A3", "C#4", "E4"],       root: "A2", arp: ["A3", "C#4", "E4", "A4"] },
};
const CHORD_NAMES = Object.keys(CHORDS);

const DEFAULT_SONG = {
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
      cue: "The hook — but held back. Sung low and aching.",
      lyric: ["I just wanna feel alive", "This feeling I have trapped inside", "I just wanna feel alive", "Been holding my breath, don't know why"] },
    { id: "s5", label: "Verse 3", tag: "the bottom", warmth: 0.22, pluck: true, bass: false, kick: false, hat: false, kickFour: false,
      cue: "Strip it back. The most vulnerable moment — barely there.",
      lyric: ["Mother shouldn't have kept me", "Like she gave away my brother", "Been carrying that quiet", "Trying not to become her"] },
    { id: "s6", label: "Bridge", tag: "the turn", warmth: 0.65, pluck: true, bass: true, kick: true, hat: false, kickFour: false,
      cue: "It lifts. Drums enter. Start opening your voice up.",
      lyric: ["But the lock was never on the outside", "It's my hands, it's my hands this time", "I can't undo it, I can just decide", "To breathe, to move, to be alive"] },
    { id: "s7", label: "Chorus 2", tag: "release", warmth: 1.0, pluck: true, bass: true, kick: true, hat: true, kickFour: true,
      cue: "Let it soar. Full voice. Windows down, wide awake.",
      lyric: ["I just wanna feel alive", "And this feeling isn't trapped inside", "I just wanna feel alive", "Windows down, I'm wide awake tonight"] },
  ],
};

// ---- color helpers ---------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) =>
  `rgb(${Math.round(lerp(c1[0], c2[0], t))}, ${Math.round(lerp(c1[1], c2[1], t))}, ${Math.round(lerp(c1[2], c2[2], t))})`;
const COLD = [91, 107, 140];
const WARM = [240, 184, 98];
const BG_COLD = [17, 16, 26];
const BG_WARM = [34, 24, 21];

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const blankSection = () => ({
  id: uid(), label: "New section", tag: "", warmth: 0.3,
  pluck: true, bass: true, kick: false, hat: false, kickFour: false,
  cue: "Describe how to sing this part.", lyric: ["", ""],
});

const STORAGE_KEY = "songsketch:v1";
const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SONG;
    const p = JSON.parse(raw);
    if (!p.sections || !p.progression) return DEFAULT_SONG;
    return p;
  } catch (e) { return DEFAULT_SONG; }
};

export default function App() {
  const [song, setSong] = useState(loadSaved);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [bar, setBar] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [editing, setEditing] = useState(false);
  const [io, setIo] = useState({ open: false, text: "", msg: "" });

  const songRef = useRef(song);
  const barRef = useRef(0);
  const inst = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => { songRef.current = song; }, [song]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(song)); } catch (e) {}
  }, [song]);
  useEffect(() => { if (ready) Tone.Transport.bpm.rampTo(song.bpm, 0.1); }, [song.bpm, ready]);

  const plen = Math.max(song.progression.length, 1);
  const secIdx = Math.min(Math.floor(bar / plen), song.sections.length - 1);
  const sec = song.sections[secIdx] || song.sections[0];
  const chordName = song.progression[bar % plen];
  const warmth = sec ? sec.warmth : 0;

  const bg = mix(BG_COLD, BG_WARM, warmth);
  const accent = mix(COLD, WARM, warmth);
  const shapePct = lerp(40, 84, warmth);
  const radiusPct = lerp(5, 50, warmth);
  const glow = lerp(6, 60, warmth);
  const wallOpacity = (1 - warmth) * 0.45;

  // ---- audio setup ---------------------------------------------------------
  const setup = async () => {
    await Tone.start();
    const limiter = new Tone.Limiter(-2).toDestination();
    const reverb = new Tone.Freeverb(0.82, 2600);
    reverb.wet.value = 0.34;
    reverb.connect(limiter);

    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.6, decay: 0.3, sustain: 0.7, release: 2.4 },
    });
    pad.volume.value = -13; pad.connect(reverb);

    const pluck = new Tone.PluckSynth({ attackNoise: 1, dampening: 2800, resonance: 0.92 });
    pluck.volume.value = -11; pluck.connect(reverb);

    const bass = new Tone.MonoSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.9 },
      filterEnvelope: { attack: 0.02, decay: 0.2, baseFrequency: 120, octaves: 2 },
    });
    bass.volume.value = -15; bass.connect(limiter);

    const kick = new Tone.MembraneSynth();
    kick.volume.value = -7; kick.connect(limiter);

    const hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } });
    hat.volume.value = -26; hat.connect(reverb);

    inst.current = { pad, pluck, bass, kick, hat, reverb, limiter };
    Tone.Transport.bpm.value = songRef.current.bpm;

    const loop = new Tone.Loop((time) => {
      const s0 = songRef.current;
      const prog = s0.progression.map((n) => CHORDS[n]).filter(Boolean);
      const pl = Math.max(prog.length, 1);
      const secs = s0.sections;
      if (!prog.length || !secs.length) return;

      const b = barRef.current;
      const ch = prog[b % pl];
      const si = Math.floor(b / pl) % secs.length;
      const s = secs[si];
      const q = Tone.Time("4n").toSeconds();
      const e = Tone.Time("8n").toSeconds();

      inst.current.pad.triggerAttackRelease(ch.notes, "1m", time, lerp(0.32, 0.85, s.warmth));
      if (s.pluck) for (let i = 0; i < 8; i++)
        inst.current.pluck.triggerAttackRelease(ch.arp[i % ch.arp.length], "8n", time + i * e, 0.6);
      if (s.bass) inst.current.bass.triggerAttackRelease(ch.root, "1m", time, 0.9);
      if (s.kick) (s.kickFour ? [0, 1, 2, 3] : [0, 2]).forEach((bt) =>
        inst.current.kick.triggerAttackRelease("C1", "8n", time + bt * q));
      if (s.hat) for (let i = 0; i < 8; i++) inst.current.hat.triggerAttackRelease("16n", time + i * e);

      Tone.Draw.schedule(() => {
        setBar(b);
        setPulse(true);
        setTimeout(() => setPulse(false), 170);
      }, time);

      const total = secs.length * pl;
      barRef.current = (b + 1) % total;
    }, "1m");

    loop.start(0);
    loopRef.current = loop;
    setReady(true);
  };

  const toggle = async () => {
    if (!song.progression.length || !song.sections.length) return;
    if (!ready) await setup();
    if (Tone.Transport.state === "started") { Tone.Transport.pause(); setPlaying(false); }
    else { Tone.Transport.start(); setPlaying(true); }
  };

  const restart = () => {
    barRef.current = 0; setBar(0);
    Tone.Transport.stop(); Tone.Transport.position = 0;
    if (playing) Tone.Transport.start();
  };

  useEffect(() => () => {
    try {
      Tone.Transport.stop(); Tone.Transport.cancel();
      if (loopRef.current) loopRef.current.dispose();
      if (inst.current) Object.values(inst.current).forEach((n) => n && n.dispose && n.dispose());
    } catch (e) {}
  }, []);

  // ---- editing helpers -----------------------------------------------------
  const patch = (p) => setSong((s) => ({ ...s, ...p }));
  const patchSection = (id, p) =>
    setSong((s) => ({ ...s, sections: s.sections.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const moveSection = (i, dir) => setSong((s) => {
    const j = i + dir; if (j < 0 || j >= s.sections.length) return s;
    const arr = [...s.sections]; [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...s, sections: arr };
  });
  const removeSection = (id) => setSong((s) => s.sections.length > 1
    ? { ...s, sections: s.sections.filter((x) => x.id !== id) } : s);
  const addSection = () => setSong((s) => ({ ...s, sections: [...s.sections, blankSection()] }));

  const setChord = (i, name) => setSong((s) => {
    const p = [...s.progression]; p[i] = name; return { ...s, progression: p };
  });
  const addChord = () => setSong((s) => ({ ...s, progression: [...s.progression, "C"] }));
  const removeChord = (i) => setSong((s) => s.progression.length > 1
    ? { ...s, progression: s.progression.filter((_, k) => k !== i) } : s);

  const openExport = () => setIo({ open: true, text: JSON.stringify(song, null, 2), msg: "" });
  const loadJSON = () => {
    try {
      const parsed = JSON.parse(io.text);
      if (!parsed.sections || !parsed.progression) throw new Error("missing fields");
      parsed.sections = parsed.sections.map((x) => ({ ...blankSection(), ...x, id: x.id || uid() }));
      setSong({ title: parsed.title || "Untitled", bpm: parsed.bpm || 74, progression: parsed.progression, sections: parsed.sections });
      barRef.current = 0; setBar(0);
      setIo((s) => ({ ...s, msg: "Loaded ✓" }));
    } catch (e) { setIo((s) => ({ ...s, msg: "Couldn't read that — check the JSON." })); }
  };

  return (
    <div className="ss-root" style={{ background: `radial-gradient(circle at 50% 32%, ${bg} 0%, #0a0910 92%)` }}>
      <style>{CSS}</style>

      <header className="ss-head">
        <div className="ss-kicker">song sketch · {song.progression.join(" ")} · {song.bpm} bpm</div>
        <h1 className="ss-title">{song.title || "Untitled"}</h1>
        <div className="ss-sub">a scratch track to hum over — the skeleton, not the finished song</div>
      </header>

      {/* breathing visual */}
      <div className="ss-stage">
        <div className="ss-walls" style={{ opacity: wallOpacity, borderColor: accent }} />
        <div
          className="ss-shape"
          style={{
            width: `${shapePct}%`, height: `${shapePct}%`, borderRadius: `${radiusPct}%`,
            borderColor: accent,
            boxShadow: `0 0 ${glow}px ${lerp(2, 20, warmth)}px ${accent}55, inset 0 0 ${glow / 2}px ${accent}33`,
            background: `radial-gradient(circle, ${accent}${warmth > 0.5 ? "26" : "10"} 0%, transparent 70%)`,
            transform: `scale(${pulse ? 1.055 : 1})`,
          }}
        >
          <span className="ss-shape-inner" style={{ color: accent }}>{playing ? "breathe" : "▶"}</span>
        </div>
      </div>

      {/* controls */}
      <div className="ss-controls">
        <button className="ss-btn ss-btn-main" style={{ background: accent, borderColor: accent }} onClick={toggle}>
          {playing ? "Pause" : ready ? "Play" : "Start"}
        </button>
        <button className="ss-btn ss-btn-ghost" onClick={restart}>↺ Top</button>
        <button className="ss-btn ss-btn-ghost" onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "✎ Edit"}
        </button>
      </div>

      {/* chord readout */}
      <div className="ss-chords">
        {song.progression.map((c, i) => {
          const on = i === bar % plen && playing;
          return (
            <div key={i} className="ss-chip"
              style={{ borderColor: on ? accent : "#2a2838", color: on ? accent : "#6f6c82", transform: on ? "translateY(-2px)" : "none" }}>
              {c}
            </div>
          );
        })}
      </div>

      {/* timeline */}
      <div className="ss-timeline">
        {song.sections.map((s, i) => (
          <div key={s.id} className="ss-tl-item">
            <div className="ss-tl-dot" style={{
              background: i === secIdx ? mix(COLD, WARM, s.warmth) : "#2a2838",
              boxShadow: i === secIdx ? `0 0 10px ${mix(COLD, WARM, s.warmth)}` : "none",
            }} />
            <div className="ss-tl-label" style={{ color: i === secIdx ? "#e8e4dc" : "#5a5870" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* now-playing card */}
      {sec && (
        <div className="ss-card" style={{ borderColor: `${accent}44` }}>
          <div className="ss-card-head">
            <span className="ss-card-tag" style={{ color: accent }}>{sec.label}</span>
            {sec.tag && <span className="ss-card-sub">· {sec.tag}</span>}
          </div>
          {sec.cue && <div className="ss-cue">{sec.cue}</div>}
          <div className="ss-lyric">
            {sec.lyric.filter((l) => l.trim() !== "").map((l, i) => (
              <div key={i} className="ss-lyric-line">{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- EDIT PANEL ---------------- */}
      {editing && (
        <div className="ss-editor">
          <div className="ss-ed-row">
            <label className="ss-field ss-grow">
              <span>Song title</span>
              <input value={song.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label className="ss-field">
              <span>Tempo · {song.bpm} bpm</span>
              <input type="range" min="50" max="140" value={song.bpm}
                onChange={(e) => patch({ bpm: Number(e.target.value) })} />
            </label>
          </div>

          <div className="ss-ed-block">
            <div className="ss-ed-h">Chord loop</div>
            <div className="ss-prog">
              {song.progression.map((c, i) => (
                <div key={i} className="ss-prog-slot">
                  <select value={c} onChange={(e) => setChord(i, e.target.value)}>
                    {CHORD_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button className="ss-x" onClick={() => removeChord(i)} title="remove">×</button>
                </div>
              ))}
              <button className="ss-add-sm" onClick={addChord}>+ chord</button>
            </div>
            <div className="ss-hint">Every section cycles through this loop. Add tension chords (sus2, maj7) for that indie ache.</div>
          </div>

          <div className="ss-ed-h ss-ed-h-lg">Sections</div>
          {song.sections.map((s, i) => (
            <div key={s.id} className="ss-sec-edit">
              <div className="ss-sec-top">
                <input className="ss-sec-label" value={s.label} onChange={(e) => patchSection(s.id, { label: e.target.value })} placeholder="Section name" />
                <input className="ss-sec-tag" value={s.tag} onChange={(e) => patchSection(s.id, { tag: e.target.value })} placeholder="mood tag" />
                <div className="ss-sec-move">
                  <button className="ss-x" onClick={() => moveSection(i, -1)} disabled={i === 0}>↑</button>
                  <button className="ss-x" onClick={() => moveSection(i, 1)} disabled={i === song.sections.length - 1}>↓</button>
                  <button className="ss-x" onClick={() => removeSection(s.id)} disabled={song.sections.length === 1}>×</button>
                </div>
              </div>

              <label className="ss-field">
                <span>Sing-it cue</span>
                <input value={s.cue} onChange={(e) => patchSection(s.id, { cue: e.target.value })} />
              </label>

              <label className="ss-field">
                <span>Lyrics (one line each)</span>
                <textarea rows={4} value={s.lyric.join("\n")}
                  onChange={(e) => patchSection(s.id, { lyric: e.target.value.split("\n") })} />
              </label>

              <div className="ss-field">
                <span>Intensity · {Math.round(s.warmth * 100)}% (cold/trapped → warm/alive)</span>
                <input type="range" min="0" max="1" step="0.05" value={s.warmth}
                  onChange={(e) => patchSection(s.id, { warmth: Number(e.target.value) })} />
              </div>

              <div className="ss-toggles">
                {[["pluck", "Picking"], ["bass", "Bass"], ["kick", "Drums"], ["hat", "Hi-hat"], ["kickFour", "4-on-floor"]].map(([k, lbl]) => (
                  <button key={k} className={"ss-toggle" + (s[k] ? " on" : "")}
                    onClick={() => patchSection(s.id, { [k]: !s[k] })}>{lbl}</button>
                ))}
              </div>
            </div>
          ))}

          <button className="ss-add" onClick={addSection}>+ Add section</button>

          <div className="ss-ed-block">
            <div className="ss-ed-h">Save / load your song</div>
            <div className="ss-io-btns">
              <button className="ss-btn ss-btn-ghost" onClick={openExport}>Export config</button>
              <button className="ss-btn ss-btn-ghost" onClick={() => setIo({ open: true, text: "", msg: "Paste a config, then Load." })}>Import</button>
              <button className="ss-btn ss-btn-ghost" onClick={() => { setSong(DEFAULT_SONG); barRef.current = 0; setBar(0); }}>Reset to demo</button>
            </div>
            {io.open && (
              <div className="ss-io">
                <textarea rows={6} value={io.text} onChange={(e) => setIo((s) => ({ ...s, text: e.target.value }))}
                  placeholder="Your song config (JSON) appears here — copy it to keep, or paste one in and Load." />
                <div className="ss-io-row">
                  <button className="ss-btn ss-btn-ghost" onClick={loadJSON}>Load this config</button>
                  {io.msg && <span className="ss-io-msg">{io.msg}</span>}
                </div>
              </div>
            )}
            <div className="ss-hint">No auto-save — copy the exported text somewhere safe to keep your version.</div>
          </div>
        </div>
      )}

      <footer className="ss-foot">
        Loops forever for practice. Hum nonsense over it first, real words later. The tones are basic
        synths — judge the <em>shape</em> (sparse → full), not the texture. Your actual voices and a real
        guitar are what make it indie.
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
.ss-root * { box-sizing: border-box; }
.ss-root {
  min-height: 100vh; width: 100%; padding: 26px 18px 44px;
  font-family: 'Inter', sans-serif; color: #e8e4dc;
  display: flex; flex-direction: column; align-items: center;
  transition: background 1.4s ease;
}
.ss-root button { cursor: pointer; font-family: 'Inter', sans-serif; transition: all .22s ease; }
.ss-root button:focus-visible { outline: 2px solid #f0b862; outline-offset: 2px; }
.ss-root input, .ss-root textarea, .ss-root select {
  font-family: 'Inter', sans-serif; background: rgba(255,255,255,.04);
  border: 1px solid #2f2d40; border-radius: 8px; color: #e8e4dc; padding: 8px 10px; font-size: 13px; width: 100%;
}
.ss-root textarea { resize: vertical; line-height: 1.5; }
.ss-root input:focus, .ss-root textarea:focus, .ss-root select:focus { outline: none; border-color: #6b6890; }

.ss-head { text-align: center; max-width: 560px; }
.ss-kicker { font-size: 11px; letter-spacing: 2.4px; text-transform: uppercase; color: #7a7790; margin-bottom: 10px; }
.ss-title { font-family: 'Fraunces', serif; font-weight: 500; font-style: italic; font-size: clamp(26px,7vw,46px); margin: 0 0 8px; line-height: 1.05; }
.ss-sub { font-size: 13px; color: #8a8698; font-style: italic; }

.ss-stage { position: relative; width: min(300px, 74vw); aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; margin: 14px 0 4px; }
.ss-walls { position: absolute; width: 84%; height: 84%; border: 1px solid; border-radius: 4px; transition: opacity 1.4s ease, border-color 1.4s ease; }
.ss-shape { position: relative; border: 1.5px solid; display: flex; align-items: center; justify-content: center;
  transition: width 1.4s ease, height 1.4s ease, border-radius 1.4s ease, box-shadow 1.4s ease, background 1.4s ease, transform 1.1s cubic-bezier(.2,.8,.3,1); }
.ss-shape-inner { font-family: 'Fraunces', serif; font-style: italic; font-size: 16px; letter-spacing: 1px; opacity: .85; transition: color 1.4s ease; }

.ss-controls { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; justify-content: center; }
.ss-btn { padding: 11px 22px; border-radius: 40px; border: 1.5px solid; font-size: 14px; font-weight: 600; letter-spacing: .3px; }
.ss-btn-main { color: #12111a; }
.ss-btn-ghost { background: transparent; border-color: #3a3850; color: #c9c6d6; }
.ss-btn:hover { filter: brightness(1.08); }

.ss-chords { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
.ss-chip { min-width: 44px; text-align: center; padding: 7px 6px; border-radius: 10px; border: 1px solid; font-family: 'Fraunces', serif; font-size: 15px; transition: all .22s ease; }

.ss-timeline { display: flex; gap: clamp(5px,2vw,16px); margin-top: 22px; flex-wrap: wrap; justify-content: center; max-width: 640px; }
.ss-tl-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ss-tl-dot { width: 9px; height: 9px; border-radius: 50%; transition: all .5s ease; }
.ss-tl-label { font-size: 10px; letter-spacing: .3px; transition: color .5s ease; white-space: nowrap; }

.ss-card { margin-top: 24px; max-width: 500px; width: 100%; padding: 18px 22px; border-radius: 16px; border: 1px solid; background: rgba(255,255,255,.02); transition: border-color 1.2s ease; }
.ss-card-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.ss-card-tag { font-family: 'Fraunces', serif; font-style: italic; font-size: 19px; transition: color 1.2s ease; }
.ss-card-sub { font-size: 13px; color: #8a8698; }
.ss-cue { font-size: 13px; color: #a5a2b5; margin-bottom: 14px; line-height: 1.5; }
.ss-lyric { display: flex; flex-direction: column; gap: 4px; }
.ss-lyric-line { font-family: 'Fraunces', serif; font-size: 16px; line-height: 1.5; color: #e8e4dc; }

/* editor */
.ss-editor { margin-top: 26px; width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 18px;
  padding: 22px; border-radius: 18px; border: 1px solid #262436; background: rgba(255,255,255,.015); }
.ss-ed-row { display: flex; gap: 14px; flex-wrap: wrap; }
.ss-field { display: flex; flex-direction: column; gap: 6px; flex: 1 1 180px; }
.ss-field > span { font-size: 11px; letter-spacing: .4px; text-transform: uppercase; color: #7a7790; }
.ss-grow { flex: 2 1 240px; }
.ss-ed-block { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px solid #242235; border-radius: 12px; }
.ss-ed-h { font-family: 'Fraunces', serif; font-style: italic; font-size: 17px; color: #d8d4e2; }
.ss-ed-h-lg { font-size: 20px; margin-top: 4px; }
.ss-prog { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.ss-prog-slot { display: flex; align-items: center; gap: 3px; }
.ss-prog-slot select { width: auto; min-width: 74px; }
.ss-hint { font-size: 12px; color: #77748a; line-height: 1.5; }
.ss-add-sm { background: transparent; border: 1px dashed #4a4763; color: #b0adc2; border-radius: 8px; padding: 8px 12px; font-size: 12px; }

.ss-sec-edit { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid #242235; border-radius: 12px; }
.ss-sec-top { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ss-sec-label { flex: 2 1 140px; font-weight: 600; }
.ss-sec-tag { flex: 1 1 90px; }
.ss-sec-move { display: flex; gap: 4px; margin-left: auto; }
.ss-x { width: 30px; height: 30px; border-radius: 7px; border: 1px solid #34324a; background: transparent; color: #b0adc2; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.ss-x:disabled { opacity: .3; cursor: not-allowed; }
.ss-toggles { display: flex; gap: 7px; flex-wrap: wrap; }
.ss-toggle { padding: 7px 13px; border-radius: 20px; border: 1px solid #34324a; background: transparent; color: #86839a; font-size: 12px; font-weight: 500; }
.ss-toggle.on { border-color: #e0a458; color: #f0c078; background: rgba(224,164,88,.12); }

.ss-add { align-self: flex-start; background: transparent; border: 1px dashed #4a4763; color: #c9c6d6; border-radius: 10px; padding: 11px 18px; font-size: 13px; font-weight: 600; }
.ss-io-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.ss-io { margin-top: 6px; display: flex; flex-direction: column; gap: 8px; }
.ss-io-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.ss-io-msg { font-size: 12px; color: #9a97ad; }

.ss-foot { margin-top: 28px; max-width: 460px; text-align: center; font-size: 12.5px; color: #77748a; line-height: 1.6; }

@media (max-width: 520px) {
  .ss-root { padding: 20px 14px 40px; }
  .ss-editor { padding: 16px; }
  .ss-ed-block, .ss-sec-edit { padding: 13px; }
  .ss-tl-label { font-size: 9px; }
  .ss-card { padding: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .ss-root *, .ss-shape { transition: none !important; }
}
`;
