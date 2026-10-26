import { expect, test } from 'playwright/test';
import { syntheticSave } from '../tests/fixture';
import { checksum, parseRetailSave, readField } from '../src/core/retail';
import { readFile } from 'node:fs/promises';
async function openSave(
  page: import('playwright/test').Page,
  bytes = syntheticSave(),
) {
  await page.goto('/');
  await page.getByLabel('Language / Idioma').selectOption('en');
  await page.locator('input[type=file]').setInputFiles({
    name: 'GTAVCsf1.b',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(bytes),
  });
  await expect(
    page.getByRole('heading', { name: 'Player', exact: true }),
  ).toBeVisible();
}
test('edits locally, reviews, downloads and reimports without transmitting save data', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    requests.push(`${r.method()} ${r.url()}`);
    expect(r.postData()).toBeNull();
  });
  await openSave(page);
  await page.getByLabel('Money', { exact: true }).fill('50000');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Review & export' })
    .click();
  await expect(
    page.getByRole('cell', { name: '50000', exact: true }),
  ).toBeVisible();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download edited save' }).click(),
  ]);
  expect(d.suggestedFilename()).toBe('GTAVCsf1.b');
  const bytes = new Uint8Array(await readFile((await d.path())!));
  const doc = parseRetailSave(bytes);
  expect(
    readField(
      bytes,
      doc.fields.find((f) => f.id === 'player.money')!,
    ),
  ).toBe(50000);
  await page
    .getByRole('button', { name: 'Restore original', exact: true })
    .click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'GTAVCsf1.b',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(bytes),
  });
  await expect(page.getByLabel('Money', { exact: true })).toHaveValue('50000');
  expect(
    requests.every(
      (r) =>
        r.startsWith('GET http://127.0.0.1:4173/') ||
        r.startsWith('GET ws://127.0.0.1:4173/'),
    ),
  ).toBe(true);
});
test('blocks invalid edits, supports undo/redo and translates the full workflow', async ({
  page,
}) => {
  await openSave(page);
  await page.getByLabel('Money', { exact: true }).fill('-1');
  await expect(
    page.getByText('Value outside the allowed range.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Money', { exact: true })).toHaveValue('27000');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByLabel('Money', { exact: true })).toHaveValue('-1');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Review & export' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Download edited save' }),
  ).toBeDisabled();
  await page.getByLabel('Language / Idioma').selectOption('pt');
  await expect(
    page.getByRole('heading', { name: 'Revisar e exportar' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Restaurar original', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Baixar cópia idêntica' }),
  ).toBeEnabled();
});
test('rejects bad files while preserving an open document and confirms replacement', async ({
  page,
}) => {
  await openSave(page);
  await page.getByLabel('Money', { exact: true }).fill('10');
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.b',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('bad'),
  });
  await expect(
    page.getByText('Replace the current save and discard its edits?'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Money', { exact: true })).toHaveValue('10');
  await page
    .getByRole('button', { name: 'Restore original', exact: true })
    .click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.b',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('bad'),
  });
  await expect(page.getByRole('alert')).toContainText(
    'Expected a 201,828-byte',
  );
  await expect(page.getByLabel('Money', { exact: true })).toHaveValue('27000');
});
test('browses advanced records, keeps progression read-only and preserves edits across areas', async ({
  page,
}) => {
  await openSave(page);
  for (const name of [
    'Weapons',
    'World & save',
    'Garages',
    'Gangs',
    'Vehicle spawns',
    'Statistics',
    'Progress',
  ]) {
    await page
      .getByRole('navigation')
      .getByRole('button', { name, exact: false })
      .click();
    await expect(
      page.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  }
  await expect(page.locator('main input[type=number]')).toHaveCount(0);
  await expect(
    page.getByText('Campaign editing is locked', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Vehicle spawns' })
    .click();
  await page.getByLabel('Record', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('Minimum delay (ms)', { exact: true }).fill('1500');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Review & export' })
    .click();
  await expect(
    page.getByRole('cell', { name: '1500', exact: true }),
  ).toBeVisible();
});
for (const [name, width, height] of [
  ['mobile', 390, 844],
  ['tablet', 820, 1180],
  ['desktop', 1440, 1000],
] as const) {
  test(`responsive layout: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${name}-welcome.png`,
      fullPage: true,
    });
    await openSave(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${name}-editor.png`,
      fullPage: true,
    });
  });
}

test('explains that clearing Cone Crazy Stats does not reset the challenge', async ({
  page,
}) => {
  const bytes = syntheticSave();
  const field = parseRetailSave(bytes).fields.find(
    (f) => f.id === 'stats.race19',
  )!;
  const view = new DataView(bytes.buffer);
  view.setUint32(field.offset, 36, true);
  view.setUint32(bytes.length - 4, checksum(bytes), true);
  await openSave(page, bytes);
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Statistics' })
    .click();
  const cone = page.getByLabel('Cone Crazy · Stats time (seconds)', {
    exact: true,
  });
  await expect(cone).toHaveAccessibleDescription(/does not reset Cone Crazy/);
  await expect(cone).toHaveValue('36');
  await cone.fill('0');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Review & export' })
    .click();
  await expect(
    page.getByText('You changed a statistics entry, not a challenge reset.', {
      exact: false,
    }),
  ).toBeVisible();
});

test('queues a complete reset after local game verification, supports undo/redo and rechecks on save replacement', async ({
  page,
}) => {
  const { coneSave, syntheticGameData } = await import('../tests/cone-fixture');
  const { CONE_MAIN_SHA256, CONE_MISSION_SHA256 } =
    await import('../src/core/coneCrazy');
  await openSave(page, coneSave());
  await page.getByLabel('Money', { exact: true }).fill('50000');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Progress' })
    .click();
  const resetButton = page.getByRole('button', {
    name: 'Prepare full Cone Crazy reset',
  });
  await expect(resetButton).toBeDisabled();
  const input = page.getByLabel('Game data or main.scm', { exact: true });
  await input.setInputFiles({
    name: 'unknown.scm',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(syntheticGameData()),
  });
  await expect(page.getByRole('alert')).toContainText('does not match');
  await expect(resetButton).toBeDisabled();
  // Explicit cryptographic boundary mock for the synthetic, non-game fixture only.
  // Real SHA-256 verification is covered with private game assets in the local core suite.
  await page.evaluate(
    ({ mission, main }) => {
      Object.defineProperty(crypto.subtle, 'digest', {
        configurable: true,
        value: async (_algorithm: unknown, data: ArrayBuffer) =>
          Uint8Array.from(
            (data.byteLength === 4968 ? mission : main).match(/../g)!,
            (b) => parseInt(b, 16),
          ).buffer,
      });
    },
    { mission: CONE_MISSION_SHA256, main: CONE_MAIN_SHA256 },
  );
  await input.setInputFiles({
    name: 'synthetic-profile.scm',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(syntheticGameData()),
  });
  await expect(
    page.getByText('Compatible script verified', { exact: true }),
  ).toBeVisible();
  await resetButton.click();
  await expect(
    page.getByRole('heading', { name: 'Full Cone Crazy reset', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Full Cone Crazy reset', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Full Cone Crazy reset', exact: true }),
  ).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download edited save' }).click(),
  ]);
  const bytes = new Uint8Array(await readFile((await download.path())!)),
    doc = parseRetailSave(bytes),
    view = new DataView(bytes.buffer);
  expect(view.getInt32(0xf8 + 351 * 4, true)).toBe(0);
  expect(view.getInt32(0xf8 + 352 * 4, true)).toBe(120);
  expect(view.getInt32(0xf8 + 7926 * 4, true)).toBe(200);
  expect(
    readField(
      bytes,
      doc.fields.find((f) => f.id === 'progress.current')!,
    ),
  ).toBe(62);
  expect(
    readField(
      bytes,
      doc.fields.find((f) => f.id === 'player.money')!,
    ),
  ).toBe(50000);
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'GTAVCsf1.b',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(coneSave()),
    });
  await page.getByRole('button', { name: 'Replace save', exact: true }).click();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Progress' })
    .click();
  await expect(resetButton).toBeDisabled();
  await expect(
    page.locator('label[for="field-progress.property0"]'),
  ).toContainText('Malibu Club');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Statistics' })
    .click();
  await expect(
    page.getByLabel('Alloy Wheels of Steel · Stats time (seconds)', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Hotring · fastest lap (milliseconds)', { exact: true }),
  ).toBeVisible();
});
