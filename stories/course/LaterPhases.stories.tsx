import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CoursePreview } from '../fixtures/CoursePreview';

const meta = {
  title: 'Review/Three-ball lessons',
  component: CoursePreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CoursePreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HoldTheThirdBall: Story = {
  args: { initialStep: 'third-ball-lesson' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.queryByRole('button', { name: 'Got it' })).toBeNull();
    await expect(c.getByRole('img', { name: /Two balls in one hand/ })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Play' })).toBeVisible();
    await userEvent.click(c.getByRole('button', { name: /Next cue/ }));
    await c.findByText('Cue 2 of 3', {}, { timeout: 4000 });
    await expect(canvasElement.querySelectorAll('[data-ball]')).toHaveLength(3);
    await expect(canvasElement.querySelector('[data-cue-target="first-ball"]')).toBeInTheDocument();
  },
};

export const OneCascade: Story = {
  args: { initialStep: 'three-throws-practice' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByLabelText('Cascades in the demonstration')).toHaveTextContent('/ 1');
  },
};

export const LinkTwoThenThree: Story = {
  args: { initialStep: 'six-throws-practice' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByLabelText('Cascades in the demonstration')).toHaveTextContent('/ 2');
    await userEvent.click(c.getByRole('button', { name: 'Start practice' }));
    await userEvent.click(c.getByRole('button', { name: 'I did it!' }));
    await userEvent.click(within(c.getByRole('dialog')).getByRole('button', { name: 'Practice three cascades' }));
    await expect(c.getByLabelText('Cascades in the demonstration')).toHaveTextContent('/ 3');
    await expect(c.getByRole('heading', { name: 'Three cascades' })).toBeVisible();
  },
};

export const FinalPractice: Story = {
  args: { initialStep: 'cascade-practice', saveCompletion: fn() },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(c.getByRole('heading', { level: 1 })).toHaveAccessibleDescription('Practice · Step 1 of 1');
    await userEvent.click(c.getByRole('button', { name: 'Start practice' }));
    await expect(args.saveCompletion).not.toHaveBeenCalled();
    await userEvent.click(c.getByRole('button', { name: 'I made 50 throws' }));
    await expect(args.saveCompletion).toHaveBeenCalledWith('continuous');
    await expect(within(c.getByRole('dialog')).getByRole('button', { name: 'Finish course' })).toBeVisible();
  },
};
