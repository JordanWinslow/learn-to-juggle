import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, Checkbox, Cluster, ForwardLabel, Range, Stack } from '@/ui/primitives';

const meta = {
  parameters: { layout: 'padded' },
  title: 'Atoms/Button', component: Button,
  args: { children: 'Submit', variant: 'primary', onClick: fn() },
  argTypes: { variant: { control: 'radio', options: ['primary', 'secondary', 'quiet'] } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { children: 'Got it', variant: 'secondary' } };
export const Quiet: Story = { args: { children: 'Pause', variant: 'quiet' } };
export const Next: Story = { args: { children: <ForwardLabel>Practice</ForwardLabel>, attention: true } };
export const Disabled: Story = { args: { children: 'Wider →', variant: 'secondary', disabled: true } };

export const InteractionStates: Story = {
  render: () => (
    <Stack>
      <Cluster><Button variant="primary">Submit</Button><Button>Pause</Button><Button variant="quiet">Front</Button></Cluster>
      <Cluster><Checkbox label="Show path" defaultChecked /><Range label="Motion position" defaultValue={35} /></Cluster>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const submit = canvas.getByRole('button', { name: 'Submit' });
    await expect(submit).toHaveFocus();
    await expect(getComputedStyle(submit).outlineStyle).toBe('solid');
    await expect(getComputedStyle(submit).outlineWidth).toBe('3px');
  },
};

export const StableLabel: Story = {
  render: function Render() {
    const [playing, setPlaying] = useState(false);
    return <Button reserveLabels={['Play', 'Pause']} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</Button>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvasElement.ownerDocument.fonts.ready;
    const button = canvas.getByRole('button', { name: 'Play' });
    const initial = button.getBoundingClientRect();
    await userEvent.click(button);
    await expect(button).toHaveAccessibleName('Pause');
    await expect(button.getBoundingClientRect().width).toBe(initial.width);
    await expect(button.getBoundingClientRect().height).toBe(initial.height);
    await userEvent.click(button);
  },
};
