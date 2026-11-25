import { expect, test } from 'playwright/test';

test('a pointer can match the arc with the arrow buttons visible', async ({ page }, testInfo) => {
  await page.goto('/course/two-ball/quiz');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Use arrow buttons' }).check();
  await expect(page.getByRole('button', { name: 'Higher' })).toBeVisible();
  const peak = page.getByRole('slider', { name: 'Arc peak' });
  const handle = await peak.locator('.sprite-button-surface').boundingBox();
  const reference = await page.locator('[data-arc="previous"]').boundingBox();
  if (!handle || !reference) throw new Error('Both arcs must be visible.');
  const x = handle.x + handle.width / 2;
  const startY = handle.y + handle.height / 2;
  if (testInfo.project.use.hasTouch) {
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
    for (let step = 1; step <= 10; step++) {
      const y = startY + (reference.y - startY) * step / 10;
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  } else {
    await page.mouse.move(x, startY);
    await page.mouse.down();
    await page.mouse.move(x, reference.y, { steps: 10 });
    await page.mouse.up();
  }
  await expect(peak).toHaveAttribute('aria-valuetext', /At eye level/);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Second toss timing' })).toBeVisible();
});

for (const slug of ['two-ball', 'three-throws']) {
  test(`an early release collides and a staggered release clears in ${slug}`, async ({ page }) => {
    await page.goto(`/course/${slug}/quiz`);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await page.getByRole('button', { name: 'Got it', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Quiz notes' })).toBeVisible();
    const peak = page.getByRole('slider', { name: 'Arc peak' });
    await peak.press('PageUp');
    await peak.press('PageUp');
    await page.getByRole('heading', { level: 1 }).press('ArrowUp');
    await peak.press('ArrowUp');
    await expect(peak).toHaveAttribute('aria-valuetext', /At eye level/);
    const submit = page.getByRole('button', { name: 'Submit', exact: true });
    await submit.click();
    const slider = page.getByRole('slider', { name: slug === 'two-ball' ? 'Second toss timing' : 'Third toss timing' });
    await expect(slider).toBeFocused();
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
    await expect(page.locator('[data-encounter], [data-correction-feature]')).toHaveCount(0);
    await expect(page.getByRole('status')).not.toContainText(/collide|passes above/i);
    await submit.click();
    await expect(page.getByRole('region', { name: 'Too early' })).toBeVisible();
    await expect(page.locator('[data-encounter="contact"]')).toBeVisible();
    const centers = () => page.locator('[data-ball]').evaluateAll(nodes => nodes.slice(-2).map(node => {
      const { e: x, f: y } = (node as unknown as SVGGraphicsElement).transform.baseVal.getItem(0).matrix;
      return { x, y };
    }));
    const [a, b] = await centers();
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(20);
    expect((a.x + b.x) / 2).toBeCloseTo(104, -1);
    await page.keyboard.press('Escape');
    await expect(slider).toBeFocused();
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', /passed the middle and is starting to fall/);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
    await expect(page.locator('[data-encounter], [data-correction-feature]')).toHaveCount(0);
    await expect(page.getByRole('status')).not.toContainText(/collide|passes above/i);
    await submit.click();
    await expect(page.locator('[data-encounter="clear"]')).toHaveCount(1);
    const [falling, rising] = await centers();
    expect(Math.abs(falling.x - rising.x)).toBeLessThan(1);
    expect(rising.y - falling.y).toBeGreaterThan(40);
    const success = page.getByRole('dialog', { name: 'Quiz complete' });
    await expect(success).toBeVisible();
    await success.getByRole('button', { name: 'Dismiss', exact: true }).click();
    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page).toHaveURL(`/course/${slug}/practice`);
  });
}


test('the quiz heading adjusts one-ball geometry with or without arrow buttons', async ({ page }) => {
  await page.goto('/course/one-ball/quiz');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeFocused();
  const peak = page.getByRole('slider', { name: 'Arc peak' });
  const hand = page.getByRole('slider', { name: /Hand spacing.*left hand/ });
  const preference = page.getByRole('checkbox', { name: 'Use arrow buttons' });
  for (const show of [false, true]) {
    await preference.setChecked(show);
    const height = Number(await peak.getAttribute('aria-valuenow'));
    const width = Number(await hand.getAttribute('aria-valuenow'));
    await heading.press('ArrowUp');
    await heading.press('ArrowLeft');
    await expect(peak).toHaveAttribute('aria-valuenow', String(height + 8));
    await expect(hand).toHaveAttribute('aria-valuenow', String(width - 2));
    await peak.press('Shift+ArrowUp');
    await expect(peak).toHaveAttribute('aria-valuenow', String(height + 9));
  }
});
