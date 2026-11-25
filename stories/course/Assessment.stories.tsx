import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { RELEASE_EVENTS } from '@/scene/motion';
import { throwQuizCopy } from '@/lessons/curriculum';
import { CoursePreview } from '../fixtures/CoursePreview';

const meta = {
  title: 'Review/Assessments',
  component: CoursePreview,
  parameters: { layout: 'fullscreen' },
  args: { initialStep: 'timing', saveCompletion: fn() },
} satisfies Meta<typeof CoursePreview>;
export default meta;
type Story = StoryObj<typeof meta>;

async function chooseThrow(canvasElement: HTMLElement, throwNumber: 2 | 3) {
  await canvasElement.ownerDocument.fonts.ready;
  const c = within(canvasElement);
  const check = c.getByRole('button', { name: 'Submit' });
  const copy = throwQuizCopy[throwNumber];
  await expect(c.getByText('Part 1 of 2')).toBeVisible();
  await expect(c.getByText(copy.arcInstruction)).toBeVisible();
  const stage = canvasElement.querySelector('.lesson-window')!;
  const stageLayout = () => [stage, stage.querySelector('use[href$="-body"]')!]
    .map(element => element.getBoundingClientRect().toJSON());
  const layout = stageLayout();
  await expect(stage.querySelectorAll('[data-ball]')).toHaveLength(throwNumber);
  await expect(c.queryByRole('radio')).toBeNull();
  const peak = c.getByRole('slider', { name: 'Arc peak' });
  await userEvent.click(check);
  await expect(c.getByRole('region', { name: 'Arc too low' })).toBeVisible();
  await expect(stageLayout()).toEqual(layout);
  await userEvent.keyboard('{Escape}');
  const preference = c.getByRole('checkbox', { name: 'Use arrow buttons' }) as HTMLInputElement;
  if (!preference.checked) await userEvent.click(preference);
  await expect(c.getByRole('button', { name: 'Higher' })).toBeVisible();
  peak.focus();
  await userEvent.keyboard('{PageUp}{PageUp}{ArrowUp}{ArrowUp}');
  await expect(peak).toHaveAttribute('aria-valuetext', expect.stringContaining('At eye level'));
  await userEvent.click(check);
  const slider = c.getByRole('slider', { name: copy.timingLabel });
  await waitFor(() => expect(slider).toHaveFocus());
  await expect(c.getByText('Part 2 of 2')).toBeVisible();
  await expect(c.getByText(copy.timingInstruction)).toBeVisible();
  await expect(stageLayout()).toEqual(layout);

  // All four releases can be explored before each submission. Neither the
  // drawing nor the live announcement grades the selection during Preview.
  for (const event of ['justReleased', 'apex', 'nearCatch', 'descending'] as const) {
    const frame = RELEASE_EVENTS.findIndex(option => option.id === event);
    fireEvent.change(slider, { target: { value: String(frame) } });
    const ball = stage.querySelectorAll('[data-ball]')[throwNumber - 1];
    const before = ball.getAttribute('transform');
    await userEvent.click(c.getByRole('button', { name: 'Preview' }));
    await c.findByRole('button', { name: 'Replay' }, { timeout: 5000 });
    await expect(ball.getAttribute('transform')).not.toBe(before);
    await expect(stage.querySelector('[data-encounter], [data-correction-feature]')).toBeNull();
    await expect(c.getByRole('status')).toHaveTextContent('Preview finished.');
    await expect(c.getByRole('status')).not.toHaveTextContent(/collision|collide|passes above/i);
    await expect(c.queryByRole('dialog')).toBeNull();
    await expect(stageLayout()).toEqual(layout);
    await userEvent.click(check);
    if (event !== 'descending') {
      const correction = c.getByRole('region', { name: event === 'nearCatch' ? 'Too late' : 'Too early' });
      await expect(correction).toHaveTextContent(event === 'justReleased' ? copy.collision : event === 'apex' ? copy.early : copy.late);
      if (event === 'justReleased') await expect(stage.querySelector('[data-encounter="contact"]')).toBeVisible();
      else await expect(stage.querySelector('[data-encounter]')).toBeNull();
      await expect(stageLayout()).toEqual(layout);
      await userEvent.keyboard('{Escape}');
      await expect(slider).toHaveFocus();
      await expect(stage.querySelector('[data-correction-feature], [data-encounter]')).toBeNull();
    }
  }
  await expect(c.getByRole('dialog', { name: 'Quiz complete' })).toBeVisible();
  await expect(stage.querySelector('[data-encounter="clear"]')).toBeInTheDocument();
  if (throwNumber === 2) {
    await userEvent.click(c.getByRole('button', { name: 'Dismiss' }));
    await expect(c.getByRole('button', { name: 'Practice' })).toBeVisible();
    await expect(stageLayout()).toEqual(layout);
    return;
  }
  await userEvent.click(c.getByRole('button', { name: 'Retry quiz' }));
  await expect(c.getByRole('slider', { name: 'Arc peak' })).toHaveAttribute('aria-valuetext', expect.stringContaining('Below eye level'));
  await expect(c.getByText('Part 1 of 2')).toBeVisible();
  await expect(stage.querySelector('[data-encounter], [data-correction-feature]')).toBeNull();
}

export const SecondThrow: Story = {
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement, args }) => {
    await chooseThrow(canvasElement, 2);
    await expect(args.saveCompletion).toHaveBeenCalledWith('two-ball');
  },
};

export const ThirdThrow: Story = {
  args: { initialStep: 'three-throws-quiz' },
  play: async ({ canvasElement, args }) => {
    await chooseThrow(canvasElement, 3);
    await expect(args.saveCompletion).toHaveBeenCalledWith('first-three');
  },
};

export const GripAndCatch: Story = {
  args: { initialStep: 'third-ball-quiz' },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const check = c.getByRole('button', { name: 'Submit' });
    const select = (pair: string) => userEvent.click(c.getByRole('radio', { name: pair }));
    await expect(check).toBeDisabled();
    await select('Ring and pinky');
    await userEvent.click(check);
    await expect(c.getByRole('region', { name: 'Look at your grip' })).toBeVisible();
    await expect(canvasElement.querySelector('[data-correction-anchor="ball"]')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await select('Index and middle');
    await userEvent.click(check);
    await expect(args.saveCompletion).not.toHaveBeenCalled();
    await select('Ring and pinky');
    await userEvent.click(check);
    await expect(c.getByRole('dialog', { name: 'Quiz complete' })).toBeVisible();
    await expect(args.saveCompletion).toHaveBeenCalledWith('spare');
    await userEvent.click(c.getByRole('button', { name: 'Retry quiz' }));
    await expect(check).toBeDisabled();
  },
};

export const CountTheCatch: Story = {
  args: { initialStep: 'six-throws-quiz' },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const check = c.getByRole('button', { name: 'Submit' });
    const slider = c.getByRole('slider', { name: 'Choose a frame' });
    fireEvent.change(slider, { target: { value: '2' } });
    await userEvent.click(check);
    await expect(c.getByRole('region', { name: 'Watch the third catch' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    fireEvent.change(slider, { target: { value: '4' } });
    await userEvent.click(check);
    await expect(c.getByText(/You caught the third ball in an earlier frame/)).toBeVisible();
    await userEvent.keyboard('{Escape}');
    fireEvent.change(slider, { target: { value: '3' } });
    await userEvent.click(check);
    await expect(args.saveCompletion).toHaveBeenCalledWith('rotation');
    await userEvent.click(c.getByRole('button', { name: 'Retry quiz' }));
    await expect(slider).toHaveValue('0');
  },
};
