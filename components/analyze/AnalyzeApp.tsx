'use client';
// Analyze: Organization and Product self-assessment paths (content and rules locked to the live page).
// Each path keeps its own ratings, current pillar, step and form fields (React state, and browser storage where
// available, as on the live page). One rating 1-10 per pillar, nothing preselected, Next disabled until rated,
// progress = round(index / pillars * 100), See result opens the details form; no score is shown on the page.
// This preview is not connected to the CNESS service: a valid submit opens a disclosure instead of sending.
// Every approved string carries data-k="<path in content/analyze.json>" for tools/verify-analyze.js.
import { appPath } from '@/lib/site';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ANALYZE, TRACKS, trackContent, trackFields, trackPillars, type Field, type Track } from '@/lib/content';
import { message, problems, type FormValues } from '@/lib/analyze/validation';
import RouteBand from './RouteBand';

type Phase = 'scoring' | 'form' | 'notice';
interface PathState { ratings: number[]; index: number; phase: Phase; form: FormValues; tried: boolean; invalid: string[]; err: { title: string; msg: string } | null }
const S = ANALYZE.scorer, V = ANALYZE.validation, N = ANALYZE.notice;
const blank = (t: Track): PathState => ({ ratings: trackPillars(t).map(() => 0), index: 0, phase: 'scoring', form: Object.fromEntries(trackFields(t).map(f => [f.key, ''])), tried: false, invalid: [], err: null });
const KEY = (t: Track) => `cness_analyze_preview_v1_${t}`;
const isStill = () => document.documentElement.classList.contains('still');
const smooth = (): ScrollBehavior => (isStill() ? 'auto' : 'smooth');
const pad = (i: number) => String(i).padStart(2, '0');
const Arr = () => <span className="arr" aria-hidden="true">→</span>;
const TAB_ICON: Record<Track, React.ReactNode> = {
  organization: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 21V5.5L12 3v18M12 8h8v13M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2M3 21h18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  product: <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
};

