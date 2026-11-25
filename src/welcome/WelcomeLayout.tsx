import type { ReactNode } from 'react';
import { CourseLogo } from '../ui/course-logo';
import { CoachPreview } from './CoachPreview';
import './welcome.css';

/** The App Router keeps this layout, and its running demonstration, across Begin and Back. */
export function WelcomeLayout({ children, illustration }: { children: ReactNode; illustration?: ReactNode }) {
  return (
    <main className="welcome-screen">
      <header className="welcome-header"><CourseLogo /></header>
      <div className="welcome-body">
        <div className="welcome-flow">{children}</div>
        {illustration ?? <CoachPreview />}
      </div>
    </main>
  );
}
