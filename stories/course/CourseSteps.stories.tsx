import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { CoursePreview } from '../fixtures/CoursePreview';
import { COURSE_STEPS, STEP_LABEL, getCourseStep, type CourseStep } from '@/lessons/curriculum';

const meta = {
  title: 'Review/Every course step',
  component: CoursePreview,
  parameters: { layout: 'fullscreen' },
  argTypes: { initialStep: { control: 'select', options: COURSE_STEPS.map(step => step.id) } },
  play: async ({ canvasElement, args }) => {
    const step = getCourseStep(args.initialStep ?? 'guide');
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: step.title })).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveAccessibleDescription(
      `${STEP_LABEL[step.kind]} · Step ${step.stepIndex + 1} of ${step.phase.steps.length}`,
    );
    await expect(canvas.getByRole('navigation', { name: 'Course phases' })).toBeVisible();
  },
} satisfies Meta<typeof CoursePreview>;
export default meta;
type Story = StoryObj<typeof meta>;

function step(id: CourseStep): Story {
  const location = getCourseStep(id);
  return {
    name: `${location.phaseIndex + 1}.${location.stepIndex + 1} · ${location.phase.name} · ${STEP_LABEL[location.kind]}`,
    args: { initialStep: id },
    parameters: { docs: { description: { story: `App route: ${location.href}` } } },
  };
}

export const OneBallLesson = step('guide');
export const OneBallQuiz = step('geometry');
export const OneBallPractice = step('practice');
export const TwoBallLesson = step('exchange');
export const TwoBallQuiz = step('timing');
export const TwoBallPractice = step('exchange-practice');
export const ThirdBallLesson = step('third-ball-lesson');
export const ThirdBallQuiz = step('third-ball-quiz');
export const ThirdBallPractice = step('third-ball-practice');
export const ThreeThrowsLesson = step('three-throws-lesson');
export const ThreeThrowsQuiz = step('three-throws-quiz');
export const ThreeThrowsPractice = step('three-throws-practice');
export const SixThrowsLesson = step('six-throws-lesson');
export const SixThrowsQuiz = step('six-throws-quiz');
export const SixThrowsPractice = step('six-throws-practice');
export const ContinuousPractice = step('cascade-practice');
