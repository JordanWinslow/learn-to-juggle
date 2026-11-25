'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { COURSE_STEPS, FINAL_BADGE_STEP, welcomeCopy } from '@/lessons/curriculum';
import { resetCourseProgress, useCompletedPhases, useResumeStep, useLearnerName } from '@/lessons/course-progress';
import { Button, ButtonLink, Caption, ForwardLabel, Text, TextField } from '@/ui';
import { WelcomeLayout } from './WelcomeLayout';
import { WelcomeStep } from './WelcomeStep';
import { LearnerGreeting } from '../ui/coach-message';

function ShareCourse() {
  const [status, setStatus] = useState('');
  const [manualURL, setManualURL] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (manualURL) { field.current?.focus(); field.current?.select(); }
  }, [manualURL]);
  function close() {
    setManualURL('');
    trigger.current?.focus();
  }
  async function share() {
    const url = new URL('/', window.location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Learn to juggle', url });
      } else {
        await navigator.clipboard.writeText(url);
        setStatus('Course link copied.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setManualURL(url);
    }
  }
  return (
    <div className="welcome-share">
      <Button ref={trigger} onClick={share} reserveLabels={['Share course', 'Link copied']}>{status ? 'Link copied' : 'Share course'}</Button>
      <span role="status" className="sr-only">{status}</span>
      {manualURL && <section className="welcome-share-link ui-surface" aria-label="Copy the course link"
        onKeyDown={event => { if (event.key === 'Escape') close(); }}>
        <TextField ref={field} label="Course link" value={manualURL} readOnly onFocus={event => event.target.select()} />
        <Button onClick={close}>Close</Button>
      </section>}
    </div>
  );
}

export function CourseFinish() {
  const router = useRouter();
  const completed = useCompletedPhases();
  const name = useLearnerName();
  const finished = completed.includes(FINAL_BADGE_STEP.phase.id);
  const nextStep = useResumeStep(name, completed) ?? COURSE_STEPS[0];
  function restart() {
    resetCourseProgress();
    router.push(COURSE_STEPS[0].href);
  }

  return (
    <WelcomeLayout illustration={finished ? (
      <figure className="welcome-coach welcome-portrait">
        <Image src="/sprites/jordan-finish.png" alt="Jordan winks and gives a thumbs-up." fill loading="eager" sizes="(max-width: 42rem) 100vw, 26rem" unoptimized />
      </figure>
    ) : undefined}>
      {finished ? (
        <WelcomeStep title={welcomeCopy.finish.heading} actions={<><Button variant="primary" onClick={restart}><ForwardLabel>Retry course</ForwardLabel></Button><ShareCourse /></>}>
          <Text><LearnerGreeting occasion="finished" /> {welcomeCopy.finish.achievement}</Text>
          <Text>{welcomeCopy.finish.nextGoal}</Text>
          <Caption>{welcomeCopy.finish.retry}</Caption>
        </WelcomeStep>
      ) : (
        <WelcomeStep title={welcomeCopy.finish.resumeHeading} actions={<ButtonLink variant="primary" href={nextStep.href}><ForwardLabel>Continue learning</ForwardLabel></ButtonLink>}>
          <Text>{welcomeCopy.finish.resumeInstruction}</Text>
          <ButtonLink variant="quiet" href={FINAL_BADGE_STEP.href}><ForwardLabel>{`Go to final ${FINAL_BADGE_STEP.kind}`}</ForwardLabel></ButtonLink>
        </WelcomeStep>
      )}
    </WelcomeLayout>
  );
}
