export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
.ss-root * { box-sizing: border-box; }
.ss-root {
  min-height: 100vh; width: 100%; padding: 26px 18px 44px;
  font-family: 'Inter', sans-serif; color: #e8e4dc;
  display: flex; flex-direction: column; align-items: center;
  transition: background 1.4s ease; text-align: left;
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

/* ---- top bar (player) ---- */
.ss-topbar { width: 100%; max-width: 620px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.ss-back { background: transparent; border: 1px solid #34324a; color: #b0adc2; border-radius: 20px; padding: 7px 14px; font-size: 12.5px; font-weight: 500; }
.ss-back:hover { border-color: #56537a; color: #e8e4dc; }
.ss-topbar-sp { margin-left: auto; }
.ss-saved { font-size: 11px; letter-spacing: .4px; text-transform: uppercase; color: #5f5d75; }

/* ---- home ---- */
.ss-home { width: 100%; max-width: 620px; display: flex; flex-direction: column; gap: 26px; }
.ss-home-head { text-align: center; margin-top: 8px; }
.ss-home-mark { font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: clamp(34px,9vw,54px); margin: 0 0 10px; color: #f2ede4; }
.ss-home-sub { font-size: 14px; color: #8a8698; line-height: 1.6; max-width: 420px; margin: 0 auto; }

.ss-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ss-bigcard { text-align: left; padding: 20px; border-radius: 16px; border: 1px solid #2b2940; background: rgba(255,255,255,.02); display: flex; flex-direction: column; gap: 7px; color: #e8e4dc; }
.ss-bigcard:hover { border-color: #f0b862; background: rgba(240,184,98,.06); transform: translateY(-2px); }
.ss-bigcard-t { font-family: 'Fraunces', serif; font-style: italic; font-size: 19px; }
.ss-bigcard-d { font-size: 12.5px; color: #8a8698; line-height: 1.5; }

.ss-sec-h { display: flex; align-items: baseline; gap: 10px; margin-bottom: -10px; }
.ss-sec-h h2 { font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: 21px; margin: 0; color: #ded9e6; letter-spacing: 0; }
.ss-count { font-size: 12px; color: #6f6c82; }

.ss-list { display: flex; flex-direction: column; gap: 10px; }
.ss-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; border: 1px solid #262436; background: rgba(255,255,255,.015); flex-wrap: wrap; }
.ss-row:hover { border-color: #3a3752; }
.ss-row-main { flex: 1 1 200px; min-width: 0; text-align: left; background: transparent; border: 0; padding: 0; color: inherit; display: flex; flex-direction: column; gap: 5px; }
.ss-row-titleline { display: flex; align-items: center; gap: 9px; min-width: 0; }
.ss-row-title { font-family: 'Fraunces', serif; font-size: 17px; color: #ece8e0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ss-badge { flex: none; font-size: 9.5px; font-weight: 600; letter-spacing: 1.1px; text-transform: uppercase;
  color: #f0c078; border: 1px solid rgba(240,192,120,.45); background: rgba(224,164,88,.12); border-radius: 999px; padding: 3px 9px; }
.ss-row-main:hover .ss-row-title { color: #f0b862; }
.ss-row-meta { font-size: 11.5px; color: #6f6c82; letter-spacing: .2px; }
.ss-row-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.ss-mini { background: transparent; border: 1px solid #32304a; color: #a6a3ba; border-radius: 8px; padding: 7px 11px; font-size: 12px; font-weight: 500; }
.ss-mini:hover { border-color: #56537a; color: #e8e4dc; }
.ss-mini.on { border-color: #e0a458; color: #f0c078; background: rgba(224,164,88,.12); }
.ss-mini.danger:hover { border-color: #b4566a; color: #ff9fb0; }
.ss-rename { display: flex; gap: 8px; width: 100%; align-items: center; }

.ss-empty { padding: 26px 20px; border-radius: 14px; border: 1px dashed #2f2d44; text-align: center; font-size: 13px; color: #77748a; line-height: 1.6; }

.ss-panel { display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 16px; border: 1px solid #262436; background: rgba(255,255,255,.015); }
.ss-panel-h { font-family: 'Fraunces', serif; font-style: italic; font-size: 18px; color: #ded9e6; }
.ss-msg { font-size: 12.5px; color: #9a97ad; }
.ss-msg.bad { color: #ff9fb0; }
.ss-msg.good { color: #8fd6a8; }

/* ---- share ---- */
.ss-share { margin-top: 12px; width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 10px;
  padding: 18px; border-radius: 16px; border: 1px solid #3a3850; background: rgba(255,255,255,.02); }
.ss-share-url { display: flex; gap: 8px; flex-wrap: wrap; }
.ss-share-url input { flex: 1 1 220px; font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; }

/* ---- incoming shared link ---- */
.ss-incoming { padding: 20px; border-radius: 16px; border: 1px solid #e0a458; background: rgba(224,164,88,.07); display: flex; flex-direction: column; gap: 10px; }
.ss-incoming .ss-row-title { color: #f0c078; }

@media (max-width: 520px) {
  .ss-root { padding: 20px 14px 40px; }
  .ss-editor { padding: 16px; }
  .ss-ed-block, .ss-sec-edit { padding: 13px; }
  .ss-tl-label { font-size: 9px; }
  .ss-card { padding: 16px; }
  .ss-actions { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .ss-root *, .ss-shape { transition: none !important; }
}
`;
