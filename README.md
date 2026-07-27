# SongSketch

A customizable "hum over it" backing-track app. Edit sections, lyrics, chords,
tempo, and arrangement live. The app plays a chord loop that fills out from
sparse (trapped) to full (alive) so you can find melodies over it

You land on a home screen: start a new song, open the demo, or reopen anything
you've saved. Every song is kept in your browser (localStorage) and autosaves
as you type

## Sharing a song

Hit **Share** (on a song in the list, or while playing one) to get a link. The
whole song (chords, lyrics, cues, tempo, arrangement) is packed into the link
itself, so there's no server and no account. Whoever opens it gets their own
copy to edit, and changes they make don't touch yours

Links are long because they carry the song (the demo is ~1,200 characters). A
few chat apps cut long links, so paste somewhere that keeps them whole. If one
arrives broken, the home screen says so and you can paste the full link into
the "Open a shared link" box

## Run it locally

You need Node.js installed (https://nodejs.org - the LTS version is fine).

Open a terminal in this folder, then:

```bash
npm install      # downloads React, Tone.js, Vite (one time)
npm run dev      # starts a local server
```

It'll print a URL like http://localhost:5173, open that in your browser

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

- `src/App.jsx`: the shell (which screen you're on, autosave, share-link intake)
- `src/components/Home.jsx`: the home screen (song list, share, import)
- `src/components/Player.jsx`: the player and the live editor, including all the
  Tone.js audio setup
- `src/lib/chords.js`: the chord library. Add more by giving each a name,
  `notes` (for the pad), a `root` (for the bass), and an `arp` (for the picking)
- `src/lib/song.js`: `DEFAULT_SONG` (the demo), the blank starter, and the
  validation every incoming song passes through
- `src/lib/library.js`: saving/loading songs in localStorage
- `src/lib/share.js`: packing a song into a link and back out
- `src/styles.js`: all the visuals

## Notes

- The sounds are basic synths, they're for finding the *shape* and melody, not
  for a finished recording. Real voices and a real guitar are what make it indie
- Audio starts only after you tap Start (browsers require a tap before playing)
