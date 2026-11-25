import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import NotFound from '@/app/not-found';

const meta = { title: 'Review/Unavailable step', component: NotFound } satisfies Meta<typeof NotFound>;
export default meta;
export const Recovery: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Step not found' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Go to the introduction' })).toHaveAttribute('href', '/');
  },
};
