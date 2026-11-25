import { expect, test } from 'playwright/test';
import { COURSE_STEPS } from '../../src/lessons/curriculum';

test('every curriculum step opens at its own URL', async ({ page }) => {
  for (const step of COURSE_STEPS) {
    const response = await page.goto(step.href);
    expect(response?.status(), step.href).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: step.title, exact: true })).toBeVisible();
  }
});

test('a bookmarked quiz can be reopened from its badge, history and home with a fresh attempt', async ({ page, context }) => {
  const href = '/course/third-ball/quiz';
  await page.goto(href);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const position = page.getByRole('group', { name: 'Current course position' });
  const phase = page.getByRole('button', { name: 'Hold a third ball' });
  const first = page.getByRole('radio', { name: 'Index and middle' });
  const check = page.getByRole('button', { name: 'Submit', exact: true });
  const home = page.getByRole('link', { name: 'Course home' });
  const resume = page.getByRole('link', { name: 'Resume course' });
  await expect(position).toContainText('Phase 3 · Hold a third ball');
  await expect(position).toContainText('Quiz · Step 2 of 3');
  await first.check();
  await check.click();
  await page.getByRole('radio', { name: 'Ring and pinky' }).check();
  await check.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(home).toBeVisible();
  await expect(position).toBeVisible();
  await expect(phase).toHaveAttribute('aria-current', 'step');
  await expect(phase).toHaveAccessibleDescription('Quiz complete');
  await page.getByRole('button', { name: 'One ball', exact: true }).click();
  await expect(page.getByRole('group', { name: 'One ball steps' })).toBeVisible();
  await expect(position).toContainText('Phase 3 · Hold a third ball');
  await phase.click();
  await page.getByRole('link', { name: /Choose which ball to throw.*Current step/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(first).not.toBeChecked();
  await expect(check).toBeDisabled();
  await first.check();
  await home.click();
  await expect(resume).toHaveAttribute('href', href);
  await page.goBack();
  await expect(first).not.toBeChecked();
  await first.check();
  await page.goForward();
  await resume.click();
  await expect(first).not.toBeChecked();
  await expect(phase).toHaveAccessibleDescription('Quiz complete');

  const returning = await context.newPage();
  await returning.goto('/');
  await expect(returning.getByRole('link', { name: 'Resume course' })).toHaveAttribute('href', href);
  await returning.close();
});

test('uses a known course step when a saved address is invalid', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('learn-to-juggle.learner-name', 'Riley');
    localStorage.setItem('learn-to-juggle.badge.one-ball', '1');
    localStorage.setItem('learn-to-juggle.last-step', 'https://example.invalid/');
  });
  await page.goto('/');
  await expect(page.getByText('Welcome back, Riley!')).toBeVisible();
  const resume = page.getByRole('link', { name: 'Resume course' });
  await expect(resume).toHaveAttribute('href', '/course/two-ball/lesson');
  await resume.click();
  await expect(page.getByRole('button', { name: 'One ball', exact: true })).toHaveAccessibleDescription('Quiz complete');
  await expect(page.getByRole('button', { name: 'Continuous cascade', exact: true })).not.toHaveAttribute('data-complete');
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual([
    'learn-to-juggle.badge.one-ball', 'learn-to-juggle.last-step', 'learn-to-juggle.learner-name',
  ]);
});

test('returning to a lesson starts its cues and playback at the original frame', async ({ page }) => {
  await page.goto('/course/one-ball/lesson');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const scrubber = page.getByRole('slider', { name: 'Motion position' });
  const start = await scrubber.inputValue();
  const nextCue = page.getByRole('button', { name: /^Next cue,/ });
  await page.getByRole('button', { name: 'Next cue, Bend your elbows' }).click();
  await page.getByRole('button', { name: 'Next cue, Toss to eye level' }).click();
  await page.getByRole('button', { name: 'Next cue, Catch with the other hand' }).click();
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.getByRole('button', { name: 'Quiz', exact: true }).click();
  await expect(page).toHaveURL('/course/one-ball/quiz');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Before you toss' })).toBeVisible();
  await expect(nextCue).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quiz', exact: true })).toBeDisabled();
  await expect(scrubber).toHaveValue(start);
});

test('choosing a step updates its URL and preserves browser history', async ({ page }) => {
  await page.goto('/course/one-ball/lesson');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Back', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Course home' })).toHaveAttribute('href', '/');
  await page.getByRole('button', { name: 'Two-ball exchange' }).click();
  const quiz = page.getByRole('link', { name: /Quiz.*Second throw/ });
  await expect(quiz).toHaveAttribute('href', '/course/two-ball/quiz');
  await expect(page).toHaveURL('/course/one-ball/lesson');
  await expect(page.getByRole('heading', { name: 'How to toss' })).toBeVisible();

  await quiz.click();
  await expect(page).toHaveURL('/course/two-ball/quiz');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleDescription('Quiz · Step 2 of 3');
  await page.goBack();
  await expect(page).toHaveURL('/course/one-ball/lesson');
  await page.goForward();
  await expect(page).toHaveURL('/course/two-ball/quiz');
  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL('/course/two-ball/lesson');
});

test('the grip quiz precedes practice and keeps its completion on retry', async ({ page }) => {
  await page.goto('/course/third-ball/quiz');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const phase = page.getByRole('button', { name: 'Hold a third ball' });
  const check = page.getByRole('button', { name: 'Submit' });
  await expect(phase).not.toHaveAccessibleDescription('Quiz complete');
  await page.getByRole('radio', { name: 'Index and middle' }).check();
  await check.click();
  await expect(phase).not.toHaveAccessibleDescription('Quiz complete');
  await page.getByRole('radio', { name: 'Ring and pinky' }).check();
  await check.click();
  await page.getByRole('button', { name: 'Retry quiz' }).click();
  await expect(phase).toHaveAccessibleDescription('Quiz complete');
  await page.reload();
  await expect(phase).toHaveAccessibleDescription('Quiz complete');
  await page.getByRole('radio', { name: 'Index and middle' }).check();
  await check.click();
  await page.getByRole('radio', { name: 'Ring and pinky' }).check();
  await check.click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page).toHaveURL('/course/third-ball/practice');
});

test('a saved final quiz link opens the final practice', async ({ page }) => {
  await page.goto('/course/cascade/quiz');
  await expect(page).toHaveURL('/course/cascade/practice');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleDescription('Practice · Step 1 of 1');
});