export default function AnalyzeApp() {
  const [cur, setCur] = useState<Track>('organization');
  const [st, setSt] = useState<Record<Track, PathState>>(() => ({ organization: blank('organization'), product: blank('product') }));
  const [dir, setDir] = useState(0);              // step transition direction for the pillar that just appeared
  const [picked, setPicked] = useState(false);    // the readout animates only when the visitor picks a value
  const [entering, setEntering] = useState<Track | null>(null);
  const [noticeIn, setNoticeIn] = useState(false);
  const clearEntering = useMemo(() => () => setEntering(null), []);
  const after = useRef<(() => void) | null>(null); // focus and scroll once React has committed the change
  const restored = useRef(false), dialogTrack = useRef<Track>('organization'), pvd = useRef<HTMLDialogElement>(null);
  const up = (t: Track, f: (s: PathState) => PathState) => setSt(p => ({ ...p, [t]: f(p[t]) }));
  // handlers read the latest state through refs, so they stay stable and memoised sections skip re-rendering
  const stRef = useRef(st); stRef.current = st;
  const curRef = useRef(cur); curRef.current = cur;
  useEffect(() => { const f = after.current; after.current = null; f?.(); });

  /* restore each path (as the live page does) and the path named in the address (#product) */
  useEffect(() => {
    const next = { organization: blank('organization'), product: blank('product') };
    for (const t of TRACKS) {
      try {
        const v = JSON.parse(localStorage.getItem(KEY(t)) || 'null');
        const n = next[t].ratings.length;
        if (v && v.v === 1 && Array.isArray(v.ratings) && v.ratings.length === n) {
          const ratings = (v.ratings as unknown[]).map(x => { const r = Math.round(Number(x)); return r >= 1 && r <= 10 ? r : 0; });
          const form = { ...next[t].form }; for (const k in form) if (typeof v.form?.[k] === 'string') form[k] = v.form[k];
          next[t] = { ...next[t], ratings, form, index: Math.max(0, Math.min(n - 1, Number(v.index) || 0)), phase: v.phase === 'form' && ratings.every(x => x > 0) ? 'form' : 'scoring' };
        }
      } catch { /* storage unavailable: start fresh */ }
    }
    setSt(next); restored.current = true;
    if (location.hash.slice(1) === 'product') setCur('product');
    const onHash = () => { const h = location.hash.slice(1); if (h === 'organization' || h === 'product') setCur(h); };
    addEventListener('hashchange', onHash); return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    const id = setTimeout(() => {
      for (const t of TRACKS) { const s = st[t];
        try { if (s.ratings.some(Boolean) || Object.values(s.form).some(Boolean)) localStorage.setItem(KEY(t), JSON.stringify({ v: 1, ratings: s.ratings, index: s.index, phase: s.phase === 'notice' ? 'form' : s.phase, form: s.form })); else localStorage.removeItem(KEY(t)); } catch { /* ignore */ } }
    }, 150);
    return () => clearTimeout(id);
  }, [st]);

  /* below desktop width the floating quick actions would cover ratings and fields: hide them while the card is on screen */
  useEffect(() => {
    const root = document.documentElement, on = new Set<Element>(), narrow = matchMedia('(max-width: 1199px)');
    const dock = () => root.classList.toggle('hide-quick', narrow.matches && on.size > 0);
    const io = new IntersectionObserver(es => { es.forEach(e => (e.isIntersecting ? on.add(e.target) : on.delete(e.target))); dock(); }, { rootMargin: '-15% 0px -15% 0px' });
    TRACKS.forEach(t => { const el = document.getElementById(`inst-${t}`); if (el) io.observe(el); });
    narrow.addEventListener('change', dock);
    return () => { io.disconnect(); narrow.removeEventListener('change', dock); root.classList.remove('hide-quick'); };
  }, []);

  /* the ring that marks the selected rating glides to it (position read from layout, set without a re-render) */
  useLayoutEffect(() => {
    const place = () => { for (const t of TRACKS) {
      const g = document.querySelector<HTMLElement>(`#panel-${t} .scale`), s = st[t], v = s.ratings[s.index] ?? 0;
      const b = g?.querySelector<HTMLElement>(`[data-v="${v}"]`), mark = g?.querySelector<HTMLElement>('.mark');
      if (!b || !mark) continue; mark.style.setProperty('--mw', `${b.offsetWidth}px`); mark.style.setProperty('--mx', `${b.offsetLeft}px`); mark.style.setProperty('--my', `${b.offsetTop}px`);
    } };
    place(); addEventListener('resize', place); return () => removeEventListener('resize', place);
  }, [st, cur]);

  /* ---------- actions ---------- */
  const keepInView = (t: Track) => { const el = document.getElementById(`inst-${t}`); if (!el) return; const r = el.getBoundingClientRect(); if (r.top < 83 || r.top > innerHeight * .5) el.scrollIntoView({ behavior: smooth(), block: 'start' }); };
  const focusPillar = (t: Track) => document.querySelector<HTMLElement>(`#panel-${t} .pillar:not([hidden]) h3`)?.focus({ preventScroll: true });
  const select = (t: Track, focus?: boolean) => {
    if (t !== curRef.current && !isStill()) setEntering(t);
    setCur(t);
    try { history.replaceState(null, '', `#${t}`); } catch { /* ignore */ }
    if (focus) after.current = () => document.getElementById(`tab-${t}`)?.focus();
  };
  const rate = (t: Track, v: number, focus?: boolean) => {
    up(t, s => ({ ...s, ratings: s.ratings.map((x, i) => (i === s.index ? v : x)) })); setPicked(true); setDir(0);
    if (focus) after.current = () => document.querySelector<HTMLElement>(`#panel-${t} .scale [data-v="${v}"]`)?.focus();
  };
  const onScaleKey = (t: Track, e: KeyboardEvent) => {
    const s = stRef.current[t], v = s.ratings[s.index] ?? 0; let nv: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nv = v ? Math.min(10, v + 1) : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nv = v ? Math.max(1, v - 1) : 1;
    if (e.key === 'Home') nv = 1; if (e.key === 'End') nv = 10;
    if (nv == null) return; e.preventDefault(); rate(t, nv, true);
  };
  const next = (t: Track) => {
    const s = stRef.current[t]; if (!s.ratings[s.index]) return;
    setPicked(false);
    if (s.index < s.ratings.length - 1) { up(t, x => ({ ...x, index: x.index + 1 })); setDir(1); after.current = () => { keepInView(t); focusPillar(t); }; return; }
    up(t, x => ({ ...x, phase: 'form' })); after.current = () => { keepInView(t); document.getElementById(`${t}-form-h`)?.focus({ preventScroll: true }); };
  };
  const back = (t: Track) => { if (stRef.current[t].index === 0) return; setPicked(false); up(t, x => ({ ...x, index: x.index - 1 })); setDir(-1); after.current = () => { keepInView(t); focusPillar(t); }; };
  const backFromForm = (t: Track) => { setPicked(false); up(t, x => ({ ...x, phase: 'scoring', index: x.ratings.length - 1 })); setDir(-1); after.current = () => { keepInView(t); focusPillar(t); }; };
  const change = (t: Track, key: string, value: string) => up(t, s => { const form = { ...s.form, [key]: value }; return { ...s, form, invalid: s.tried ? problems(t, form) : s.invalid }; });
  const submit = (t: Track, e: FormEvent) => {
    e.preventDefault(); const s = stRef.current[t], p = problems(t, s.form);
    if (p.length) {
      up(t, x => ({ ...x, tried: true, invalid: p, err: { title: V.title, msg: message(p, x.form) ?? V.all } }));
      const f = trackFields(t).find(x => x.key === p[0]);
      after.current = () => { const el = f && document.getElementById(`an-${f.id}`); if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: smooth(), block: 'center' }); };
      return;
    }
    if (!s.ratings.every(x => x > 0)) { up(t, x => ({ ...x, tried: true, invalid: [], err: { title: ANALYZE.finishFirst.title, msg: ANALYZE.finishFirst.description } })); return; }
    up(t, x => ({ ...x, tried: true, invalid: [], err: null }));
    dialogTrack.current = t; pvd.current?.showModal(); pvd.current?.querySelector<HTMLElement>('[data-show]')?.focus();
  };
  const showConfirmation = () => {
    const t = dialogTrack.current; pvd.current?.close(); up(t, x => ({ ...x, phase: 'notice' })); setNoticeIn(!isStill());
    after.current = () => { keepInView(t); document.getElementById(`${t}-notice-h`)?.focus({ preventScroll: true }); };
  };
  const analyzeAnother = (t: Track) => {
    up(t, () => blank(t)); try { localStorage.removeItem(KEY(t)); } catch { /* ignore */ }
    scrollTo({ top: 0, behavior: smooth() }); after.current = () => document.getElementById(`h1-${t}`)?.focus({ preventScroll: true });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actions: Actions = useMemo(() => ({ rate, scaleKey: onScaleKey, next, back, backFromForm, change, submit, again: analyzeAnother }), []);

  return (
    <>
      <p className="sr" id="an-status" aria-live="polite" />
      <main id="main">
        <div className="wrap an-tabs">
          <div className="paths" role="tablist" aria-label="Analyze" data-on={cur}>
            {TRACKS.map((t, i) => (
              <button key={t} type="button" role="tab" id={`tab-${t}`} aria-controls={`panel-${t}`} aria-selected={cur === t} tabIndex={cur === t ? 0 : -1} data-track={t}
                onClick={() => select(t)}
                onKeyDown={e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; const last = TRACKS.length - 1;
                  if (d) { e.preventDefault(); select(TRACKS[(i + d + TRACKS.length) % TRACKS.length]!, true); }
                  if (e.key === 'Home') { e.preventDefault(); select(TRACKS[0]!, true); } if (e.key === 'End') { e.preventDefault(); select(TRACKS[last]!, true); } }}>
                <span className="ti">{TAB_ICON[t]}</span><span className="tl" data-k={`tabs.${t}`}>{ANALYZE.tabs[t]}</span>
                <span className="mini" aria-hidden="true">{trackPillars(t).map((_, k) => <i key={k} />)}<i className="s" /></span>
              </button>
            ))}
            <span className="glide" aria-hidden="true" />
          </div>
        </div>
        {TRACKS.map(t => (
          <Panel key={t} t={t} s={st[t]} active={cur === t} entering={entering === t} onEntered={clearEntering} dir={cur === t ? dir : 0} picked={cur === t && picked} noticeIn={noticeIn} on={actions} />
        ))}
      </main>
      <dialog className="pvd" id="pvd" aria-labelledby="pvd-h" data-preview="" ref={pvd}
        onClose={() => { const t = dialogTrack.current; if (stRef.current[t].phase === 'form') document.querySelector<HTMLElement>(`#panel-${t} .details .submit`)?.focus(); }}>
        <div className="in">
          <h2 id="pvd-h">Preview only</h2>
          <p>This page is a design preview and is not connected to the CNESS service. Nothing was sent and no email will arrive.</p>
          <p>On cnessworks.com, this button sends your ratings and details to CNESS, and the score is emailed within 24 hours.</p>
          <div className="acts"><button type="button" className="btn ghost" data-close="" onClick={() => pvd.current?.close()}>Back to the form</button><button type="button" className="btn" data-show="" onClick={showConfirmation}>See the confirmation screen</button></div>
        </div>
      </dialog>
    </>
  );
}

