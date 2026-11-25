'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CoursePlayer } from './CoursePlayer';
import { getCourseStep, type CourseStep } from './curriculum';
import { markPhaseComplete, saveLastStep, useCompletedPhases } from './course-progress';

export function CourseSession({ step }: { step: CourseStep }) {
  const router = useRouter();
  const current = getCourseStep(step);
  const completed = useCompletedPhases();
  const [visit, setVisit] = useState(0);

  useEffect(() => {
    saveLastStep(current.href);
    function restore(event: PageTransitionEvent) {
      if (event.persisted) {
        saveLastStep(current.href);
        setVisit(value => value + 1);
      }
    }
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, [current.href]);

  return <CoursePlayer key={visit} current={current} completed={completed}
    onPhaseComplete={markPhaseComplete} onNavigate={href => router.push(href, { scroll: false })} />;
}
