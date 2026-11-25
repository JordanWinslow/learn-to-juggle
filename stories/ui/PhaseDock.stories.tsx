import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PhaseDock } from '@/ui/phase-dock';

function DockDemo(args: ComponentProps<typeof PhaseDock>) {
  const [value, setValue] = useState(args.value);
  return <PhaseDock {...args} value={value} onChange={index => { setValue(index); args.onChange(index); }} />;
}

const meta = {
  parameters: { layout: 'padded' },
  decorators: [Story => <div className="pt-20"><Story /></div>],
  title: 'Molecules/Phase dock', component: PhaseDock, args: { value: 0, onChange: fn() },
  argTypes: { value: { control: { type: 'range', min: 0, max: 5, step: 1 } } },
  render: args => <DockDemo key={args.value} {...args} />,
} satisfies Meta<typeof PhaseDock>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FirstPhase: Story = {};
export const Exchange: Story = { args: { value: 1 } };
export const RevisitCompletedPhase: Story = {
  args: { value: 1, completed: ['one-ball', 'two-ball'] },
  play: async ({ canvasElement }) => {
    const phase = within(canvasElement).getByRole('button', { name: 'Two-ball exchange' });
    await expect(phase).toHaveAttribute('aria-current', 'step');
    await expect(phase).toHaveAccessibleDescription('Quiz complete');
  },
};
export const Phone: Story = { globals: { viewport: { value:'mobile1', isRotated:false } } };
export const CompletedQuiz: Story = {
  args: { completed: ['one-ball'], value: 2 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const completed = c.getByRole('button', { name: 'One ball' });
    await expect(completed).toHaveAccessibleDescription('Quiz complete');
    await expect(completed).toHaveAttribute('data-complete');
    await expect(c.getByRole('button', { name: 'Hold a third ball' })).toHaveAttribute('aria-current', 'step');
  },
};
export const InspectAPhase: Story = {
  play: async ({canvasElement, args}) => {
    const c = within(canvasElement);
    const exchange = c.getByRole('button', {name:'Two-ball exchange'});
    await userEvent.hover(exchange);
    await expect(exchange).toHaveAttribute('data-preview');
    await expect(c.getByText('Two-ball exchange')).toBeVisible();
    await userEvent.click(exchange);
    await expect(args.onChange).toHaveBeenCalledWith(1);
    await expect(exchange).toHaveAttribute('aria-current', 'step');
    await userEvent.keyboard('{Escape}');
    await expect(c.queryByText('Two-ball exchange')).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(c.getByRole('button', {name:'Hold a third ball'})).toHaveFocus();
    await expect(c.getByText('Hold a third ball')).toBeVisible();
  },
};