interface Actions {
  rate: (t: Track, v: number, focus?: boolean) => void; scaleKey: (t: Track, e: KeyboardEvent) => void; next: (t: Track) => void; back: (t: Track) => void;
  backFromForm: (t: Track) => void; change: (t: Track, k: string, v: string) => void; submit: (t: Track, e: FormEvent) => void; again: (t: Track) => void;
}
interface PanelProps { t: Track; s: PathState; active: boolean; entering: boolean; onEntered: () => void; dir: number; picked: boolean; noticeIn: boolean; on: Actions }

const Panel = memo(function Panel({ t, s, active, entering, onEntered, dir, picked, noticeIn, on }: PanelProps) {
  const T = trackContent(t), P = `tracks.${t}`, pillars = trackPillars(t), n = pillars.length;
  const scoring = s.phase === 'scoring', v = s.ratings[s.index] ?? 0, pct = Math.round(s.index / n * 100);
  const name = (t === 'product' ? (s.form.product_name || s.form.org_name) : s.form.org_name)?.trim() ?? '';
  return (
    <section className={entering ? 'panel entering' : 'panel'} role="tabpanel" id={`panel-${t}`} aria-labelledby={`tab-${t}`} data-track={t} data-n={n} hidden={!active}
      onAnimationEnd={e => { if (e.target === e.currentTarget) onEntered(); }}>
      <div className="wrap an-head">
        <h1 id={`h1-${t}`} tabIndex={-1} data-k={`${P}.heroTitle`}>{T.heroTitle}</h1>
        <p className="lede" data-k={`${P}.heroSubtitle`}>{T.heroSubtitle}</p>
      </div>
      <div className="wrap">
        <div className="inst" id={`inst-${t}`} data-phase={s.phase}>
          <RouteBand track={t} rated={s.ratings.map(x => (x > 0 ? '1' : '0')).join('')} at={scoring ? s.index : n} phase={s.phase} active={active} />
          <div className="inst-head" hidden={!scoring}>
            <div className="who"><p className="k2" data-k={`${P}.trackLabel`}>{T.trackLabel}</p><h2 className="subj"><span className="fb" data-k={`${P}.subjectFallback`} hidden={!!name}>{T.subjectFallback}</span><span className="nm" hidden={!name}>{name}</span></h2></div>
            <div className="prog"><p className="pt">Pillar <span className="pn">{s.index + 1}</span> of {n}</p><p className="pc"><span className="pv">{pct}</span>% completed</p><span className="pbar" aria-hidden="true"><i style={{ transform: `scaleX(${pct / 100})` }} /></span></div>
          </div>
          <div className="work">
            <Steps t={t} index={s.index} dir={dir} hidden={!scoring} />
            <aside className="rate" aria-label={T.rateLabel} hidden={!scoring}>
              <p className="rh" data-k={`${P}.rateLabel`}>{T.rateLabel}</p>
              <div className="readout"><p className="k3" data-k="scorer.yourRating">{S.yourRating}</p><p className="big"><span key={`${s.index}-${v}`} className={picked && v ? 'val pop' : 'val'} data-k="scorer.none">{v || S.none}</span><span className="of">/<span data-k="scorer.outOf">{S.outOf}</span></span></p></div>
              <div className={v ? 'scale has' : 'scale'} role="radiogroup" aria-label={S.ratingGroup.replace('{name}', pillars[s.index]?.name ?? '')} onKeyDown={e => on.scaleKey(t, e)}>
                {Array.from({ length: 10 }, (_, k) => k + 1).map(x => (
                  <button key={x} type="button" role="radio" aria-checked={x === v} tabIndex={(v ? x === v : x === 1) ? 0 : -1} data-v={x} onClick={() => on.rate(t, x)}>{x}</button>
                ))}
                <span className="mark" aria-hidden="true" />
              </div>
              <div className="ends"><span data-k="scorer.scaleLow">{S.scaleLow}</span><span data-k="scorer.scaleHigh">{S.scaleHigh}</span></div>
              <div className="acts">
                <button type="button" className="btn ghost back" hidden={s.index === 0} onClick={() => on.back(t)}><span className="arr" aria-hidden="true">←</span> <span data-k="scorer.back">{S.back}</span></button>
                <button type="button" className="btn next" disabled={!v} onClick={() => on.next(t)}><span className="nl" data-k="scorer.next">{s.index === n - 1 ? S.finish : S.next}</span> <Arr /></button>
              </div>
            </aside>
            <DetailsForm t={t} hidden={s.phase !== 'form'} form={s.form} tried={s.tried} invalid={s.invalid} err={s.err} on={on} />
            <section className={noticeIn ? 'notice in' : 'notice'} hidden={s.phase !== 'notice'} aria-labelledby={`${t}-notice-h`}>
              <p className="pv-tag" data-preview="">Preview: not submitted. This copy of the page is not connected to CNESS, so nothing was sent.</p>
              <span className="tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <p className="k2" data-k="notice.kicker">{N.kicker}</p>
              <h2 id={`${t}-notice-h`} tabIndex={-1} data-k="notice.h2">{N.h2}</h2>
              <p className="lede" data-k="notice.p">{N.p}</p>
              <div className="facts"><div><p className="k3" data-k="notice.sentTo">{N.sentTo}</p><p className="mail">{s.phase === 'notice' ? (s.form.email ?? '').trim() : ''}</p></div><div><p className="k3" data-k="notice.when">{N.when}</p><p data-k="notice.whenBody">{N.whenBody}</p></div></div>
              <p data-k="notice.next">{N.next}</p>
              <div className="acts"><button type="button" className="btn ghost again" data-k="notice.another" onClick={() => on.again(t)}>{N.another}</button><a className="btn" href={appPath(N.explore[t]) ?? N.explore[t]} data-prod-href={N.explore[t]} {...(appPath(N.explore[t]) ? {} : { target: '_blank', rel: 'noopener' })} data-k="notice.explore.text">{N.explore.text} <Arr /></a></div>
            </section>
          </div>
        </div>
      </div>
      <InfoSections t={t} />
    </section>
  );
});

