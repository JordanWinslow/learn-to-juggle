import { useState } from 'react';
import { CoursePlayer } from '@/lessons/CoursePlayer';
import { COURSE_STEPS, getCourseStep, type CourseStep, type PhaseId } from '@/lessons/curriculum';

type PreviewProps = {
  initialStep?: CourseStep;
  saveCompletion?: (phase: PhaseId) => void;
};

// Keep controls, navigation and earned badges local to each Storybook canvas.
export function CoursePreview({ initialStep = 'guide', saveCompletion }: PreviewProps) {
  return <PreviewSession key={initialStep} initialStep={initialStep} saveCompletion={saveCompletion} />;
}

function PreviewSession({ initialStep, saveCompletion }: PreviewProps & { initialStep: CourseStep }) {
  const [step, setStep] = useState(initialStep);
  const [completed, setCompleted] = useState<PhaseId[]>([]);

  function navigate(href: string) {
    const destination = COURSE_STEPS.find(item => item.href === href);
    if (destination) setStep(destination.id);
    else if (href === '/complete') window.open('./?path=/story/review-course-introduction--completed-course', '_top');
  }

  function complete(phase: PhaseId) {
    setCompleted(previous => previous.includes(phase) ? previous : [...previous, phase]);
    saveCompletion?.(phase);
  }

  return <CoursePlayer current={getCourseStep(step)} completed={completed}
    onNavigate={navigate} onPhaseComplete={complete} />;
}
