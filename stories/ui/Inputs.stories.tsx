import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useArgs } from 'storybook/preview-api';
import { Checkbox, Range } from '@/ui/primitives';

interface Inputs { label: string; checked: boolean; value: number }
const meta = {
  parameters: { layout: 'padded' },
  title: 'Atoms/Inputs',
  args: { label: 'Ball', checked: true, value: 50 },
  argTypes: { value: { control: {type:'range', min:0, max:100} } },
  render: function Render(args) {
    const [, set] = useArgs<Inputs>();
    return <Checkbox label={args.label} checked={args.checked} onChange={e => set({checked:e.currentTarget.checked})} />;
  },
} satisfies Meta<Inputs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const VisibilityCheckbox: Story = {};
export const MotionRange: Story = {
  args: {label:'Motion position'},
  render: function Render(args) {
    const [, set] = useArgs<Inputs>();
    return <Range label={args.label} value={args.value} min={0} max={100} aria-valuetext={args.value+'% of loop'} onChange={e => set({value:e.currentTarget.valueAsNumber})} />;
  },
};
