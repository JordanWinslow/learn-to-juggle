'use client';

import { useLearnerName } from '../lessons/course-progress';
import { welcomeCopy } from '../lessons/curriculum';

export function LearnerGreeting({ occasion }: { occasion: keyof typeof welcomeCopy.greetings }) {
  const name = useLearnerName();
  const message = welcomeCopy.greetings[occasion];
  if (!name) return message.anonymous;
  const [before, after] = message.named.split('{name}');
  return <>{before}<bdi>{name}</bdi>{after}</>;
}
