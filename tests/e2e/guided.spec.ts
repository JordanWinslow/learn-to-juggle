import { expect, test } from 'playwright/test';
import { GUIDE_PHASES } from '../../src/scene/motion';
import { COURSE_STEPS, nextStepLabel } from '../../src/lessons/curriculum';

test('the locked quiz explains how to continue by keyboard, mouse and touch', async ({ page, hasTouch }) => {
  await page.goto('/course/one-ball/lesson');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeFocused();
  const quiz = page.getByRole('button', { name: 'Quiz', exact: true });
  const hint = page.getByRole('tooltip');
  await expect(quiz).toBeDisabled();
  await expect(quiz).toHaveAccessibleDescription('Read each cue, then choose “Got it” to continue.');
  await expect(hint).toBeHidden();
  const location = await quiz.boundingBox();

  if (hasTouch) {
    // Playwright guards disabled actions. Tap the physical control like a learner.
    await page.touchscreen.tap(location!.x + location!.width / 2, location!.y + location!.height / 2);
    await expect(hint).toBeVisible();
    await expect(hint).toBeInViewport({ ratio: 1 });
    await heading.tap();
  } else {
    await quiz.hover();
    await expect(hint).toBeVisible();
    await hint.hover();
    await expect(hint).toBeVisible();
    await heading.hover();
  }
  await expect(hint).toBeHidden();

  await page.getByRole('checkbox', { name: 'Path' }).focus();
  await page.keyboard.press('Tab');
  await expect(quiz).toBeFocused();
  await expect(hint).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/course/one-ball/lesson');
  await page.keyboard.press('Escape');
  await expect(hint).toBeHidden();
  await expect(quiz).toBeFocused();
  expect(await quiz.boundingBox()).toEqual(location);
});

for (const guide of COURSE_STEPS.filter(step => step.kind === 'lesson')) {
  const destination = COURSE_STEPS[COURSE_STEPS.indexOf(guide) + 1];
  const phases = guide.cues.map(cue => cue.pauseAt);
  test(`${guide.href} holds each teaching pose and opens free playback after the final cue`, async ({ page }, testInfo) => {
    const animate = testInfo.project.name === 'Desktop';
    await page.emulateMedia({ reducedMotion: animate ? 'no-preference' : 'reduce' });
    await page.goto(guide.href);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await page.evaluate(() => document.fonts.ready);
    const timeline = page.getByRole('slider', { name: 'Motion position' });
    const play = page.getByRole('button', { name: 'Play', exact: true });
    const pause = page.getByRole('button', { name: 'Pause', exact: true });
    const ack = page.getByRole('button', { name: 'Got it', exact: true });
    const next = page.getByRole('button', { name: nextStepLabel(destination), exact: true });
    const side = page.getByRole('button', { name: 'Side', exact: true });
    const picture = page.locator('.lesson-picture');
    const initialBounds = await picture.boundingBox();
    const advanceBounds = await next.boundingBox();
    for (let i = 0; i < phases.length; i++) {
      await expect(page.getByText(`Cue ${i + 1} of ${phases.length}`, { exact: true })).toBeVisible();
      const held = String(Math.round(phases[i] * 1000));
      await expect(timeline).toHaveValue(held);
      await expect(play).toBeVisible();
      await expect(next).toBeVisible();
      await expect(next).toBeDisabled();
      if (guide.id === 'guide') {
        const sideCue = i < 2;
        await expect(side).toHaveAttribute('aria-pressed', String(sideCue));
        if (i === 0) await expect(page.getByText(/Hey there!/)).toBeVisible();
        if (sideCue) {
          await expect(page.getByRole('img', { name: 'Side posture' })).toBeVisible();
          await expect(page.locator('[data-cue-target="elbow"]')).toHaveText('90°');
        }
        expect(await picture.boundingBox()).toEqual(initialBounds);
      }
      if (i === 0 && animate) {
        await play.click();
        await expect(timeline).not.toHaveValue(held);
        await expect(page.getByText(`Cue 1 of ${phases.length}`, { exact: true })).toBeVisible();
      }
      if (i < phases.length - 1) {
        await expect(ack).toHaveCount(0);
        await page.getByRole('button', { name: /Next cue/ }).press('Enter');
      }
    }
    await ack.press('Enter');
    const review = page.getByRole('button', { name: 'Review cues' });
    await expect(review).toBeFocused();
    await expect(next).toBeEnabled();
    expect(await next.boundingBox()).toEqual(advanceBounds);
    await expect(animate ? pause : play).toBeVisible();

    if (guide.id === 'guide') {
      if (!animate) {
        await expect(timeline).toHaveValue(String(Math.round(GUIDE_PHASES.catch * 1000)));
        await play.click();
      }
      // Cross the loop boundary and the next teaching pose without stopping.
      const position = () => timeline.inputValue().then(Number);
      await expect.poll(position).toBeLessThan(Math.round(GUIDE_PHASES.catch * 1000));
      await expect.poll(position).toBeGreaterThan(Math.round(GUIDE_PHASES.apex * 1000) + 10);
      await pause.click();
      await timeline.press('Home');
      await play.click();
      await expect.poll(position).toBeGreaterThan(Math.round(GUIDE_PHASES.catch * 1000) + 10);

      // Reopen the notes deliberately, then return to the learner's chosen playback.
      await review.click();
      await expect(page.getByText('Cue 1 of 4', { exact: true })).toBeVisible();
      await expect(side).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'Front', exact: true }).click();
      await expect(page.getByRole('img', { name: 'Juggling coach' })).toBeVisible();
      await side.click();
      await expect(play).toBeVisible();
      await expect(next).toBeEnabled();
      const nextCue = page.getByRole('button', { name: /Next cue/ });
      await nextCue.press('Enter');
      await expect(page.getByText('Cue 2 of 4', { exact: true })).toBeVisible();
      await nextCue.press('Enter');
      await expect(page.getByText('Cue 3 of 4', { exact: true })).toBeVisible();
      await expect(side).toHaveAttribute('aria-pressed', 'true');
      await nextCue.press('Escape');
      await expect(pause).toBeVisible();
      await pause.click();
      await review.click();
      await nextCue.press('Escape');
      await expect(play).toBeVisible();
    }
    await next.click();
    await expect(page).toHaveURL(destination?.href ?? '/complete');
  });
}
