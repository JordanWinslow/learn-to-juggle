import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, within } from 'storybook/test';
import { RELEASE_EVENTS } from '@/scene/motion';
import { throwQuizCopy } from '@/lessons/curriculum';
import { Stack } from '@/ui';
import { FramePicker } from '@/lessons/quizzes/FramePicker';

const meta = { title: 'Molecules/Frame picker', component: FramePicker, parameters: { layout: 'padded' } } satisfies Meta<typeof FramePicker>;
export default meta;
const descriptions = RELEASE_EVENTS.map(event => throwQuizCopy[2].frames[event.id]);

function Preview() {
  const [frame, setFrame] = useState(0);
  return <Stack><FramePicker frame={frame} descriptions={descriptions} onChange={setFrame} /></Stack>;
}

export const FrameSelection: StoryObj = {
  render: () => <Preview />,
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Choose a frame' });
    slider.focus();
    await expect(slider).toHaveFocus();
    fireEvent.change(slider, { target: { value: '1' } });
    await expect(slider).toHaveValue('1');
    await expect(slider).toHaveAttribute('aria-valuetext', `Frame 2 of ${descriptions.length}. ${descriptions[1]}`);
  },
};
