import { useEffect, useRef, useState } from "react";
import { encodeSong, shareUrl } from "../lib/share.js";

/**
 * Builds a link that carries the whole song (chords, lyrics, cues, arrangement)
 * in its hash. Regenerates as the song is edited, so the link is never stale.
 */
export default function ShareBox({ song, onClose }) {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    encodeSong(song)
      .then((payload) => { if (alive) setUrl(shareUrl(payload)); })
      .catch(() => { if (alive) setMsg("Couldn't build a link in this browser."); });
    return () => { alive = false; };
  }, [song]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Copied ✓");
    } catch {
      inputRef.current?.select();
      setMsg("Press Ctrl/⌘+C to copy.");
    }
  };

  return (
    <div className="ss-share">
      <div className="ss-ed-h">Share this sketch</div>
      <div className="ss-hint">
        The link contains the whole song: chords, lyrics, cues, arrangement. Anyone who opens it
        gets their own copy to play with. Nothing is uploaded anywhere.
      </div>
      <div className="ss-share-url">
        <input ref={inputRef} readOnly value={url || "Building link…"}
          onFocus={(e) => e.target.select()} aria-label="Share link" />
        <button className="ss-mini" onClick={copy} disabled={!url}>Copy</button>
        {onClose && <button className="ss-mini" onClick={onClose}>Close</button>}
      </div>
      {msg && <div className="ss-msg">{msg}</div>}
      {url.length > 2000 && (
        <div className="ss-hint">
          Heads up: this link is long ({url.length.toLocaleString()} characters). Most apps handle it,
          but a few chat apps cut long links, paste it somewhere that keeps it whole.
        </div>
      )}
    </div>
  );
}
