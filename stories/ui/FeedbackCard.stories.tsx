import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, within } from 'storybook/test';
import { FeedbackCard } from '@/ui/feedback';
import { ForwardLabel, Stack } from '@/ui/primitives';

const meta = {
  parameters: { layout: 'padded' },
  title: 'Molecules/Feedback card', component: FeedbackCard,
  args: { title: 'Starting posture', children: 'Let your upper arms hang beside you. Face your palms up.', tone: 'info', onDismiss: fn() },
  argTypes: { tone: { control: 'radio', options: ['info','error','success'] } },
} satisfies Meta<typeof FeedbackCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Instruction: Story = {};
export const ArcTooLow: Story = { args: { title: 'Arc too low', children: 'Raise the peak toward eye level.', tone: 'error' } };
export const TooWide: Story = { args: { title: 'Hands too wide', children: 'Bring your palms under your shoulders.', tone: 'error' } };
export const Success: Story = { args: { title: 'Ready to practice', children: 'Try the same toss with one ball.', tone: 'success', actionLabel: <ForwardLabel>Practice</ForwardLabel> } };

export const Outcomes: Story = {
  name: 'Compare outcomes',
  render: () => (
    <Stack>
      <FeedbackCard title="Starting position">Turn your palms up at waist height.</FeedbackCard>
      <FeedbackCard title="Arc too low" tone="error">Raise the peak toward eye level.</FeedbackCard>
      <FeedbackCard title="At eye level" tone="success">The ball is reaching the intended peak.</FeedbackCard>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const error = canvas.getByRole('region', { name: 'Arc too low' });
    const success = canvas.getByRole('region', { name: 'At eye level' });
    const info = canvas.getByRole('region', { name: 'Starting position' });
    await expect(error).toHaveAccessibleDescription('Correction');
    await expect(success).toHaveAccessibleDescription('Success');
    await expect(new Set([error, success, info].map(card => getComputedStyle(card).backgroundColor)).size).toBe(3);
    await expect(getComputedStyle(error).borderColor).not.toBe(getComputedStyle(success).borderColor);

    const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const card of [success, error]) {
      const parts = Array.from(card.querySelectorAll('svg path'));
      await expect(parts).toHaveLength(2);
      for (const part of parts) {
        await expect(getComputedStyle(part).animationName).toBe(motionAllowed ? 'ui-draw' : 'none');
      }
    }
  },
};