/* The pillar texts re-render only when the step changes, not when a rating is picked. */
const Steps = memo(function Steps({ t, index, dir, hidden }: { t: Track; index: number; dir: number; hidden: boolean }) {
  const P = `tracks.${t}`, pillars = trackPillars(t);
  return (
    <div className="steps" hidden={hidden}>
      {pillars.map((p, j) => (
        <article key={j} className={`pillar${j === index && dir ? (dir > 0 ? ' in-f' : ' in-b') : ''}`} id={`${t}-p${j + 1}`} data-i={j} aria-labelledby={`${t}-p${j + 1}-h`} hidden={j !== index}>
          <h3 id={`${t}-p${j + 1}-h`} tabIndex={-1}>Pillar {j + 1} — <span data-k={`${P}.pillars.${j}.name`}>{p.name}</span></h3>
          <p className="sum" data-k={`${P}.pillars.${j}.summary`}>{p.summary}</p>
          <div className="desc">{p.paragraphs.map((x, m) => <p key={m} data-k={`${P}.pillars.${j}.paragraphs.${m}`}>{x}</p>)}</div>
        </article>
      ))}
    </div>
  );
});

/* The details form re-renders only when its own fields, errors or visibility change (two 250-option country lists live here). */
const DetailsForm = memo(function DetailsForm({ t, hidden, form, tried, invalid, err, on }: { t: Track; hidden: boolean; form: FormValues; tried: boolean; invalid: string[]; err: PathState['err']; on: Actions }) {
  const F = trackContent(t).form, P = `tracks.${t}`, note = 'note' in F ? (F as { note: string }).note : null;
  return (
    <form className="details" noValidate hidden={hidden} aria-labelledby={`${t}-form-h`} onSubmit={e => on.submit(t, e)}>
      <div className="fh"><h2 id={`${t}-form-h`} tabIndex={-1} data-k={`${P}.form.heading`}>{F.heading}</h2><p className="lede" data-k={`${P}.form.intro`}>{F.intro}</p>{note && <p className="note" data-k={`${P}.form.note`}>{note}</p>}</div>
      <div className="grid">{trackFields(t).map((f, j) => <FieldRow key={f.key} t={t} f={f} j={j} value={form[f.key] ?? ''} invalid={tried ? invalid.includes(f.key) : undefined} onChange={x => on.change(t, f.key, x)} />)}</div>
      <div className="err" role="alert" hidden={!err}>{err && <><b>{err.title}</b> <span>{err.msg}</span></>}</div>
      <div className="acts"><button type="button" className="btn ghost back-form" onClick={() => on.backFromForm(t)}><span className="arr" aria-hidden="true">←</span> {S.back}</button><button type="submit" className="btn submit" data-busy={F.busy}><span data-k={`${P}.form.submit`}>{F.submit}</span> <Arr /></button></div>
    </form>
  );
});

