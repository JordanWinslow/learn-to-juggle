import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { CoursePreview } from '../fixtures/CoursePreview';
import { EXCHANGE_PHASES } from '@/scene';

const meta = {
  title: 'Review/Two-ball exchange',
  component: CoursePreview,
  parameters: { layout: 'fullscreen' },
  args: { initialStep: 'exchange' },
} satisfies Meta<typeof CoursePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guided: Story = {};
export const TimingQuiz: Story = { args: { initialStep: 'timing' } };

export const CueDuringPlayback: Story = {
  name: 'Test · pause on the release cue',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const timeline = canvas.getByRole('slider', { name: 'Motion position' }) as HTMLInputElement;
    await expect(timeline).toHaveValue('0');
    await userEvent.click(canvas.getByRole('button', { name: 'Play' }));
    await waitFor(() => expect(Number(timeline.value)).toBeGreaterThan(0));
    await expect(canvas.getByRole('heading', { name: 'One ball in each hand' })).toBeVisible();
    const stage = canvasElement.querySelector('.lesson-window')!.getBoundingClientRect();
    const picture = canvasElement.querySelector('.lesson-picture')!.getBoundingClientRect();
    await expect(picture.x + picture.width / 2).toBeCloseTo(stage.x + stage.width / 2, 0);
    await userEvent.click(canvas.getByRole('button', { name: 'Next cue, When to throw' }));
    await canvas.findByText('Cue 2 of 5', {}, { timeout: 5000 });
    await expect(canvas.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(canvasElement.querySelector('[data-cue-target="first-ball"] circle')).toBeInTheDocument();
    await expect(timeline).toHaveValue(String(Math.round(EXCHANGE_PHASES.secondRelease * 1000)));
    await expect(canvas.queryByRole('button', { name: 'Got it' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Quiz' })).toHaveAttribute('aria-disabled', 'true');
    await expect(canvasElement.querySelector('.lesson-picture')!.getBoundingClientRect()).toEqual(picture);
  },
};

function expectBothBallsClear(canvas: HTMLElement) {
  const cue = canvas.querySelector('.ui-note-card')!.getBoundingClientRect();
  const balls = canvas.querySelectorAll('[data-ball]');
  expect(balls).toHaveLength(2);
  for (const ball of balls) {
    const b = ball.getBoundingClientRect();
    expect(Math.max(cue.top - b.bottom, b.left - cue.right, cue.left - b.right, b.top - cue.bottom)).toBeGreaterThan(0);
  }
}

export const FollowTheExchange: Story = {
  name: 'Test · step through the exchange',
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole('button', { name: 'Quiz' })).toHaveAttribute('aria-disabled', 'true');
    await expect(c.getByRole('button', { name: 'Next cue, When to throw' })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(c.getByRole('heading', { name: 'One ball in each hand' })).toBeVisible();
    expectBothBallsClear(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Next cue, When to throw' }));
    await c.findByText('Cue 2 of 5', {}, { timeout: 5000 });
    await expect(canvasElement.querySelector('[data-cue-target="first-ball"]')).toBeInTheDocument();
    const timeline = c.getByRole('slider', { name: 'Motion position' });
    await expect(timeline).toHaveValue(String(Math.round(EXCHANGE_PHASES.secondRelease * 1000)));
    expectBothBallsClear(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Side' }));
    await expect(c.getByRole('img', { name: 'Side posture' })).toBeVisible();
    await userEvent.click(c.getByRole('button', { name: 'Next cue, Where to aim' }));
    await c.findByText('Cue 3 of 5', {}, { timeout: 5000 });
    await expect(canvasElement.querySelector('[data-cue-target="second-ball"]')).toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: 'Next cue, Catch both balls' }));
    await c.findByText('Cue 4 of 5', {}, { timeout: 5000 });
    await expect(timeline).toHaveValue(String(Math.round(EXCHANGE_PHASES.secondCatch * 1000)));
    expectBothBallsClear(canvasElement);
    await expect(c.queryByRole('button', { name: 'Got it' })).toBeNull();
    await userEvent.click(c.getByRole('button', { name: 'Next cue, If the balls collide' }));
    await c.findByText('Cue 5 of 5', {}, { timeout: 5000 });
    await expect(timeline).toHaveValue(String(Math.round(EXCHANGE_PHASES.secondRelease * 1000)));
    await userEvent.click(c.getByRole('button', { name: 'Got it' }));
    await userEvent.click(c.getByRole('button', { name: 'Quiz' }));
    await expect(c.getByRole('heading', { name: 'Second throw' })).toHaveFocus();
  },
};
