import { expect, test } from 'playwright/test';

test('Begin preserves the instructor, playback and reading position', async ({ page }) => {
  await page.goto('/');
  const coach = page.locator('figure');
  const heading = page.getByRole('heading', { level: 1 });
  await page.evaluate(() => document.fonts.ready);
  const coachBox = await coach.boundingBox();
  const titleBox = await heading.boundingBox();
  const actionBox = await page.getByRole('link', { name: 'Begin' }).boundingBox();
  const originalCoach = await coach.elementHandle();
  // The suite starts in reduced motion. Explicit playback must survive navigation too.
  await page.getByRole('button', { name: 'Play demonstration' }).click();
  await page.getByRole('link', { name: 'Begin' }).click();
  await expect(heading).toHaveText('What should I call you?');
  await expect(page.getByRole('button', { name: 'Pause demonstration' })).toBeVisible();
  expect(await originalCoach!.evaluate(el => el.isConnected)).toBe(true);
  expect(await coach.boundingBox()).toEqual(coachBox);
  expect(await page.getByRole('button', { name: 'Start my first lesson' }).boundingBox()).toEqual(actionBox);
  expect(await heading.boundingBox()).toMatchObject({ x: titleBox!.x, y: titleBox!.y });
  await page.getByRole('button', { name: 'Pause demonstration' }).click();
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Begin' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play demonstration' })).toBeVisible();
});

test('an ordinary practice and an earlier quiz badge leave the final goal open', async ({ page }) => {
  await page.goto('/course/third-ball/practice');
  const badge = page.getByRole('button', { name: 'Hold a third ball', exact: true });
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.getByRole('button', { name: 'I did it!' }).click();
  await expect(page.getByRole('dialog', { name: 'Practice complete' })).toBeVisible();
  await expect(badge).not.toHaveAttribute('data-complete');

  await page.getByRole('link', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL('/course/third-ball/quiz');
  const submit = page.getByRole('button', { name: 'Submit', exact: true });
  await page.getByRole('radio', { name: 'Index and middle' }).check();
  await submit.click();
  await page.getByRole('radio', { name: 'Ring and pinky' }).check();
  await submit.click();
  await expect(badge).toHaveAccessibleDescription('Quiz complete');

  await page.goto('/complete');
  await expect(page.getByRole('heading', { name: 'Your juggling practice' })).toBeVisible();
  await page.getByRole('link', { name: 'Go to final practice' }).click();
  await expect(page).toHaveURL('/course/cascade/practice');
  await expect(page.getByRole('heading', { name: 'Practice 50 throws' })).toBeVisible();
});

test('finishing 50 throws allows sharing the course and starting over', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      value: async (data: ShareData) => { document.documentElement.dataset.sharedUrl = data.url; },
    });
  });
  await page.goto('/start');
  await page.getByRole('textbox', { name: 'Your name or nickname' }).fill('Riley');
  await page.getByRole('button', { name: 'Start my first lesson' }).click();
  await expect(page).toHaveURL('/course/one-ball/lesson');
  await expect(page.getByText(/Hey, Riley!/)).toBeVisible();
  await page.goto('/course/cascade/practice');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.getByRole('button', { name: 'I made 50 throws' }).click();
  await page.getByRole('button', { name: 'Finish course' }).click();
  await expect(page).toHaveURL('/complete');
  await expect(page.getByText('Congratulations, Riley!', { exact: false })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Jordan winks and gives a thumbs-up.' })).toBeVisible();
  await page.getByRole('button', { name: 'Share course' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shared-url', new URL('/', page.url()).href);
  await page.getByRole('button', { name: 'Retry course' }).click();
  await expect(page).toHaveURL('/course/one-ball/lesson');
  await expect(page.getByText(/Hey, Riley!/)).toBeVisible();
  await page.goto('/complete');
  await expect(page.getByRole('heading', { name: 'Your juggling practice' })).toBeVisible();
});
