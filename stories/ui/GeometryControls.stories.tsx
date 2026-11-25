import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { GEOMETRY_LIMITS, GeometryControls, type GeometryControlProps } from '@/ui/controls';

function ControlsDemo(args: GeometryControlProps) {
  const [spacing, setSpacing] = useState(args.spacing);
  const [apex, setApex] = useState(args.apex);
  return <GeometryControls spacing={spacing} apex={apex}
    onSpacingChange={value => { setSpacing(value); args.onSpacingChange?.(value); }}
    onApexChange={value => { setApex(value); args.onApexChange(value); }} />;
}

const meta = {
  parameters: { layout: 'padded' },
  title: 'Molecules/Geometry controls', component: GeometryControls,
  args: { spacing: 0, apex: 79, onSpacingChange: fn(), onApexChange: fn() },
  argTypes: {
    spacing: { control: { type: 'range', ...GEOMETRY_LIMITS.spacing } },
    apex: { description: 'Peak Y in sprite pixels. Eye level is 79.', control: { type: 'range', ...GEOMETRY_LIMITS.apex } },
  },
  render: args => <ControlsDemo key={`${args.spacing}/${args.apex}`} {...args} />,
} satisfies Meta<typeof GeometryControls>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const CloseAndHigh: Story = { args: { spacing: GEOMETRY_LIMITS.spacing.min, apex: GEOMETRY_LIMITS.apex.min } };
export const WideAndLow: Story = { args: { spacing: GEOMETRY_LIMITS.spacing.max, apex: GEOMETRY_LIMITS.apex.max } };
export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const higher = canvas.getByRole('button', { name: 'Higher' });
    await userEvent.tab();
    await expect(canvas.getByRole('button', {name:'Lower'})).toHaveFocus();
    await userEvent.tab();
    await expect(higher).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onApexChange).toHaveBeenCalledWith(79 - GEOMETRY_LIMITS.apex.step);
    await expect(args.onSpacingChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(args.onSpacingChange).toHaveBeenCalledWith(-GEOMETRY_LIMITS.spacing.step);
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect(args.onApexChange).toHaveBeenCalledWith(80 - GEOMETRY_LIMITS.apex.step);
    await expect(higher).toHaveFocus();
  },
};
