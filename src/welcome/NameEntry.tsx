'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { COURSE_STEPS, welcomeCopy } from '@/lessons/curriculum';
import { saveLearnerName, useLearnerName } from '@/lessons/course-progress';
import { Button, ForwardLabel, Text, TextField } from '@/ui';
import { WelcomeStep } from './WelcomeStep';

export function NameEntry() {
  const router = useRouter();
  const formId = useId();
  const storedName = useLearnerName();
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? storedName;

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    saveLearnerName(name);
    router.push(COURSE_STEPS[0].href);
  }

  return (
    <WelcomeStep title={welcomeCopy.name.heading} actions={
      <Button type="submit" form={formId} variant="primary" disabled={!name.trim()}><ForwardLabel>Start my first lesson</ForwardLabel></Button>
    }>
      <Text>{welcomeCopy.name.instruction}</Text>
      <form id={formId} onSubmit={start} className="welcome-form">
        <TextField label={welcomeCopy.name.label} hint={welcomeCopy.name.hint} name="nickname"
          autoComplete="nickname" maxLength={32} required value={name} onChange={event => setDraft(event.target.value)} />
      </form>
    </WelcomeStep>
  );
}
