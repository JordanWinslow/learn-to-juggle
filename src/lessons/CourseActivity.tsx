'use client';

import type { Activity, CourseLocation } from './curriculum';
import { GuidedLesson } from './GuidedLesson';
import { PracticeSession } from './PracticeSession';
import { CascadeCountQuiz } from './quizzes/CascadeCountQuiz';
import { GripQuiz } from './quizzes/GripQuiz';
import { ReleaseTimingQuiz } from './quizzes/ReleaseTimingQuiz';
import { TossGeometryQuiz } from './quizzes/TossGeometryQuiz';

type Props = {
  step: CourseLocation;
  onNext: () => void;
  onPhaseComplete: () => void;
};

export function CourseActivity({ step, onNext, onPhaseComplete }: Props) {
  const activity: Activity = step;
  const count = step.phase.balls;
  if (activity.kind === 'lesson') {
    return <GuidedLesson title={activity.title} cues={activity.cues} count={count}
      pattern={activity.pattern} initialSpeed={activity.initialSpeed} greeting={activity.greeting} onNext={onNext} />;
  }
  const awardBadge = activity.earnsBadge ? onPhaseComplete : undefined;
  if (activity.kind === 'practice') {
    return <PracticeSession title={activity.title} rounds={activity.rounds} count={count}
      onGoalReached={awardBadge} onComplete={onNext} />;
  }

  const quizProps = { title: activity.title, onNext, onQuizPassed: awardBadge };
  switch (activity.quiz) {
    case 'geometry': return <TossGeometryQuiz {...quizProps} />;
    case 'release': return <ReleaseTimingQuiz {...quizProps} throwNumber={activity.throwNumber} />;
    case 'grip': return <GripQuiz {...quizProps} />;
    case 'count': return <CascadeCountQuiz {...quizProps} />;
  }
}
