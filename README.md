# SongSketch

A customizable "hum over it" backing-track app. Edit sections, lyrics, chords,
tempo, and arrangement live. The app plays a chord loop that fills out from
sparse (trapped) to full (alive) so you can find melodies over it

Your edits save automatically to your browser (localStorage), so they'll still
be there when you come back

## Run it locally

You need Node.js installed (https://nodejs.org — the LTS version is fine).

Open a terminal in this folder, then:

```bash
npm install      # downloads React, Tone.js, Vite (one time)
npm run dev      # starts a local server
```

It'll print a URL like http://localhost:5173 — open that in your browser

## Put it online (free)

```bash
npm run build    # creates a "dist" folder
```

Then either:

- **Netlify** (easiest): go to app.netlify.com, drag the `dist` folder onto the
  page. You get a live URL instantly
- **Vercel**: push this folder to a GitHub repo, then import it at vercel.com
  It builds and deploys on every push

## Where to edit

Everything lives in `src/App.jsx`. Notable spots:

- `DEFAULT_SONG`: the starting song (title, tempo, chords, sections).
- `CHORDS`: the chord library. Add more by giving each a name, `notes`
  (for the pad), a `root` (for the bass), and an `arp` (for the picking)
- The `<style>` block near the bottom (`CSS`) controls all the visuals

## Notes

- The sounds are basic synths, they're for finding the *shape* and melody, not
  for a finished recording. Real voices and a real guitar are what make it indie
- Audio starts only after you tap Start (browsers require a tap before playing)
