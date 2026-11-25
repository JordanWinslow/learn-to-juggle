import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { CourseLogo } from '@/ui/course-logo';

const meta = { title: 'Atoms/Course logo', component: CourseLogo, parameters: { layout: 'padded' } } satisfies Meta<typeof CourseLogo>;
export default meta;
export const HomeLink: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Course home' });
    await expect(link).toHaveAttribute('href', '/');
    link.focus();
    await expect(link).toHaveFocus();
  },
};
