import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { usePlayback } from '@/lessons/usePlayback';
import { MotionTransport, type TransportProps } from '@/ui/controls';

function TransportDemo(args: TransportProps) {
  const motion = usePlayback({ autoPlay: args.playing, initialPhase: args.phase, initialSpeed: args.speed });
  return <MotionTransport {...motion}
    onPlayingChange={playing => { motion.onPlayingChange(playing); args.onPlayingChange(playing); }}
    onSpeedChange={speed => { motion.onSpeedChange(speed); args.onSpeedChange(speed); }}
    onPhaseChange={phase => { motion.onPhaseChange(phase); args.onPhaseChange(phase); }} />;
}

const meta = {
  parameters: { layout: 'padded' },
  title: 'Molecules/Motion transport', component: MotionTransport,
  args: { playing: false, speed: 1, phase: 0.25, onPlayingChange: fn(), onSpeedChange: fn(), onPhaseChange: fn() },
  argTypes: { phase: { control: { type:'range', min: 0, max: 1, step: 0.001 } }, speed: { options: [1, 0.5, 0.25], control: 'radio' } },
  render: args => <TransportDemo key={`${args.playing}/${args.speed}/${args.phase}`} {...args} />,
} satisfies Meta<typeof MotionTransport>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};
export const Normal: Story = { args: { playing: true } };
export const Slow: Story = { args: { playing: true, speed: 0.5 } };
export const QuarterSpeed: Story = { args: { playing: true, speed: 0.25 } };
export const StableControls: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const play = c.getByRole('button', { name: 'Play' });
    const rate = c.getByRole('button', { name: /normal speed/ });
    const position = c.getByRole('slider');
    await canvasElement.ownerDocument.fonts.ready;
    const widths = [play, rate, position].map(control => control.getBoundingClientRect().width);
    await userEvent.click(play);
    await expect(c.getByRole('button', { name: 'Pause' })).toBeVisible();
    for (const label of ['½×', '¼×', '1×']) {
      await userEvent.click(rate);
      await expect(rate).toHaveTextContent(label);
      await expect([play, rate, position].map(control => control.getBoundingClientRect().width)).toEqual(widths);
    }
    await userEvent.click(play);
  },
};
export const ScrubPausesPlayback: Story = {
  args: { playing:true },
  play: async ({canvasElement, args}) => {
    const canvas = within(canvasElement);
    const start = canvas.queryByRole('button', { name: 'Play' });
    if (start) await userEvent.click(start); // Reduced-motion users start playback explicitly.
    const slider = canvas.getByRole('slider', { name: 'Motion position' });
    await fireEvent.input(slider, { target: { value: '251' } });
    await expect(args.onPlayingChange).toHaveBeenCalledWith(false);
    await expect(args.onPhaseChange).toHaveBeenCalledWith(0.251);
  },
};
