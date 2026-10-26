import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { FieldEditor } from '../src/components/FieldEditor';
import {
  checksum,
  exportRetailSave,
  parseRetailSave,
  readField,
} from '../src/core/retail';
import { syntheticSave } from './fixture';

describe('Cone Crazy statistics versus challenge state', () => {
  it('clears only the Stats entry, preserving every script byte and unrelated statistic', () => {
    const bytes = syntheticSave();
    let doc = parseRetailSave(bytes);
    const field = doc.fields.find((f) => f.id === 'stats.race19')!;
    const v = new DataView(bytes.buffer);
    v.setUint32(field.offset, 36, true);
    // An opaque script-state sentinel with the same value must never be treated as a mirror.
    const sentinelOffset = 0xf8 + 4096;
    v.setUint32(sentinelOffset, 36, true);
    v.setUint32(bytes.length - 4, checksum(bytes), true);
    doc = parseRetailSave(bytes);
    const exported = exportRetailSave(doc, { 'stats.race19': 0 });
    expect(readField(exported.bytes, field)).toBe(0);
    expect(
      new DataView(exported.bytes.buffer).getUint32(sentinelOffset, true),
    ).toBe(36);
    const scripts = doc.inspection.blocks[0];
    expect(
      exported.bytes.slice(scripts.data, scripts.data + scripts.size),
    ).toEqual(bytes.slice(scripts.data, scripts.data + scripts.size));
    expect(
      [...bytes.keys()].filter((i) => bytes[i] !== exported.bytes[i]),
    ).toEqual([field.offset, bytes.length - 4]);
    expect(exported.changedBytes).toBe(2);
  });

  it('identifies the old Record 20 as a Stats-only Cone Crazy field with accessible help in both languages', () => {
    const doc = parseRetailSave(syntheticSave());
    const field = doc.fields.find((f) => f.id === 'stats.race19')!;
    expect(field.label.every((label) => label.includes('Cone Crazy'))).toBe(
      true,
    );
    for (const lang of ['en', 'pt'] as const) {
      const html = renderToStaticMarkup(
        createElement(FieldEditor, {
          field,
          doc,
          value: 36,
          lang,
          onChange: () => {},
        }),
      );
      expect(html).toContain('aria-describedby="field-stats.race19-help"');
      expect(html).toContain(
        lang === 'en'
          ? 'does not reset Cone Crazy'
          : 'não reinicia o Cone Crazy',
      );
    }
  });
});
