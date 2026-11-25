'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DialogFooterHost } from '../ui/lesson-layers';
import { CourseActivity } from './CourseActivity';
import { CourseNavigation } from './CourseNavigation';
import { StepContext } from './StepHeading';
import { COURSE_STEPS, type CourseLocation, type PhaseId } from './curriculum';
import './course-player.css';

type CoursePlayerProps = {
  current: CourseLocation;
  completed: readonly string[];
  onNavigate: (href: string) => void;
  onPhaseComplete: (id: PhaseId) => void;
};

export function CoursePlayer({ current, completed, onNavigate, onPhaseComplete }: CoursePlayerProps) {
  const [attempt, setAttempt] = useState(0);
  const [dialogHost, setDialogHost] = useState<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const position = COURSE_STEPS.findIndex(step => step.id === current.id);
  const next = COURSE_STEPS[position + 1];

  useLayoutEffect(() => {
    content.current?.querySelector('h1')?.focus({ preventScroll: true });
  }, [current.id, attempt]);

  const navigation = (
    <CourseNavigation current={current} completed={completed} backHref={COURSE_STEPS[position - 1]?.href}
      onNavigate={onNavigate} onRestartStep={() => setAttempt(value => value + 1)} />
  );

  return (
    <DialogFooterHost.Provider value={setDialogHost}>
      <StepContext.Provider value={{ current, next }}>
        <div className="course-player">
          <div key={`${current.id}-${attempt}`} ref={content} className="course-content">
            <CourseActivity step={current}
              onNext={() => onNavigate(next?.href ?? '/complete')} onPhaseComplete={() => onPhaseComplete(current.phase.id)} />
          </div>
          <div className="course-dock-slot">
            {dialogHost ? createPortal(navigation, dialogHost) : navigation}
          </div>
        </div>
      </StepContext.Provider>
    </DialogFooterHost.Provider>
  );
}
