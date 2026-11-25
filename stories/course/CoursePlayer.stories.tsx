import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CoursePreview } from '../fixtures/CoursePreview';

const meta = {
  title: 'Review/Course navigation',
  component: CoursePreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CoursePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JumpToALesson: Story = {
  args: { initialStep: 'guide' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const dock = c.getByRole('navigation', { name: 'Course phases' });
    const nav = within(dock);
    await expect(c.getByRole('link', { name: 'Course home' })).toHaveAttribute('href', '/');
    await expect(c.queryByRole('link', { name: 'Back' })).not.toBeInTheDocument();
    const { y, width, height } = dock.getBoundingClientRect();
    const exchange = nav.getByRole('button', { name: 'Two-ball exchange' });
    await userEvent.click(exchange);
    const picker = c.getByRole('group', { name: 'Two-ball exchange steps' });
    await expect(c.getByRole('heading', { name: 'How to toss' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'One ball' })).toHaveAttribute('aria-current', 'step');
    const links = within(picker).getAllByRole('link');
    await expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/course/two-ball/lesson', '/course/two-ball/quiz', '/course/two-ball/practice',
    ]);
    await expect(links[0]).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(exchange).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(c.getByRole('link', { name: /Quiz.*Second throw/ }));
    const heading = c.getByRole('heading', { level: 1 });
    await expect(heading).toHaveFocus();
    await expect(heading).toHaveAccessibleDescription('Quiz · Step 2 of 3');
    await expect(c.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/course/two-ball/lesson');
    await expect(dock.getBoundingClientRect()).toMatchObject({ y, height });
    await expect(dock.getBoundingClientRect().width).toBe(width);
  },
};

export const LessonThenQuiz: Story = {
  args: { initialStep: 'guide' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
    await userEvent.click(c.getByRole('button', { name: /Next cue, Bend your elbows/ }));
    await userEvent.click(c.getByRole('button', { name: /Next cue, Toss to eye level/ }));
    await userEvent.click(await c.findByRole('button', { name: /Next cue, Catch with the other hand/ }, { timeout: 6000 }));
    await userEvent.click(await c.findByRole('button', { name: 'Got it' }, { timeout: 6000 }));
    await userEvent.click(c.getByRole('button', { name: 'Quiz' }));
    await expect(c.getByRole('heading', { level: 1 })).toHaveAccessibleDescription('Quiz · Step 2 of 3');
    await userEvent.click(c.getByRole('link', { name: 'Back' }));
    await expect(c.getByRole('heading', { name: 'How to toss' })).toHaveFocus();
    await expect(c.getByText('Cue 1 of 4')).toBeVisible();
  },
};