/* Supporting information: static for each path, rendered once. */
const InfoSections = memo(function InfoSections({ t }: { t: Track }) {
  const T = trackContent(t), P = `tracks.${t}`, el = T.eligibility, cv = T.coverage, intro = 'intro' in el ? (el as { intro: string }).intro : null;
  return (
  <div className="wrap info">
      <section className="elig" aria-labelledby={`${t}-elig-h`}>
        <h2 id={`${t}-elig-h`} data-k={`${P}.eligibility.heading`}>{el.heading}</h2>
        {intro && <p className="lede" data-k={`${P}.eligibility.intro`}>{intro}</p>}
        <div className="tblw" role="region" aria-labelledby={`${t}-elig-h`} tabIndex={0}>
          <table><thead><tr><th scope="col" className="ok" data-k={`${P}.eligibility.eligibleHeader`}>{el.eligibleHeader}</th><th scope="col" className="no" data-k={`${P}.eligibility.ineligibleHeader`}>{el.ineligibleHeader}</th></tr></thead>
            <tbody>{el.rows.map((r, k) => <tr key={k}><td data-k={`${P}.eligibility.rows.${k}.0`}>{r[0]}</td><td data-k={`${P}.eligibility.rows.${k}.1`}>{r[1]}</td></tr>)}</tbody></table>
        </div>
        <p className="low" data-k={`${P}.eligibility.lowScoreNote`}>{el.lowScoreNote}</p>
      </section>
      <div className="cov-row">
        <section className="cover" aria-labelledby={`${t}-cov-h`}>
          <h2 id={`${t}-cov-h`} data-k={`${P}.coverage.heading`}>{cv.heading}</h2>
          <div className="tblw" role="region" aria-labelledby={`${t}-cov-h`} tabIndex={0}>
            <table><thead><tr><th scope="col" data-k={`${P}.coverage.pillarHeader`}>{cv.pillarHeader}</th><th scope="col" data-k={`${P}.coverage.focusHeader`}>{cv.focusHeader}</th></tr></thead>
              <tbody>{cv.rows.map((r, k) => <tr key={k}><th scope="row"><span className="no" aria-hidden="true">{pad(k + 1)}</span><span data-k={`${P}.coverage.rows.${k}.0`}>{r[0]}</span></th><td data-k={`${P}.coverage.rows.${k}.1`}>{r[1]}</td></tr>)}</tbody></table>
          </div>
        </section>
        <div className="side">
          <section className="card" aria-labelledby={`${t}-exp-h`}><h2 id={`${t}-exp-h`} data-k={`${P}.expect.heading`}>{T.expect.heading}</h2>{T.expect.body.map((x, m) => <p key={m} data-k={`${P}.expect.body.${m}`}>{x}</p>)}</section>
          <section className="card" aria-labelledby={`${t}-cert-h`}><h2 id={`${t}-cert-h`} data-k={`${P}.certification.heading`}>{T.certification.heading}</h2><p data-k={`${P}.certification.body`}>{T.certification.body}</p></section>
        </div>
      </div>
    </div>
  );
});

