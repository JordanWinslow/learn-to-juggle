import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CourseIntro } from '@/welcome/CourseIntro';
import { CourseFinish } from '@/welcome/CourseFinish';
import { NameEntry } from '@/welcome/NameEntry';
import { WelcomeLayout } from '@/welcome/WelcomeLayout';
import { badgeStorageKey } from '@/lessons/course-progress';
import { seedProgress } from '../fixtures/learner-progress';

const meta = { title: 'Review/Course introduction', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;

export const Welcome: StoryObj = { render: () => <WelcomeLayout><CourseIntro /></WelcomeLayout> };
export const ReturningLearner: StoryObj = {
  beforeEach: () => seedProgress('learn-to-juggle.last-step', '/course/two-ball/quiz'),
  render: () => <WelcomeLayout><CourseIntro /></WelcomeLayout>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('link', { name: 'Resume course' })).toHaveAttribute('href', '/course/two-ball/quiz');
    await expect(canvas.getByText(/Second throw/)).toBeVisible();
  },
};
export const ReadAboutJuggling: StoryObj = {
  render: () => <WelcomeLayout><CourseIntro /></WelcomeLayout>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const research = canvas.getByText('Benefits of juggling');
    await userEvent.click(research);
    await expect(canvas.getByRole('link', { name: 'Read the brain scan study' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Begin' })).toHaveAttribute('href', '/start');
  },
};
export const MeetYourInstructor: StoryObj = {
  render: () => <WelcomeLayout><NameEntry /></WelcomeLayout>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole('textbox', { name: 'Your name or nickname' });
    await userEvent.clear(name);
    await userEvent.type(name, ' ');
    const start = canvas.getByRole('button', { name: 'Start my first lesson' });
    await expect(start).toBeDisabled();
    await userEvent.type(name, 'Riley');
    await expect(start).toBeEnabled();
  },
};
export const CourseReview: StoryObj = { render: () => <CourseFinish /> };

export const CompletedCourse: StoryObj = {
  beforeEach: () => seedProgress(badgeStorageKey('continuous'), '1'),
  render: () => <CourseFinish />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('heading', { name: 'You know how to juggle!' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Share course' })).toBeEnabled();
  },
};
