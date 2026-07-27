import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { CHORDS, CHORD_NAMES, blankSection, normalizeSong, uid } from "../lib/song.js";
import ShareBox from "./ShareBox.jsx";

// ---- color helpers ---------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) =>
  `rgb(${Math.round(lerp(c1[0], c2[0], t))}, ${Math.round(lerp(c1[1], c2[1], t))}, ${Math.round(lerp(c1[2], c2[2], t))})`;
const COLD = [91, 107, 140];
const WARM = [240, 184, 98];
const BG_COLD = [17, 16, 26];
const BG_WARM = [34, 24, 21];

export default function Player({ song, onChange, onBack }) {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [bar, setBar] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [io, setIo] = useState({ open: false, text: "", msg: "" });

  const songRef = useRef(song);
  const barRef = useRef(0);
  const inst = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => { songRef.current = song; }, [song]);
  useEffect(() => { if (ready) Tone.Transport.bpm.rampTo(song.bpm, 0.1); }, [song.bpm, ready]);

  const plen = Math.max(song.progression.length, 1);
  const secIdx = Math.min(Math.floor(bar / plen), song.sections.length - 1);
  const sec = song.sections[secIdx] || song.sections[0];
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

  // Tear the audio graph down when leaving this song.
  useEffect(() => () => {
    try {
      Tone.Transport.stop(); Tone.Transport.cancel(); Tone.Transport.position = 0;
      if (loopRef.current) loopRef.current.dispose();
      if (inst.current) Object.values(inst.current).forEach((n) => n && n.dispose && n.dispose());
    } catch { /* nothing to clean up */ }
  }, []);

  // ---- editing helpers -----------------------------------------------------
  const patch = (p) => onChange({ ...song, ...p });
  const patchSection = (id, p) =>
    onChange({ ...song, sections: song.sections.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const moveSection = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= song.sections.length) return;
    const arr = [...song.sections];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange({ ...song, sections: arr });
  };
  const removeSection = (id) => {
    if (song.sections.length <= 1) return;
    onChange({ ...song, sections: song.sections.filter((x) => x.id !== id) });
  };
  const addSection = () => onChange({ ...song, sections: [...song.sections, blankSection()] });

  const setChord = (i, name) => {
    const p = [...song.progression]; p[i] = name;
    onChange({ ...song, progression: p });
  };
  const addChord = () => onChange({ ...song, progression: [...song.progression, "C"] });
  const removeChord = (i) => {
    if (song.progression.length <= 1) return;
    onChange({ ...song, progression: song.progression.filter((_, k) => k !== i) });
  };

  const openExport = () => setIo({ open: true, text: JSON.stringify(song, null, 2), msg: "" });
  const loadJSON = () => {
    let parsed = null;
    try { parsed = normalizeSong(JSON.parse(io.text)); } catch { /* handled below */ }
    if (!parsed) return setIo((s) => ({ ...s, msg: "Couldn't read that. Check the JSON." }));
    onChange({ ...parsed, sections: parsed.sections.map((x) => ({ ...x, id: x.id || uid() })) });
    barRef.current = 0; setBar(0);
    setIo((s) => ({ ...s, msg: "Loaded ✓" }));
  };

  return (
    <div className="ss-root" style={{ background: `radial-gradient(circle at 50% 32%, ${bg} 0%, #0a0910 92%)` }}>
      <div className="ss-topbar">
        <button className="ss-back" onClick={onBack}>← Your songs</button>
        <span className="ss-topbar-sp" />
        <span className="ss-saved">saved automatically</span>
      </div>

      <header className="ss-head">
        <div className="ss-kicker">song sketch · {song.progression.join(" ")} · {song.bpm} bpm</div>
        <h1 className="ss-title">{song.title || "Untitled"}</h1>
        <div className="ss-sub">a scratch track to hum over, the skeleton, not the finished song</div>
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
        <button className="ss-btn ss-btn-ghost" onClick={() => setSharing((v) => !v)}>
          {sharing ? "Hide link" : "↗ Share"}
        </button>
      </div>

      {sharing && <ShareBox song={song} onClose={() => setSharing(false)} />}

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
                <span>Intensity · {Math.round(s.warmth * 100)}% (cold/trapped to warm/alive)</span>
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
            <div className="ss-ed-h">Back up this song</div>
            <div className="ss-io-btns">
              <button className="ss-btn ss-btn-ghost" onClick={() => setSharing(true)}>Get share link</button>
              <button className="ss-btn ss-btn-ghost" onClick={openExport}>Export config</button>
              <button className="ss-btn ss-btn-ghost" onClick={() => setIo({ open: true, text: "", msg: "Paste a config, then Load." })}>Import into this song</button>
            </div>
            {io.open && (
              <div className="ss-io">
                <textarea rows={6} value={io.text} onChange={(e) => setIo((s) => ({ ...s, text: e.target.value }))}
                  placeholder="Your song config (JSON) appears here. Copy it to keep, or paste one in and Load." />
                <div className="ss-io-row">
                  <button className="ss-btn ss-btn-ghost" onClick={loadJSON}>Load this config</button>
                  {io.msg && <span className="ss-io-msg">{io.msg}</span>}
                </div>
              </div>
            )}
            <div className="ss-hint">Importing replaces what's in this song. To keep both, go back and duplicate it first.</div>
          </div>
        </div>
      )}

      <footer className="ss-foot">
        Loops forever for practice. Hum nonsense over it first, real words later. The tones are basic
        synths, so judge the <em>shape</em> (sparse to full), not the texture. Your actual voices and a real
        guitar are what make it indie.
      </footer>
    </div>
  );
}
