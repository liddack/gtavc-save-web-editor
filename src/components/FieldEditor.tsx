import { text, type Locale } from '../core/catalogs';
import { readField } from '../core/retail';
import type { Field, RetailDocument, Value } from '../core/types';
import { translate, validation } from '../i18n';
export function displayValue(value: Value): string {
  if (typeof value !== 'number') return value;
  if (!Number.isFinite(value)) return '—';
  // Shortest friendly decimal that preserves the original float32 representation.
  if (Math.fround(value) === value)
    for (let digits = 1; digits <= 9; digits++) {
      const short = Number(value.toPrecision(digits));
      if (Math.fround(short) === value) return String(short);
    }
  return String(value);
}
export function FieldEditor({
  field: f,
  doc,
  value,
  lang,
  error,
  onChange,
}: {
  field: Field;
  doc: RetailDocument;
  value: Value;
  lang: Locale;
  error?: string;
  onChange: (value: Value) => void;
}) {
  const original = readField(doc.original, f);
  const changed = !Object.is(original, value);
  const id = `field-${f.id}`;
  const descriptionIds =
    [f.help ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const known = !f.options || f.options.some((o) => o.value === value);
  return (
    <div className={`field ${changed ? 'changed' : ''}`}>
      <label htmlFor={id}>
        {text(f.label, lang)}
        {f.readOnly && (
          <span className="readonly">{translate('readonly', lang)}</span>
        )}
      </label>
      {f.readOnly ? (
        <output id={id} aria-describedby={descriptionIds}>
          {f.options?.find((o) => o.value === value)
            ? text(f.options.find((o) => o.value === value)!.label, lang)
            : displayValue(value)}
        </output>
      ) : f.options ? (
        <select
          id={id}
          value={String(value)}
          aria-invalid={!!error}
          aria-describedby={descriptionIds}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {!known && (
            <option value={String(value)} disabled>
              {translate('knownUnknown', lang)} · {String(value)}
            </option>
          )}
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {text(o.label, lang)}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={f.type === 'name' ? 'text' : 'number'}
          value={
            typeof value === 'number' && !Number.isFinite(value)
              ? ''
              : f.type === 'f32'
                ? displayValue(value)
                : value
          }
          min={f.type === 'name' ? undefined : f.min}
          max={f.type === 'name' ? undefined : f.max}
          step={f.type === 'f32' ? 'any' : 1}
          maxLength={f.type === 'name' ? 23 : undefined}
          aria-invalid={!!error}
          aria-describedby={descriptionIds}
          onChange={(e) =>
            onChange(
              f.type === 'name'
                ? e.target.value
                : e.target.value === ''
                  ? NaN
                  : Number(e.target.value),
            )
          }
        />
      )}
      {f.help && <small id={`${id}-help`}>{text(f.help, lang)}</small>}
      {changed && (
        <small>
          {translate('original', lang)}: {displayValue(original)}
        </small>
      )}
      {error && (
        <small className="error-text" id={`${id}-error`}>
          {text(validation[error] ?? validation.number, lang)}
          {error === 'range' && ` (${f.min} … ${f.max})`}
        </small>
      )}
    </div>
  );
}
