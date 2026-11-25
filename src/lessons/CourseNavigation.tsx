'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { ButtonLink, Caption, LabelText, PhaseDock, Surface } from '../ui';
import { CourseLogo } from '../ui/course-logo';
import { COURSE_STEPS, PHASES, STEP_LABEL, type CourseLocation } from './curriculum';

type NavigationProps = {
  current: CourseLocation;
  backHref?: string;
  completed: readonly string[];
  onRestartStep: () => void;
  onNavigate: (href: string) => void;
};

export function CourseNavigation({ current, backHref, completed, onRestartStep, onNavigate }: NavigationProps) {
  const [openPhase, setOpenPhase] = useState<number | null>(null);
  const footer = useRef<HTMLElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const group = openPhase === null ? undefined : PHASES[openPhase];

  useLayoutEffect(() => {
    if (openPhase === null) return;
    const selected = picker.current?.querySelector<HTMLElement>('[aria-current]') ?? picker.current?.querySelector('a');
    selected?.focus({ preventScroll: true });
  }, [openPhase]);

  useEffect(() => {
    if (openPhase === null) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !footer.current?.contains(event.target)) setOpenPhase(null);
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [openPhase]);

  function follow(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    setOpenPhase(null);
    event.preventDefault();
    if (href === current.href) onRestartStep();
    else onNavigate(href);
  }

  return (
    <footer ref={footer} className="course-navigation"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpenPhase(null);
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || openPhase === null) return;
        event.preventDefault();
        event.stopPropagation();
        setOpenPhase(null);
        footer.current?.querySelector<HTMLElement>(`[data-phase-id="${PHASES[openPhase].id}"]`)?.focus({ preventScroll: true });
      }}>
      <CourseLogo />
      <div className="course-position" role="group" aria-label="Current course position">
        <Caption><strong>Phase {current.phaseIndex + 1}</strong> · {current.phase.name}</Caption>
        <Caption>{STEP_LABEL[current.kind]} · Step {current.stepIndex + 1} of {current.phase.steps.length}</Caption>
      </div>
      {group && <Surface ref={picker} id={panelId} role="group" aria-label={`${group.name} steps`} className="course-lesson-picker">
        <LabelText>{group.name}</LabelText>
        {COURSE_STEPS.filter(step => step.phase.id === group.id).map(step => (
          <ButtonLink key={step.id} href={step.href} scroll={false} variant="quiet"
            aria-current={current.id === step.id ? 'step' : undefined}
            onClick={event => follow(event, step.href)}>
            <Caption>{step.stepIndex + 1}. {STEP_LABEL[step.kind]}</Caption>
            <span>{step.title}{current.id === step.id && <small className="course-current-step">Current step</small>}</span>
          </ButtonLink>
        ))}
      </Surface>}
      <PhaseDock value={current.phaseIndex} onChange={index => setOpenPhase(open => open === index ? null : index)}
        completed={completed} lessonPicker={{ openPhase, id: panelId }} />
      {backHref && <ButtonLink variant="quiet" className="course-back" href={backHref} scroll={false} aria-label="Back"
        onClick={event => follow(event, backHref)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14 5-7 7 7 7" /></svg>
        <span>Back</span>
      </ButtonLink>}
    </footer>
  );
}
