import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { ViewSwitch, VisibilityControls, type View } from '@/ui/controls';

interface Options {
  view: View;
  showBall: boolean;
  showPath: boolean;
  onChange: (view: View) => void;
}

const meta = {
  parameters: { layout: 'padded' },
  title: 'Molecules/View options',
  args: { view: 'front', showBall: true, showPath: true, onChange: fn() },
  argTypes: { view: { control: 'radio', options: ['front', 'side'] } },
  render: function Render(args) {
    const [, set] = useArgs<Options>();
    return <ViewSwitch value={args.view} onChange={view => { args.onChange(view); set({view}); }} />;
  },
} satisfies Meta<Options>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Front: Story = {};
export const Side: Story = { args: { view: 'side' } };
export const Visibility: Story = {
  render: function Render(args) {
    const [, set] = useArgs<Options>();
    return <VisibilityControls showBall={args.showBall} showPath={args.showPath}
      onBallChange={showBall => set({showBall})} onPathChange={showPath => set({showPath})} />;
  },
};
