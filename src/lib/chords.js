// Chord library: notes for the pad, a root for the bass, and an arp for picking.
export const CHORDS = {
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

export const CHORD_NAMES = Object.keys(CHORDS);