function FieldRow({ t, f, j, value, invalid, onChange }: { t: Track; f: Field; j: number; value: string; invalid: boolean | undefined; onChange: (v: string) => void }) {
  const P = `tracks.${t}.form.fields.${j}`, id = `an-${f.id}`, base = f.label.replace(/\s*\*\s*$/, '');
  const common = { id, name: f.key, 'data-key': f.key, 'aria-required': f.required ? true : undefined, 'aria-invalid': invalid, value, onChange: (e: { target: { value: string } }) => onChange(e.target.value) };
  const ph = f.placeholder ? { placeholder: f.placeholder, 'data-kp': `${P}.placeholder` } : {};
  let control: React.ReactNode;
  if (f.type === 'textarea') control = <textarea {...common} rows={4} {...ph} />;
  else if (f.type === 'select') {
    const opts = (f.options === 'countries' ? ANALYZE.countries : ANALYZE.categories) as string[];
    control = <select {...common}><option value="" data-k={`${P}.empty`}>{f.empty}</option>{opts.map((o, k) => <option key={o} value={o} data-k={`${f.options}.${k}`}>{o}</option>)}</select>;
  } else {
    const extra = f.type === 'email' ? { autoComplete: 'email', inputMode: 'email' as const } : f.key === 'org_name' ? { autoComplete: 'organization' } : f.key === 'website' ? { inputMode: 'url' as const, autoComplete: 'url' } : {};
    control = <input type={f.type === 'email' ? 'email' : 'text'} {...common} {...ph} {...extra} />;
  }
  const cls = `fld${f.type === 'select' ? ' half' : ''}${f.type === 'textarea' ? ' wide' : ''}`;
  return (
    <div className={cls}>
      <label htmlFor={id}>{f.required
        ? <span data-k={`${P}.label`} data-label-base={base}>{base} <span className="req" aria-hidden="true">*</span></span>
        : <span data-k={`${P}.label`}>{f.label}</span>}</label>
      {control}
    </div>
  );
}
