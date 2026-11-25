'use client';

import { createContext, useContext, useId } from 'react';
import { Caption, Heading } from '../ui/primitives';
import { nextStepLabel, STEP_LABEL, type CourseLocation } from './curriculum';

export const StepContext = createContext<{ current: CourseLocation; next?: CourseLocation } | null>(null);

export function useNextStepLabel() {
  return nextStepLabel(useContext(StepContext)?.next);
}

export function StepHeading({ title, id }: { title: string; id?: string }) {
  const step = useContext(StepContext)?.current;
  const positionId = useId();
  return (
    <div className="course-step-heading">
      {step && <Caption id={positionId}>
        <strong>{STEP_LABEL[step.kind]}</strong> · Step {step.stepIndex + 1} of {step.phase.steps.length}
      </Caption>}
      <Heading level={1} id={id} tabIndex={-1} aria-describedby={step ? positionId : undefined}>{title}</Heading>
    </div>
  );
}
