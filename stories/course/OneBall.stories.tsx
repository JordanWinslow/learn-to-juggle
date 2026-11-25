import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CoursePreview } from '../fixtures/CoursePreview';

const meta = {
  title: 'Review/One ball',
  component: CoursePreview,
  parameters: { layout: 'fullscreen' },
  args: { initialStep: 'geometry' },
  argTypes: {
    initialStep: { control: 'select', options: ['guide', 'practice', 'geometry'] },
  },
} satisfies Meta<typeof CoursePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Geometry: Story = {};
async function submitToss(canvas: HTMLElement, position?: 'close and high' | 'shoulder width and eye level') {
  const c = within(canvas);
  await userEvent.click(c.getByRole('button', { name: 'Got it' }));
  if (position) {
    c.getByRole('slider', { name: /Hand spacing.*left hand/ }).focus();
    await userEvent.keyboard(position === 'close and high' ? '{ArrowLeft>22/}' : '{ArrowLeft>16/}');
    c.getByRole('slider', { name: 'Arc peak' }).focus();
    await userEvent.keyboard(position === 'close and high' ? '{ArrowUp>14/}' : '{ArrowUp>10/}');
  }
  await userEvent.click(c.getByRole('button', { name: 'Submit' }));
}

export const TwoCorrections: Story = {
  name: 'Wide hands, low arc',
  play: ({ canvasElement }) => submitToss(canvasElement),
};
export const OppositeCorrections: Story = {
  name: 'Close hands, high arc',
  play: ({ canvasElement }) => submitToss(canvasElement, 'close and high'),
};
export const Accepted: Story = {
  name: 'Accepted geometry',
  play: ({ canvasElement }) => submitToss(canvasElement, 'shoulder width and eye level'),
};
export const Guided: Story = { name: 'Guided toss', args: { initialStep: 'guide' } };
export const Practice: Story = { args: { initialStep: 'practice' } };

// Judge the live elements the learner is watching, including the projected sprite.
function stageLayout(canvas: HTMLElement) {
  const selectors = ['.lesson-window', '.lesson-picture', '.sprite-scene', '.sprite-scene use[href$="-body"]',
    '.lesson-controls', '.ui-transport', '.lesson-frame-picker input', '.lesson-adjustments > button'];
  return selectors.map(selector => {
    const rect = canvas.querySelector(selector)?.getBoundingClientRect();
    return rect && [rect.x, rect.y, rect.width, rect.height];
  });
}

export const StableNotes: Story = {
  name: 'Test · stable practice note',
  args: { initialStep: 'practice' },
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const c = within(canvasElement);
    const layout = stageLayout(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Start practice' }));
    await expect(stageLayout(canvasElement)).toEqual(layout);
    await userEvent.click(within(canvasElement.querySelector('.ui-stage-note') as HTMLElement).getByRole('button', { name: 'One ball' }));
    await expect(c.getByRole('region', { name: 'One ball' })).toBeVisible();
    await expect(stageLayout(canvasElement)).toEqual(layout);
  },
};

export const MobileHandControls: Story = {
  name: 'Test · hand controls clear the note on a small phone',
  globals: { viewport: { value: 'mobile1' } },
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const c = within(canvasElement);
    const arrows = c.getByRole('checkbox', { name: 'Use arrow buttons' }) as HTMLInputElement;
    const usingButtons = arrows.checked;
    if (usingButtons) await userEvent.click(arrows);
    try {
      await userEvent.click(c.getByRole('button', { name: 'Got it' }));
      const note = c.getByRole('button', { name: 'Adjust the toss' });
      const peak = c.getByRole('slider', { name: 'Arc peak' });
      peak.focus();
      await userEvent.keyboard('{Home}'); // The hand controls sit lowest under a flat arc.
      await waitFor(() => {
        const noteBox = note.getBoundingClientRect();
        for (const handle of c.getAllByRole('slider', { name: /Hand spacing/ })) {
          const box = handle.getBoundingClientRect();
          const gap = Math.max(noteBox.top - box.bottom, box.left - noteBox.right);
          expect(gap).toBeGreaterThan(0);
        }
      });
    } finally {
      if (usingButtons) await userEvent.click(arrows);
    }
  },
};

export const LessonComplete: Story = {
  name: 'Practice complete',
  args: { initialStep: 'practice' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Start practice' }));
    await userEvent.click(c.getByRole('button', { name: 'I did it!' }));
    await expect(c.getByRole('dialog', { name: 'Practice complete' })).toBeVisible();
  },
};

