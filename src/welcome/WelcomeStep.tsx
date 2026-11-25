import type { ReactNode } from 'react';
import { Cluster, ReadingSection } from '../ui/primitives';

export function WelcomeStep({ title, children, actions }: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <>
      <div className="welcome-reading"><ReadingSection title={title}>{children}</ReadingSection></div>
      <Cluster className="welcome-actions">{actions}</Cluster>
    </>
  );
}
