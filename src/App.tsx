import { ConeCrazyPanel } from './components/ConeCrazyPanel';
import {
  CONE_RESET_ACTION,
  coneCrazyResetPlan,
  inspectConeCrazySave,
  verifyConeCrazyGameData,
  ConeError,
  type ConeProfile,
} from './core/coneCrazy';
import { useEffect, useMemo, useRef, useState } from 'react';
import { text, vehicles, type Locale } from './core/catalogs';
import {
  currentValue,
  exportRetailSave,
  inspectSave,
  parseRetailSave,
  readField,
  RETAIL_SIZE,
  validateChanges,
} from './core/retail';
import type {
  Changes,
  Field,
  RetailDocument,
  Section,
  Value,
} from './core/types';
import {
  copy,
  diagnostic,
  translate,
  coneText,
  coneErrorText,
  type CopyKey,
} from './i18n';
import { displayValue, FieldEditor } from './components/FieldEditor';
const sections: Section[] = [
  'player',
  'weapons',
  'world',
  'garages',
  'gangs',
  'spawns',
  'stats',
  'progress',
];
const numbers = ['01', '02', '03', '04', '05', '06', '07', '08'];
function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem('workshop-language');
    if (stored === 'pt' || stored === 'en') return stored;
  } catch {
    /* Storage may be unavailable. */
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
function download(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export default function App() {
  const [lang, setLang] = useState<Locale>(initialLocale);
  const t = (k: CopyKey) => translate(k, lang);
  const ct = (key: keyof typeof coneText) =>
    coneText[key][lang === 'pt' ? 1 : 0];
  const [profile, setProfile] = useState<ConeProfile>();
  const [gameBusy, setGameBusy] = useState(false),
    [gameError, setGameError] = useState<string>();
  const gameSequence = useRef(0);
  const [doc, setDoc] = useState<RetailDocument>();
  const [filename, setFilename] = useState('GTAVCsf1.b');
  const [history, setHistory] = useState<Changes[]>([{}]),
    [cursor, setCursor] = useState(0);
  const changes = history[cursor];
  const [section, setSection] = useState<Section | 'review'>('player'),
    [search, setSearch] = useState(''),
    [record, setRecord] = useState('');
  const [error, setError] = useState<string[]>([]),
    [pending, setPending] = useState<File>(),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState('');
  const fileInput = useRef<HTMLInputElement>(null),
    loadSequence = useRef(0);
  const errors = useMemo(
    () => (doc ? validateChanges(doc, changes, profile) : []),
    [doc, changes, profile],
  );
  const modified = useMemo(
    () =>
      doc
        ? doc.fields.filter(
            (f) =>
              f.id in changes &&
              !Object.is(changes[f.id], readField(doc.original, f)),
          )
        : [],
    [doc, changes],
  );
  const resetPending = changes[CONE_RESET_ACTION] === 1;
  const changeCount = modified.length + (resetPending ? 1 : 0);
  const conePlan = useMemo(() => {
    if (!doc || !profile) return;
    try {
      return coneCrazyResetPlan(doc, profile);
    } catch {
      return;
    }
  }, [doc, profile]);
  function valueFor(f: Field) {
    return resetPending && conePlan && f.id === 'stats.race19'
      ? 0
      : resetPending && conePlan && f.id === 'progress.current'
        ? conePlan.after.progress
        : currentValue(doc!, f, changes);
  }
  async function loadGame(file: File) {
    const sequence = ++gameSequence.current;
    setGameError(undefined);
    setProfile(undefined);
    setGameBusy(true);
    try {
      if (file.size > 256 * 1024 * 1024 || file.size < 204596)
        throw new ConeError('gameSize');
      const next = await verifyConeCrazyGameData(
        new Uint8Array(await file.arrayBuffer()),
      );
      if (sequence !== gameSequence.current) return;
      if (doc) inspectConeCrazySave(doc);
      setProfile(next);
    } catch (error) {
      if (sequence === gameSequence.current)
        setGameError(error instanceof ConeError ? error.code : 'gameRead');
    } finally {
      if (sequence === gameSequence.current) setGameBusy(false);
    }
  }
  function queueReset() {
    if (!doc || !profile || resetPending) return;
    try {
      coneCrazyResetPlan(doc, profile);
      const next: Changes = { ...changes, [CONE_RESET_ACTION]: 1 };
      delete next['stats.race19'];
      push(next);
      navigate('review');
    } catch (error) {
      setGameError(error instanceof ConeError ? error.code : 'saveProfile');
    }
  }
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    try {
      localStorage.setItem('workshop-language', lang);
    } catch {
      /* Optional preference. */
    }
  }, [lang]);
  useEffect(() => {
    if (!changeCount) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changeCount]);
  function push(next: Changes) {
    setHistory((old) => [
      ...old.slice(Math.max(0, cursor - 199), cursor + 1),
      next,
    ]);
    setCursor(Math.min(cursor + 1, 200));
    setStatus('');
  }
  function edit(f: Field, value: Value) {
    if (!doc) return;
    if (f.type === 'f32' && typeof value === 'number')
      value = Math.fround(value);
    const next = { ...changes, [f.id]: value };
    if (f.id.match(/^weapon\.\d+\.type$/)) {
      const ammo = f.id.replace('.type', '.ammo'),
        ammoField = doc.fields.find((x) => x.id === ammo)!;
      if (value === 0) next[ammo] = 0;
      else if (Number(currentValue(doc, ammoField, changes)) === 0)
        next[ammo] = 1;
    }
    for (const [id, val] of Object.entries(next)) {
      const field = doc.fields.find((f) => f.id === id);
      if (field && Object.is(val, readField(doc.original, field)))
        delete next[id];
    }
    push(next);
  }
  async function load(file: File, force = false) {
    if (changeCount && !force) {
      setPending(file);
      return;
    }
    const sequence = ++loadSequence.current;
    setError([]);
    setStatus('');
    setBusy(true);
    try {
      if (file.size !== RETAIL_SIZE) {
        setError(['size']);
        return;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (sequence !== loadSequence.current) return;
      const inspection = inspectSave(bytes);
      if (!inspection.valid) {
        setError(inspection.diagnostics);
        return;
      }
      const next = parseRetailSave(bytes);
      gameSequence.current++;
      setProfile(undefined);
      setGameBusy(false);
      setGameError(undefined);
      setDoc(next);
      setFilename(
        /^GTAVCsf[1-8]\.b$/i.test(file.name) ? file.name : 'GTAVCsf1.b',
      );
      setHistory([{}]);
      setCursor(0);
      setSection('player');
      setRecord('');
      setSearch('');
    } catch {
      if (sequence === loadSequence.current) setError(['read']);
    } finally {
      if (sequence === loadSequence.current) setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  function navigate(s: Section | 'review') {
    setSection(s);
    setRecord('');
    setSearch('');
  }
  function exportFile() {
    if (!doc || errors.length) return;
    try {
      const { bytes } = exportRetailSave(doc, changes, profile);
      download(bytes, filename);
      setStatus('exportOk');
    } catch {
      setError(['export']);
    }
  }
  const exportPreview = useMemo(() => {
    if (!doc || errors.length || section !== 'review') return undefined;
    try {
      return exportRetailSave(doc, changes, profile);
    } catch {
      return undefined;
    }
  }, [doc, changes, errors.length, section, profile]);
  const sectionFields = doc?.fields.filter((f) => f.section === section) ?? [];
  const groups = [...new Set(sectionFields.map((f) => f.group[0]))];
  const grouped = ['garages', 'gangs', 'spawns'].includes(section);
  const filteredGroups = groups.filter((g) =>
    sectionFields.some((f) => f.group[0] === g && matches(f)),
  );
  const firstOccupied =
    section === 'garages'
      ? filteredGroups.find((g) =>
          sectionFields.some(
            (f) =>
              f.group[0] === g &&
              f.id.endsWith('.model') &&
              Number(readField(doc!.original, f)) !== 0,
          ),
        )
      : undefined;
  const selected = filteredGroups.includes(record)
    ? record
    : (firstOccupied ?? filteredGroups[0]);
  const visibleFields = sectionFields.filter(
    (f) => (!grouped || f.group[0] === selected) && (!search || matches(f)),
  );
  function matches(f: Field) {
    const model = vehicles.find(
      (v) => v.value === (doc ? currentValue(doc, f, changes) : undefined),
    );
    const haystack = [
      f.id,
      ...f.label,
      ...f.group,
      ...(f.help ?? []),
      ...(f.options?.find(
        (o) => o.value === (doc ? currentValue(doc, f, changes) : undefined),
      )?.label ?? []),
      ...(f.id.endsWith('.model') && model ? model.label : []),
    ]
      .join(' ')
      .toLocaleLowerCase();
    return haystack.includes(search.trim().toLocaleLowerCase());
  }
  const progressValue = (id: string) =>
    Number(doc && valueFor(doc.fields.find((f) => f.id === id)!));
  return (
    <>
      <a className="skip" href="#main">
        {lang === 'pt' ? 'Ir para o conteúdo' : 'Skip to content'}
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            VC<span>↗</span>
          </span>
          <div>
            <strong>Save Workshop</strong>
            <span>{t('subtitle')}</span>
          </div>
        </div>
        <div className="top-actions">
          <span className="preview">{t('preview')}</span>
          <label className="language">
            <span className="sr-only">Language / Idioma</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Locale)}
              aria-label="Language / Idioma"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </header>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        accept=".b"
        aria-label={t('open')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void load(file);
        }}
      />
      {error.length > 0 && (
        <div className="alert error" role="alert">
          <strong>{t('loadError')}</strong>
          {error.map((e) => (
            <p key={e}>
              {diagnostic[e]
                ? text(diagnostic[e], lang)
                : e === 'export'
                  ? lang === 'pt'
                    ? 'A exportação falhou na verificação. O original foi preservado.'
                    : 'Export verification failed. The original was preserved.'
                  : t('readError')}
            </p>
          ))}
          <button onClick={() => setError([])}>
            {lang === 'pt' ? 'Fechar' : 'Dismiss'}
          </button>
        </div>
      )}
      {pending && (
        <div className="alert" role="alert">
          <p>{t('discard')}</p>
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                const file = pending;
                setPending(undefined);
                void load(file, true);
              }}
            >
              {t('confirmReplace')}
            </button>
            <button
              onClick={() => {
                setPending(undefined);
                if (fileInput.current) fileInput.current.value = '';
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      {!doc ? (
        <main id="main" className="welcome">
          <div className="eyebrow">GTA VICE CITY / RETAIL</div>
          <h1>{t('title')}</h1>
          <p className="intro">{t('intro')}</p>
          <div
            className="dropzone"
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) void load(file);
            }}
          >
            <span className="file-symbol" aria-hidden="true">
              .b
            </span>
            <button
              className="primary"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? t('reading') : t('select')}{' '}
              <span aria-hidden="true">↗</span>
            </button>
            <p>{t('drop')}</p>
            <small>{t('supported')}</small>
          </div>
          <p className="local">
            <span aria-hidden="true">◉</span> {t('local')}
          </p>
          <div className="steps">
            {(['basics', 'editStep', 'exportStep'] as const).map((key, i) => (
              <section key={key}>
                <h2>{t(key)}</h2>
                <p>
                  {t((['basicsBody', 'editBody', 'exportBody'] as const)[i])}
                </p>
              </section>
            ))}
          </div>
        </main>
      ) : (
        <div className="workspace">
          <aside className="sidebar">
            <div className="file-summary">
              <span className="eyebrow">{filename}</span>
              <strong>{doc.inspection.name}</strong>
              <span>PC Retail · .b</span>
            </div>
            <nav
              aria-label={lang === 'pt' ? 'Áreas de edição' : 'Editing areas'}
            >
              {sections.map((s, i) => (
                <button
                  key={s}
                  aria-current={section === s ? 'page' : undefined}
                  onClick={() => navigate(s)}
                >
                  <span className="nav-number">{numbers[i]}</span>
                  {t(s)}
                </button>
              ))}
              <button
                className="review-nav"
                aria-current={section === 'review' ? 'page' : undefined}
                onClick={() => navigate('review')}
              >
                <span className="nav-number">↗</span>
                {t('review')}
                <span className="count">{changeCount}</span>
              </button>
            </nav>
            <div className="sidebar-bottom">
              <p>{t('local')}</p>
              <button
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                {busy ? t('reading') : t('replace')}
              </button>
              <button onClick={() => download(doc.original, filename)}>
                {t('backup')}
              </button>
            </div>
          </aside>
          <main id="main" className="editor">
            <div className="editor-top">
              <div>
                <div className="eyebrow">
                  {section === 'review'
                    ? 'EXPORT / .B'
                    : `RETAIL / ${numbers[sections.indexOf(section)]}`}
                </div>
                <h1>{t(section)}</h1>
              </div>
              <div className="actions history">
                <button
                  disabled={cursor === 0}
                  onClick={() => {
                    setCursor(cursor - 1);
                    setStatus('');
                  }}
                >
                  {t('undo')}
                </button>
                <button
                  disabled={cursor >= history.length - 1}
                  onClick={() => {
                    setCursor(cursor + 1);
                    setStatus('');
                  }}
                >
                  {t('redo')}
                </button>
                <button disabled={!changeCount} onClick={() => push({})}>
                  {t('restore')}
                </button>
              </div>
            </div>
            <div className="validation-bar">
              <span className="status-dot" />
              {t('valid')}
              <span className="mono">
                {doc.inspection.blocks.length} {t('blocks')} ·{' '}
                {doc.inspection.size.toLocaleString(lang)} B
              </span>
            </div>
            <p className="section-description">
              {section === 'review'
                ? t('reviewHint')
                : t(`${section}Hint` as CopyKey)}
            </p>
            {section === 'review' ? (
              <>
                <div className="export-facts">
                  <span>
                    {t('checksum')}:{' '}
                    <code>
                      0x
                      {doc.inspection.storedChecksum
                        .toString(16)
                        .padStart(8, '0')}
                    </code>
                  </span>
                  <span>
                    {changeCount} {t(changeCount === 1 ? 'change' : 'changes')}
                  </span>
                  {exportPreview && (
                    <span>
                      {exportPreview.changedBytes} {t('byteChanges')}
                    </span>
                  )}
                </div>
                {modified.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('field')}</th>
                          <th>{t('before')}</th>
                          <th>{t('after')}</th>
                          <th>
                            <span className="sr-only">{t('remove')}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {modified.map((f) => (
                          <tr key={f.id}>
                            <th scope="row">
                              <span>{text(f.label, lang)}</span>
                              <small>{text(f.group, lang)}</small>
                            </th>
                            <td>{displayValue(readField(doc.original, f))}</td>
                            <td>{displayValue(changes[f.id])}</td>
                            <td>
                              <button
                                onClick={() => {
                                  const next = { ...changes };
                                  delete next[f.id];
                                  push(next);
                                }}
                              >
                                {t('remove')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !resetPending && (
                    <p className="empty-result">{t('noChanges')}</p>
                  )
                )}
                {resetPending && conePlan && (
                  <section
                    className="cone-panel"
                    aria-labelledby="reset-review-title"
                  >
                    <h2 id="reset-review-title">{ct('review')}</h2>
                    <dl className="cone-facts">
                      <div>
                        <dt>{ct('record')}</dt>
                        <dd>
                          {conePlan.before.comparisonTime} s → {ct('cleared')}
                        </dd>
                      </div>
                      <div>
                        <dt>{ct('bonus')}</dt>
                        <dd>
                          {conePlan.before.checkpointBonusSeconds} s → 12 s
                        </dd>
                      </div>
                      <div>
                        <dt>{ct('reward')}</dt>
                        <dd>${conePlan.before.reward} → $200</dd>
                      </div>
                      <div>
                        <dt>{ct('progress')}</dt>
                        <dd>
                          {conePlan.before.progress} → {conePlan.after.progress}
                        </dd>
                      </div>
                    </dl>
                    <p className="note">{ct('consequence')}</p>
                    <button
                      onClick={() => {
                        const next = { ...changes };
                        delete next[CONE_RESET_ACTION];
                        push(next);
                      }}
                    >
                      {t('remove')}
                    </button>
                  </section>
                )}
                <p className="note">{t('linked')}</p>
                {modified.some((f) => f.id.startsWith('stats.race')) && (
                  <p className="note">{t('statsRecordNotice')}</p>
                )}
                {errors.length > 0 && (
                  <p role="alert" className="error-text">
                    {t('invalidEdits')}{' '}
                    {errors.map((e) => (
                      <button
                        className="error-link"
                        key={`${e.field}-${e.code}`}
                        onClick={() => {
                          if (e.field === CONE_RESET_ACTION) {
                            navigate('progress');
                            return;
                          }
                          const f = doc.fields.find((f) => f.id === e.field);
                          if (f) {
                            navigate(f.section);
                            setRecord(f.group[0]);
                          }
                        }}
                      >
                        {e.field === CONE_RESET_ACTION
                          ? coneErrorText(e.code, lang)
                          : doc.fields.find((f) => f.id === e.field)
                            ? text(
                                doc.fields.find((f) => f.id === e.field)!.label,
                                lang,
                              )
                            : e.field}
                      </button>
                    ))}
                  </p>
                )}
                <div className="export-actions">
                  <button
                    className="primary"
                    disabled={errors.length > 0 || !exportPreview}
                    onClick={exportFile}
                  >
                    {changeCount ? t('download') : t('exactCopy')}{' '}
                    <span aria-hidden="true">↓</span>
                  </button>
                  <span className="mono">{filename}</span>
                </div>
                <p className="note">{t('notice')}</p>
                <p className="note">{t('compatibility')}</p>
              </>
            ) : (
              <>
                {section === 'progress' && (
                  <ConeCrazyPanel
                    doc={doc}
                    profile={profile}
                    lang={lang}
                    busy={gameBusy}
                    error={gameError}
                    pending={resetPending}
                    onFile={(file) => void loadGame(file)}
                    onReset={queueReset}
                  />
                )}
                {section === 'progress' && (
                  <div className="progress-summary">
                    <strong>
                      {t('mission')}: {doc.inspection.name}
                    </strong>
                    <p>
                      {t('progressPercent')}:{' '}
                      {progressValue('progress.total') > 0
                        ? `${((100 * progressValue('progress.current')) / progressValue('progress.total')).toFixed(1)}%`
                        : '—'}
                    </p>
                  </div>
                )}
                <div className="filters">
                  <label className="search">
                    <span className="sr-only">{t('search')}</span>
                    <input
                      type="search"
                      placeholder={t('search')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  {grouped && (
                    <label className="record-picker">
                      {t('record')}
                      <select
                        aria-label={t('record')}
                        value={selected ?? ''}
                        onChange={(e) => setRecord(e.target.value)}
                      >
                        {filteredGroups.map((g) => {
                          const first = sectionFields.find(
                            (f) => f.group[0] === g,
                          )!;
                          const model = first.options?.find(
                            (o) =>
                              o.value === currentValue(doc, first, changes),
                          );
                          return (
                            <option key={g} value={g}>
                              {text(first.group, lang)}
                              {model ? ` · ${text(model.label, lang)}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  )}
                </div>
                {!visibleFields.length && (
                  <p className="empty-result">{t('noResults')}</p>
                )}
                {groups
                  .filter((g) => visibleFields.some((f) => f.group[0] === g))
                  .map((g) => (
                    <fieldset key={g}>
                      <legend>
                        {text(
                          visibleFields.find((f) => f.group[0] === g)!.group,
                          lang,
                        )}
                      </legend>
                      <div className="field-grid">
                        {visibleFields
                          .filter((f) => f.group[0] === g)
                          .map((f) => (
                            <FieldEditor
                              key={f.id}
                              field={
                                resetPending && f.id === 'stats.race19'
                                  ? { ...f, readOnly: true }
                                  : f
                              }
                              doc={doc}
                              lang={lang}
                              value={valueFor(f)}
                              error={errors.find((e) => e.field === f.id)?.code}
                              onChange={(value) => edit(f, value)}
                            />
                          ))}
                      </div>
                    </fieldset>
                  ))}
                <div className="editor-bottom">
                  <span>
                    {changeCount} {t(changeCount === 1 ? 'change' : 'changes')}
                  </span>
                  <button
                    className="primary"
                    onClick={() => navigate('review')}
                  >
                    {t('review')} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </>
            )}
            <p role="status" className="export-status">
              {status && t(status as keyof typeof copy)}
            </p>
          </main>
        </div>
      )}
      <footer>
        <p>{t('independent')}</p>
        <p>{t('privacy')}</p>
        <span>
          Save Workshop · MIT · v0.1.0 ·{' '}
          <a href="https://github.com/liddack/gtavc-save-web-editor">
            {t('repository')}
          </a>
        </span>
      </footer>
    </>
  );
}
