import type { ReactNode, Ref } from 'react';
import { Button, ForwardLabel, LessonDialog } from '../../ui';
import { useNextStepLabel } from '../StepHeading';

export type QuizProps = { title: string; onNext: () => void; onQuizPassed?: () => void };
export type QuizProgress = 'answering' | 'celebrate' | 'passed';

export function QuizSubmit({ passed, disabled, onSubmit, onNext, ref }: {
  passed: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  onNext: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  const nextLabel = useNextStepLabel();
  return <Button ref={ref} variant="primary" disabled={disabled} reserveLabels={[`${nextLabel} →`, 'Submit']}
    onClick={passed ? onNext : onSubmit}>{passed ? <ForwardLabel>{nextLabel}</ForwardLabel> : 'Submit'}</Button>;
}

export function QuizSuccess({ children, onNext, onRetry, onDismiss }: {
  children: ReactNode;
  onNext: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const nextLabel = useNextStepLabel();
  return <LessonDialog title="Quiz complete" tone="success" actionLabel={<ForwardLabel>{nextLabel}</ForwardLabel>}
    onAction={onNext} onDismiss={onDismiss} secondaryAction={{ label: 'Retry quiz', onClick: onRetry }}>
    {children}
  </LessonDialog>;
}
