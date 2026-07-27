import { useCallback, useEffect, useRef, useState } from "react";
import { CSS } from "./styles.js";
import Home from "./components/Home.jsx";
import Player from "./components/Player.jsx";
import { listSongs, getSong, addSong, updateSong, deleteSong, duplicateSong, findDemo } from "./lib/library.js";
import { DEMO_SONG, starterSong, copyOf, normalizeSong } from "./lib/song.js";
import { readShareHash, clearShareHash, decodeSong, payloadFromText } from "./lib/share.js";

const justTheSong = ({ title, bpm, progression, sections }) => ({ title, bpm, progression, sections });

export default function App() {
  const [songs, setSongs] = useState(listSongs);
  const [current, setCurrent] = useState(null); // { id, song } while a song is open
  const [incoming, setIncoming] = useState(null);
  const [incomingBroken, setIncomingBroken] = useState(false);

  const pending = useRef(null);  // edits not yet written to storage
  const opened = useRef(null);   // the song object as loaded, to skip a pointless first save

  const flush = useCallback(() => {
    if (!pending.current) return;
    updateSong(pending.current.id, pending.current.song);
    pending.current = null;
  }, []);

  // Autosave, coalesced so typing lyrics doesn't rewrite storage on every key.
  useEffect(() => {
    if (!current || current.song === opened.current) return;
    pending.current = current;
    const t = setTimeout(flush, 400);
    return () => clearTimeout(t);
  }, [current, flush]);

  // Don't lose the last few keystrokes if the tab is closed or backgrounded.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  // Did we arrive on a shared link?
  useEffect(() => {
    const payload = readShareHash();
    if (!payload) return;
    let alive = true;
    decodeSong(payload).then((song) => {
      if (!alive) return;
      if (song) setIncoming(song);
      else setIncomingBroken(true);
    });
    return () => { alive = false; };
  }, []);

  const open = (id) => {
    const row = getSong(id);
    if (!row) return setSongs(listSongs());
    const song = justTheSong(row);
    opened.current = song;
    setCurrent({ id, song });
  };

  const openNew = (song, extra) => {
    const row = addSong(song, extra);
    setSongs(listSongs());
    open(row.id);
  };

  const goHome = () => {
    flush();
    setCurrent(null);
    setSongs(listSongs());
  };

  const handleChange = (song) => setCurrent((c) => (c ? { ...c, song } : c));

  const rename = (id, title) => {
    const row = getSong(id);
    if (!row) return;
    updateSong(id, { ...justTheSong(row), title });
    setSongs(listSongs());
  };

  const remove = (id) => { deleteSong(id); setSongs(listSongs()); };
  const duplicate = (id) => { duplicateSong(id); setSongs(listSongs()); };

  /** Reopen the one saved demo rather than piling up a new copy each time. */
  const openDemo = () => {
    const existing = findDemo();
    if (existing) return open(existing.id);
    openNew(copyOf(DEMO_SONG), { demo: true });
  };

  const acceptIncoming = () => {
    const song = incoming;
    setIncoming(null);
    clearShareHash();
    openNew(song);
  };

  const dismissIncoming = () => {
    setIncoming(null);
    setIncomingBroken(false);
    clearShareHash();
  };

  /** Paste box on the home screen: a share link, or an exported JSON config. */
  const importText = async (text) => {
    const payload = payloadFromText(text);
    if (payload) {
      const song = await decodeSong(payload);
      if (!song) return { ok: false, error: "That link looks damaged or was cut short. Ask for it again?" };
      openNew(song);
      return { ok: true };
    }
    try {
      const song = normalizeSong(JSON.parse(text));
      if (song) { openNew(song); return { ok: true }; }
    } catch { /* not JSON either */ }
    return { ok: false, error: "That isn't a SongSketch link or config." };
  };

  return (
    <>
      <style>{CSS}</style>
      {current ? (
        <Player key={current.id} song={current.song} onChange={handleChange} onBack={goHome} />
      ) : (
        <Home
          songs={songs}
          incoming={incoming}
          incomingBroken={incomingBroken}
          onAcceptIncoming={acceptIncoming}
          onDismissIncoming={dismissIncoming}
          onNew={() => openNew(starterSong())}
          onDemo={openDemo}
          onOpen={open}
          onRename={rename}
          onDuplicate={duplicate}
          onDelete={remove}
          onImportText={importText}
        />
      )}
    </>
  );
}
