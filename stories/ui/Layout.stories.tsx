import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, Cluster, ControlGroup, ForwardLabel, Heading, Stack, Surface, Text } from '@/ui/primitives';

const meta = {
  parameters: { layout: 'padded' }, title: 'Atoms/Layout' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const SurfaceAndStack: Story = {
  render: () => (
    <Surface>
      <Stack>
        <Heading level={2}>One ball</Heading>
        <Text>Hold your palms up at waist height.</Text>
        <Text muted>Keep your wrists level with your elbows.</Text>
      </Stack>
    </Surface>
  ),
};
export const ButtonCluster: Story = {
  render: () => <Cluster><Button>Pause</Button><Button variant="primary"><ForwardLabel>Quiz</ForwardLabel></Button></Cluster>,
};
export const LabeledGroup: Story = {
  render: () => <ControlGroup label="Arc height"><Button>↓ Lower</Button><Button>↑ Higher</Button></ControlGroup>,
};
