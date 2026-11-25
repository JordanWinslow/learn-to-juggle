import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CascadeCounter } from '@/lessons/CascadeCounter';
import '@/lessons/lessons.css';

const meta = {
  title: 'Molecules/Cascade counter', component: CascadeCounter,
  parameters: { layout: 'padded' },
  args: { phase: 0, loops: 0, pattern: 'three-throws', goal: 1 },
} satisfies Meta<typeof CascadeCounter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const OneComplete: Story = { args: { phase: 1 } };
export const TwoComplete: Story = { args: { pattern: 'six-throws', phase: 1, goal: 2 } };
export const Continuous: Story = { args: { pattern: 'continuous', loops: 4, phase: 0.5, goal: undefined } };
