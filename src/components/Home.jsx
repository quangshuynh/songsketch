import { useState } from "react";
import { summarize } from "../lib/song.js";
import ShareBox from "./ShareBox.jsx";

const when = (ts) => {
  if (!ts) return "not edited yet";
  const d = new Date(ts);
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return `edited ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (days === 1) return "edited yesterday";
  if (days < 7) return `edited ${days} days ago`;
  return `edited ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
};

export default function Home({
  songs, incoming, incomingBroken, onAcceptIncoming, onDismissIncoming,
  onNew, onDemo, onOpen, onRename, onDuplicate, onDelete, onImportText,
}) {
  const [sharingId, setSharingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [paste, setPaste] = useState("");
  const [pasteMsg, setPasteMsg] = useState(null);

  const startRename = (s) => { setRenamingId(s.id); setDraftTitle(s.title); setConfirmId(null); };
  const commitRename = (id) => {
    const t = draftTitle.trim();
    if (t) onRename(id, t);
    setRenamingId(null);
  };

  const importPaste = async () => {
    setPasteMsg(null);
    const res = await onImportText(paste);
    if (res?.ok) setPaste("");
    else setPasteMsg(res?.error || "Couldn't read that.");
  };

  return (
    <div className="ss-root" style={{ background: "radial-gradient(circle at 50% 24%, #16141f 0%, #0a0910 92%)" }}>
      <div className="ss-home">
      <header className="ss-home-head">
        <h1 className="ss-home-mark">SongSketch</h1>
        <p className="ss-home-sub">
          A backing track to hum over. Build a chord loop, write sections, and let the
          arrangement grow from sparse to full while you find the melody.
        </p>
      </header>

      {incoming && (
        <div className="ss-incoming">
          <div className="ss-row-meta">Someone shared a sketch with you</div>
          <div className="ss-row-title">{incoming.title}</div>
          <div className="ss-row-meta">{summarize(incoming)}</div>
          <div className="ss-row-btns">
            <button className="ss-mini on" onClick={onAcceptIncoming}>Save a copy & open</button>
            <button className="ss-mini" onClick={onDismissIncoming}>Not now</button>
          </div>
        </div>
      )}

      {incomingBroken && !incoming && (
        <div className="ss-incoming">
          <div className="ss-row-title">That shared link didn't open</div>
          <div className="ss-row-meta">
            It was probably cut short somewhere along the way, links carry the whole song, so they're long.
            Ask whoever sent it to paste the full link below.
          </div>
          <div className="ss-row-btns">
            <button className="ss-mini" onClick={onDismissIncoming}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="ss-actions">
        <button className="ss-bigcard" onClick={onNew}>
          <span className="ss-bigcard-t">Start a new song</span>
          <span className="ss-bigcard-d">
            A blank sketch with a verse and a chorus. Bring your own chords and words.
          </span>
        </button>
        <button className="ss-bigcard" onClick={onDemo}>
          <span className="ss-bigcard-t">Open the demo</span>
          <span className="ss-bigcard-d">
            A finished example, sad to uplifting. Play it, then edit it into your own.
          </span>
        </button>
      </div>

      <div>
        <div className="ss-sec-h">
          <h2>Your songs</h2>
          <span className="ss-count">{songs.length ? `${songs.length} saved` : "saved in this browser"}</span>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="ss-empty">
          Nothing saved yet. Start a new song or open the demo, everything you write is kept
          in this browser automatically.
        </div>
      ) : (
        <div className="ss-list">
          {songs.map((s) => (
            <div key={s.id}>
              <div className="ss-row">
                {renamingId === s.id ? (
                  <div className="ss-rename">
                    <input autoFocus value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(s.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }} aria-label="Song title" />
                    <button className="ss-mini on" onClick={() => commitRename(s.id)}>Save</button>
                    <button className="ss-mini" onClick={() => setRenamingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <button className="ss-row-main" onClick={() => onOpen(s.id)}>
                      <span className="ss-row-titleline">
                        <span className="ss-row-title">{s.title}</span>
                        {s.demo && <span className="ss-badge">demo song</span>}
                      </span>
                      <span className="ss-row-meta">{summarize(s)} · {when(s.updatedAt)}</span>
                    </button>
                    <div className="ss-row-btns">
                      <button className="ss-mini on" onClick={() => onOpen(s.id)}>Open</button>
                      <button className={"ss-mini" + (sharingId === s.id ? " on" : "")}
                        onClick={() => { setSharingId(sharingId === s.id ? null : s.id); setConfirmId(null); }}>
                        Share
                      </button>
                      <button className="ss-mini" onClick={() => startRename(s)}>Rename</button>
                      <button className="ss-mini" onClick={() => onDuplicate(s.id)}>Duplicate</button>
                      {confirmId === s.id ? (
                        <>
                          <button className="ss-mini danger" onClick={() => { onDelete(s.id); setConfirmId(null); }}>
                            Delete for good
                          </button>
                          <button className="ss-mini" onClick={() => setConfirmId(null)}>Keep</button>
                        </>
                      ) : (
                        <button className="ss-mini danger" onClick={() => setConfirmId(s.id)}>Delete</button>
                      )}
                    </div>
                  </>
                )}
              </div>
              {sharingId === s.id && <ShareBox song={s} onClose={() => setSharingId(null)} />}
            </div>
          ))}
        </div>
      )}

      <div className="ss-panel">
        <div className="ss-panel-h">Open a shared link</div>
        <div className="ss-hint">
          Paste a SongSketch link someone sent you (or a config you exported) to add it to your songs.
        </div>
        <textarea rows={3} value={paste} placeholder="https://…/songsketch/#s=…"
          onChange={(e) => { setPaste(e.target.value); setPasteMsg(null); }} aria-label="Shared link or config" />
        <div className="ss-io-row">
          <button className="ss-mini on" onClick={importPaste} disabled={!paste.trim()}>Load it</button>
          {pasteMsg && <span className="ss-msg bad">{pasteMsg}</span>}
        </div>
      </div>

      <footer className="ss-foot" style={{ marginTop: 0 }}>
        Everything is saved in this browser only: no account, no server. Share links carry the
        song itself, so they keep working even if you clear your browser.
      </footer>
      </div>
    </div>
  );
}
