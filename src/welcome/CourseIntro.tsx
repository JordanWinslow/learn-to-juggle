'use client';

import { ButtonLink, ForwardLabel, Stack, Text } from '../ui';
import { WelcomeStep } from './WelcomeStep';
import { LearnerGreeting } from '../ui/coach-message';
import { STEP_LABEL, welcomeCopy } from '@/lessons/curriculum';
import { useCompletedPhases, useResumeStep, useLearnerName } from '@/lessons/course-progress';

export function CourseIntro() {
  const name = useLearnerName();
  const completed = useCompletedPhases();
  const resume = useResumeStep(name, completed);

  return (
    <WelcomeStep title={welcomeCopy.title} actions={resume ? <>
      <ButtonLink variant="primary" href={resume.href}><ForwardLabel>Resume course</ForwardLabel></ButtonLink>
      <ButtonLink variant="quiet" href="/start"><ForwardLabel>From the beginning</ForwardLabel></ButtonLink>
    </> : <ButtonLink variant="primary" href="/start"><ForwardLabel>Begin</ForwardLabel></ButtonLink>}>
      {resume && <div className="welcome-resume">
        <Text><strong><LearnerGreeting occasion="returning" /></strong></Text>
        <Text>Phase {resume.phaseIndex + 1} · {resume.phase.name}<br />
          {STEP_LABEL[resume.kind]} · Step {resume.stepIndex + 1} of {resume.phase.steps.length}<br />
          {resume.title}</Text>
      </div>}
      <Text>{welcomeCopy.introduction}</Text>
      <Text><strong>{welcomeCopy.goal}</strong> {welcomeCopy.explanation}</Text>
      <div className="welcome-details">
        <details>
          <summary>{welcomeCopy.benefits.heading}</summary>
          <Stack>
            <Text>{welcomeCopy.benefits.coordination}</Text>
            <Text>{welcomeCopy.benefits.research}</Text>
            <div className="welcome-sources">
              {welcomeCopy.benefits.sources.map(source => <a key={source.href} href={source.href}>{source.label}</a>)}
            </div>
          </Stack>
        </details>
        <details>
          <summary>{welcomeCopy.history.heading}</summary>
          <Text>{welcomeCopy.history.text} <a className="welcome-source" href={welcomeCopy.history.source.href}>{welcomeCopy.history.source.label}</a></Text>
        </details>
      </div>
    </WelcomeStep>
  );
}
