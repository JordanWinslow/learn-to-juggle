import { useLayoutEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, Caption, Cluster, Heading, LabelText, Stack, Surface, Text } from '@/ui/primitives';

const meta = { title: 'Foundations/Theme', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const swatches = [
  ['page', 'Page'], ['stage', 'Teaching scene'], ['panel', 'Panel'],
  ['control', 'Neutral control'], ['action', 'Primary button'], ['white', 'Body text'],
  ['control-hover', 'Hovered control'], ['control-pressed', 'Pressed control'], ['focus', 'Keyboard focus'],
  ['muted', 'Secondary text'], ['coral', 'Ball 1'], ['turquoise', 'Ball 2 and arc'],
  ['amber', 'Ball 3'], ['success', 'Correct answer'], ['error', 'Correction'],
  ['ink', 'Dark text and outline'], ['stitch', 'Stitch highlight'],
] as const;

const typeSamples = [
  ['Page title · H1', 'title', <Heading key="h1" level={1} role="presentation">One-ball toss</Heading>],
  ['Section heading · H2', 'subtitle', <Heading key="h2" level={2} role="presentation">Starting position</Heading>],
  ['Subheading · H3–H6', 'subheading', <Heading key="h3" level={3} role="presentation">Hand spacing</Heading>],
  ['Paragraph', 'body', <Text key="p">Keep your palms up at waist height.</Text>],
  ['Secondary paragraph', 'body', <Text key="muted" muted>Let your upper arms rest at your sides.</Text>],
  ['Control label', 'label', <LabelText key="label">Arc height</LabelText>],
  ['Caption', 'caption', <Caption key="caption">Front view</Caption>],
] as const;

function TypeScale() {
  const scale = useRef<HTMLDListElement>(null);
  const [readout, setReadout] = useState({ family: '', rows: [] as string[] });
  useLayoutEffect(() => {
    const list = scale.current;
    if (!list) return;
    const samples = Array.from(list.querySelectorAll('dd > :first-child'));
    function measure() {
      const family = getComputedStyle(samples[0]).fontFamily.split(',')[0].replaceAll('"', '');
      const rows = samples.map(sample => {
        const style = getComputedStyle(sample);
        const size = parseFloat(style.fontSize);
        const leading = Number((parseFloat(style.lineHeight) / size).toFixed(2));
        return `${Number(size.toFixed(2))} px · ${style.fontWeight} weight · ${leading} line height`;
      });
      setReadout({ family, rows });
    }
    measure();
    const observer = new ResizeObserver(measure);
    samples.forEach(sample => observer.observe(sample));
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  return (
    <Stack>
      <Text muted>{readout.family}</Text>
      <dl className="ui-type-scale" ref={scale}>
        {typeSamples.map(([name, token, sample], i) => (
          <div className="ui-type-row" key={name}>
            <dt><LabelText>{name}</LabelText><Caption><code>--text-{token}</code></Caption></dt>
            <dd>{sample}<Caption className="block">{readout.rows[i]}</Caption></dd>
          </div>
        ))}
      </dl>
    </Stack>
  );
}

export const Typography: Story = {
  render: () => (
    <main className="ui-specimen">
      <Stack>
        <Heading level={1}>Typography</Heading>
        <Surface><TypeScale /></Surface>
      </Stack>
    </main>
  ),
};

export const Tokens: Story = {
  render: () => (
    <main className="ui-specimen">
      <Stack>
        <Heading level={1}>Design tokens</Heading>
        <Surface><Stack>
          <Heading>Typography</Heading>
          <TypeScale />
        </Stack></Surface>
        <Heading>Color</Heading>
        <section className="ui-swatch-grid" aria-label="Palette">
          {swatches.map(([token, role]) => (
            <div className="ui-swatch" key={token}>
              <span aria-hidden="true" className="ui-swatch-chip" style={{ background: 'var(--color-' + token + ')' }} />
              <LabelText>{role}</LabelText><Caption><code>--color-{token}</code></Caption>
            </div>
          ))}
        </section>
        <Surface><Stack>
          <Heading>Controls</Heading>
          <Text muted>44 px minimum button target · 6 px corners · 4 px spacing unit</Text>
          <Cluster><Button variant="primary">Submit</Button><Button>↓ Lower</Button><Button variant="quiet">Play</Button></Cluster>
        </Stack></Surface>
      </Stack>
    </main>
  ),
};
