import type { ReactNode } from 'react';
import { WelcomeLayout } from '@/welcome/WelcomeLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return <WelcomeLayout>{children}</WelcomeLayout>;
}