export const ReadCueAgain: Story = {
  name: 'Test · reread a cue',
  args: { initialStep: 'guide' },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const next = c.getByRole('button', { name: 'Quiz' });
    await expect(c.getByRole('img', { name: 'Side posture' })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Side' })).toHaveAttribute('aria-pressed', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(c.queryByRole('button', { name: 'Got it' })).toBeNull();
    c.getByRole('button', { name: /Next cue/ }).focus();
    await userEvent.keyboard('{Escape}');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(c.getByRole('button', { name: 'Lesson notes' }));
    await expect(c.getByRole('button', { name: /Next cue/ })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await c.findByText('Cue 2 of 4');
    await expect(c.getByRole('button', { name: 'Side' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{Enter}');
    await c.findByText('Cue 3 of 4');
    await expect(c.getByRole('button', { name: 'Front' })).toHaveAttribute('aria-pressed', 'true');
    await expect(c.queryByRole('button', { name: 'Got it' })).toBeNull();
    await userEvent.keyboard('{Enter}');
    await c.findByText('Cue 4 of 4');
    await expect(c.getByRole('button', { name: 'Got it' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(c.getByRole('button', { name: 'Review cues' })).toHaveFocus();
    const reduced = canvasElement.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)').matches;
    await expect(c.getByRole('button', { name: reduced ? 'Play' : 'Pause' })).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await c.findByText('Cue 1 of 4');
    await expect(c.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Quiz' })).toBeEnabled();
    await userEvent.click(c.getByRole('button', { name: 'Quiz' }));
    await expect(c.getByRole('heading', { name: 'Hand spacing and arc' })).toBeVisible();
    await expect(c.getByRole('heading', { name: 'Hand spacing and arc' })).toHaveFocus();
  },
};

export const LiveGeometry: Story = {
  name: 'Test · adjust while playing',
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const buttons = c.getByRole('checkbox', { name: 'Use arrow buttons' }) as HTMLInputElement;
    const previousPreference = buttons.checked;
    if (previousPreference) await userEvent.click(buttons);
    try {
      await expect(c.queryByRole('button', { name: 'Higher' })).toBeNull();
      await userEvent.click(c.getByRole('button', { name: 'Play' }));
      const peak = c.getByRole('slider', { name: 'Arc peak' });
      const before = peak.getAttribute('aria-valuenow');
      peak.focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(peak.getAttribute('aria-valuenow')).not.toBe(before);
      await userEvent.click(c.getByRole('button', { name: 'Side' }));
      await expect(c.getByRole('slider', { name: 'Arc peak' })).toHaveAttribute('aria-valuenow', peak.getAttribute('aria-valuenow'));
      const hand = c.getByRole('slider', { name: /Hand spacing.*left hand/ });
      const spacing = hand.getAttribute('aria-valuenow');
      hand.focus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(hand.getAttribute('aria-valuenow')).not.toBe(spacing);
      const timeline = c.getByRole('slider', { name: 'Motion position' }) as HTMLInputElement;
      const phase = timeline.value;
      await waitFor(() => expect(timeline.value).not.toBe(phase));
      await userEvent.click(c.getByRole('button', { name: 'Pause' }));
    } finally {
      if (previousPreference) await userEvent.click(buttons);
    }
  },
};

export const RetryInteraction: Story = {
  name: 'Test · geometry retry',
  args: { saveCompletion: fn() },
  play: async ({ canvasElement, args }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const c = within(canvasElement);
    const layout = stageLayout(canvasElement);
    const click = (name: string) => userEvent.click(c.getByRole('button', { name }));
    await click('Submit');
    await expect(c.getByText('Hands too wide')).toBeVisible();
    await expect(c.getByRole('button', {name:'Submit'})).toBeVisible();
    await expect(stageLayout(canvasElement)).toEqual(layout);
    await userEvent.click(c.getAllByRole('button', {name:'Got it'})[0]);
    await expect(c.getByText('Arc too low')).toBeVisible();
    await click('Got it');
    await expect(stageLayout(canvasElement)).toEqual(layout);
    const buttons = c.getByRole('checkbox', { name: 'Use arrow buttons' }) as HTMLInputElement;
    const previousPreference = buttons.checked;
    if (!previousPreference) await userEvent.click(buttons);
    const directPeak = c.getByRole('slider', { name: 'Arc peak' });
    directPeak.focus();
    const originalHeight = directPeak.getAttribute('aria-valuenow');
    await userEvent.keyboard('{ArrowUp}');
    await expect(directPeak.getAttribute('aria-valuenow')).not.toBe(originalHeight);
    await userEvent.keyboard('{ArrowDown}');
    await click('Play');
    for (let i = 0; i < 16; i++) await click('Closer');
    for (let i = 0; i < 10; i++) await click('Higher');
    await expect(c.getByRole('button', { name: 'Pause' })).toBeVisible();
    if (!previousPreference) await userEvent.click(buttons);
    await click('Submit');
    await expect(c.getByText('Quiz complete')).toBeVisible();
    await expect(args.saveCompletion).toHaveBeenCalledWith('one-ball');
    await userEvent.click(within(c.getByRole('dialog', { name: 'Quiz complete' })).getByRole('button', { name: 'Practice' }));
    await expect(c.getByRole('heading', { name: 'Practice 50 tosses' })).toBeVisible();
  },
};
