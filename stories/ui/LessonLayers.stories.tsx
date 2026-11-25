import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { NEUTRAL_APEX, SpriteScene } from '@/scene';
import { Button, ForwardLabel, Surface } from '@/ui/primitives';
import { LessonDialog, StageNote } from '@/ui/lesson-layers';
import { StageCorrection } from '@/ui/stage-correction';

const meta = { title: 'Molecules/Lesson layers', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function NoteExample() {
  return (
    <Surface className="relative mx-auto flex h-dvh max-h-[34rem] max-w-3xl flex-col">
      <div className="min-h-0 flex-1">
        <SpriteScene className="h-full!" spacing={0} apex={NEUTRAL_APEX} phase={0.18} />
      </div>
      <StageNote title="Eye level" triggerLabel="Lesson notes">
        Aim for eye level. Catch the ball in your other hand.
      </StageNote>
    </Surface>
  );
}

function DialogExample({ initiallyOpen = true }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <main className="ui-specimen">
      <Button onClick={() => setOpen(true)}>Show completion</Button>
      {open && (
        <LessonDialog title="Lesson complete" tone="success"
          onDismiss={() => setOpen(false)} onAction={() => setOpen(false)} actionLabel={<ForwardLabel>Next Lesson</ForwardLabel>}>
          You finished your one-ball practice.
        </LessonDialog>
      )}
    </main>
  );
}

export const StageInstruction: Story = { render: () => <NoteExample /> };
export const LessonComplete: Story = { render: () => <DialogExample /> };
function CorrectionExample() {
  const [open, setOpen] = useState(false);
  return (
    <main className="ui-specimen flex h-dvh flex-col gap-2">
      <Surface className="relative min-h-0 flex-1">
        <SpriteScene className="absolute inset-0 h-full!" spacing={0} apex={130} phase={0.18} correction={open ? 'apex' : undefined} />
        {open && <StageCorrection target="apex" title="Arc too low" onDismiss={() => setOpen(false)}>
          Raise the peak toward eye level.
        </StageCorrection>}
      </Surface>
      <Button className="self-start" onClick={() => setOpen(true)}>Submit</Button>
    </main>
  );
}

export const Correction: Story = {
  render: () => <CorrectionExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scene = canvas.getByRole('img', { name: 'Juggling coach' });
    const submit = canvas.getByRole('button', { name: 'Submit' });
    await canvasElement.ownerDocument.fonts.ready;
    await new Promise(requestAnimationFrame);
    const stageBefore = scene.getBoundingClientRect().toJSON();
    await userEvent.click(submit);
    const card = canvas.getByRole('region', { name: 'Arc too low' });
    await expect(within(card).getByRole('button', { name: 'Got it' })).toHaveFocus();
    await expect(scene.getBoundingClientRect().toJSON()).toEqual(stageBefore);
    const leader = canvasElement.querySelector('.ui-correction-leader line') as SVGLineElement;
    const ring = scene.querySelector('[data-correction-anchor="apex"]')!.getBoundingClientRect();
    const start = new DOMPoint(leader.x1.baseVal.value, leader.y1.baseVal.value).matrixTransform(leader.getScreenCTM()!);
    await expect(start.x).toBeCloseTo(ring.x + ring.width / 2, 0);
    await expect(start.y).toBeCloseTo(ring.y + ring.height / 2, 0);
    await expect(leader.getTotalLength()).toBeGreaterThan(8);
    await userEvent.keyboard('{Escape}');
    await expect(card).not.toBeInTheDocument();
    await expect(submit).toHaveFocus();
    // Leave the correction visible for inspection in the canvas and axe scan.
    await userEvent.click(submit);
  },
};

export const SaveAndReopen: Story = {
  render: () => <NoteExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Got it' }));
    const notes = canvas.getByRole('button', { name: 'Lesson notes' });
    await expect(notes).toHaveFocus();
    await expect(canvas.queryByRole('region', { name: 'Eye level' })).toBeNull();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('region', { name: 'Eye level' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Got it' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Lesson notes' })).toHaveFocus();
  },
};

export const DismissAndRepeat: Story = {
  render: () => <DialogExample initiallyOpen={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole('button', { name: 'Show completion' });
    await userEvent.click(open);
    const modal = canvas.getByRole('dialog', { name: 'Lesson complete' });
    await expect(modal.matches(':modal')).toBe(true);
    await expect(within(modal).getByRole('button', { name: 'Next Lesson' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(within(modal).getByRole('button', { name: 'Dismiss' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(modal).getByRole('button', { name: 'Next Lesson' })).toHaveFocus();
    await fireEvent(modal, new Event('cancel', { cancelable: true }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(open).toHaveFocus();
    await userEvent.click(open);
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};
