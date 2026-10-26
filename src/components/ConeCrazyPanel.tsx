import { useRef } from 'react';
import { type Locale } from '../core/catalogs';
import {
  coneCrazyResetPlan,
  ConeError,
  type ConeProfile,
} from '../core/coneCrazy';
import type { RetailDocument } from '../core/types';
import { coneText, coneErrorText } from '../i18n';
export function ConeCrazyPanel({
  doc,
  profile,
  lang,
  busy,
  error,
  pending,
  onFile,
  onReset,
}: {
  doc: RetailDocument;
  profile?: ConeProfile;
  lang: Locale;
  busy: boolean;
  error?: string;
  pending: boolean;
  onFile: (file: File) => void;
  onReset: () => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    t = (key: keyof typeof coneText) => coneText[key][lang === 'pt' ? 1 : 0];
  let reason: string | undefined,
    plan: ReturnType<typeof coneCrazyResetPlan> | undefined;
  try {
    plan = coneCrazyResetPlan(doc, profile);
  } catch (error) {
    reason = error instanceof ConeError ? error.code : 'saveProfile';
  }
  return (
    <section className="cone-panel" aria-labelledby="cone-title">
      <div className="eyebrow">CONE CRAZY</div>
      <h2 id="cone-title">{t('title')}</h2>
      <p>{t('intro')}</p>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept=".data,.scm"
        aria-label={t('gameFile')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <div className="actions">
        <button
          disabled={busy || pending}
          onClick={() => input.current?.click()}
        >
          {busy ? t('checking') : profile ? t('replaceGame') : t('chooseGame')}
        </button>
        <span className="profile-status" role="status">
          {profile ? t('verified') : t('unverified')}
        </span>
      </div>
      <p className="note">{t('local')}</p>
      {error && (
        <p role="alert" className="error-text">
          {coneErrorText(error, lang)}
        </p>
      )}
      {reason && reason !== 'verifyGame' && (
        <p className="note">{coneErrorText(reason, lang)}</p>
      )}
      {plan && (
        <dl className="cone-facts">
          <div>
            <dt>{t('record')}</dt>
            <dd>
              {plan.before.comparisonTime} s → {t('cleared')}
            </dd>
          </div>
          <div>
            <dt>{t('bonus')}</dt>
            <dd>{plan.before.checkpointBonusSeconds} s → 12 s</dd>
          </div>
          <div>
            <dt>{t('reward')}</dt>
            <dd>${plan.before.reward} → $200</dd>
          </div>
          <div>
            <dt>{t('progress')}</dt>
            <dd>
              {plan.before.progress} → {plan.after.progress}
            </dd>
          </div>
        </dl>
      )}
      <p className="note">{t('consequence')}</p>
      <button
        className="primary"
        disabled={busy || !plan || pending}
        onClick={onReset}
      >
        {pending ? t('queued') : t('queue')}
      </button>
    </section>
  );
}
