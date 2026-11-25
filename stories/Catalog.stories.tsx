import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { COURSE_STEPS, PHASES, STEP_LABEL, type CourseStep } from '@/lessons/curriculum';
import { ScenePanel } from '@/lessons/ScenePanel';
import { usePlayback } from '@/lessons/usePlayback';
import { correctGeometry } from '@/lessons/toss-geometry';
import { Button, Cluster, GeometryInputOptions, Heading, LessonDialog, PhaseDock, Stack, StageCorrection, StageNote, useGeometryInputPreference } from '@/ui';

const meta = {
  title: 'Review/Component catalog',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;

const stepStory = 'review-every-course-step--one-ball-lesson';

function StoryLink({ id, step, children }: { id: string; step?: CourseStep; children: ReactNode }) {
  const args = step ? `&args=initialStep:${encodeURIComponent(step)}` : '';
  return <a className="underline underline-offset-4" href={`./?path=/story/${id}${args}`} target="_top">{children}</a>;
}

function CourseGallery() {
  return (
    <nav aria-label="Course step previews">
      {PHASES.map(phase => (
        <details key={phase.id}>
          <summary>{phase.name}</summary>
          <ul className="grid gap-1 py-1 pl-5">
            {phase.steps.map(step => (
              <li key={step.id}>
                <StoryLink id={stepStory} step={step.id}>{STEP_LABEL[step.kind]} · {step.title}</StoryLink>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}

function Catalog() {
  const [geometry, setGeometry] = useState(correctGeometry);
  const [phase, setPhase] = useState(0);
  const [outcome, setOutcome] = useState<'success' | 'error' | null>(null);
  const input = useGeometryInputPreference();
  const playback = usePlayback({ initialPhase: 0.13 });
  function adjust(field: keyof typeof geometry, value: number) {
    setGeometry(previous => ({ ...previous, [field]: value }));
  }
  return (
    <ScenePanel title="Component library" controlsLayout="sidebar" allowVisibility playback={playback}
      scene={{ ...geometry, phase: playback.phase, onGeometryChange: adjust,
        correction: outcome === 'error' ? 'apex' : undefined }}
      note={outcome === 'error'
          ? <StageCorrection title="Arc too low" target="apex" onDismiss={() => setOutcome(null)}>Raise the peak toward eye level.</StageCorrection>
          : <StageNote title="Geometry handles">Drag the peak or either hand. Tab to a handle to adjust it with the arrow keys.</StageNote>}
      toolbar={<Stack>
        <GeometryInputOptions {...input} {...geometry}
          onSpacingChange={value => adjust('spacing', value)} onApexChange={value => adjust('apex', value)} />
        <Heading>Feedback</Heading>
        <Cluster>
          <Button onClick={() => setOutcome('success')}>Practice complete</Button>
          <Button onClick={() => setOutcome('error')}>Correction</Button>
        </Cluster>
        <Heading><StoryLink id="review-course-navigation--jump-to-a-lesson">Phase navigation</StoryLink></Heading>
        <PhaseDock value={phase} onChange={setPhase} />
        <Heading><StoryLink id={stepStory}>Every course step</StoryLink></Heading>
        <CourseGallery />
        <Heading>Interaction stories</Heading>
        <Cluster>
          <StoryLink id="review-course-introduction--welcome">Introduction and completion</StoryLink>
          <StoryLink id="review-one-ball--geometry">Geometry exercise</StoryLink>
          <StoryLink id="review-one-ball--guided">Guided toss</StoryLink>
          <StoryLink id="review-two-ball-exchange--guided">Two-ball exchange</StoryLink>
          <StoryLink id="review-assessments--second-throw">Quiz interactions</StoryLink>
          <StoryLink id="molecules-frame-picker--frame-selection">Frame picker</StoryLink>
          <StoryLink id="molecules-cascade-counter--ready">Cascade counter</StoryLink>
          <StoryLink id="review-unavailable-step--recovery">Unavailable step</StoryLink>
          <StoryLink id="atoms-course-logo--home-link">Course logo</StoryLink>
          <StoryLink id="foundations-theme--tokens">Design tokens</StoryLink>
          <StoryLink id="foundations-theme--typography">Typography</StoryLink>
          <StoryLink id="atoms-button--interaction-states">Button states</StoryLink>
        </Cluster>
      </Stack>}>
      {outcome === 'success' && <LessonDialog tone="success" title="Practice complete" onDismiss={() => setOutcome(null)}>
        You completed the one-ball practice.
      </LessonDialog>}
    </ScenePanel>
  );
}

export const Overview: StoryObj = {
  render: () => <Catalog />,
  play: async ({ canvasElement }) => {
    const gallery = within(canvasElement).getByRole('navigation', { name: 'Course step previews' });
    const links = within(gallery).getAllByRole<HTMLAnchorElement>('link', { hidden: true });
    await expect(links.map(link => new URL(link.href).searchParams.get('args'))).toEqual(
      COURSE_STEPS.map(step => `initialStep:${step.id}`),
    );
  },
};

export const KeyboardWithArrowButtons: StoryObj = {
  render: () => <Catalog />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Use arrow buttons' }));
    await expect(canvas.getByRole('button', { name: 'Higher' })).toBeVisible();
    const peak = canvas.getByRole('slider', { name: 'Arc peak' });
    const before = Number(peak.getAttribute('aria-valuenow'));
    peak.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(Number(peak.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
    await expect(peak).toHaveFocus();
  },
};
