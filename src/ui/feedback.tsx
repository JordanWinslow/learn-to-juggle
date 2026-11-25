'use client';

import { useId, type ReactNode, type Ref } from 'react';
import { Button, Cluster, Heading, Stack, StatusMark, classes } from './primitives';

export interface FeedbackProps {
  title: string;
  children?: ReactNode;
  tone?: 'info' | 'error' | 'success';
  onDismiss?: () => void;
  actionLabel?: ReactNode;
  secondaryAction?: { label: string; onClick: () => void };
  actionRef?: Ref<HTMLButtonElement>;
  className?: string;
}

export function FeedbackCard({ title, children, tone = 'info', onDismiss, actionLabel = 'Got it', actionRef, secondaryAction, className }: FeedbackProps) {
  const titleId = useId();
  const outcomeId = useId();
  const descriptionId = useId();
  const outcome = tone === 'error' ? 'Correction' : tone === 'success' ? 'Success' : undefined;
  const action = onDismiss && <Button ref={actionRef} variant={tone === 'success' ? 'primary' : 'secondary'}
    aria-describedby={children ? `${titleId} ${descriptionId}` : titleId}
    attention={tone === 'success'} onClick={onDismiss}>{actionLabel}</Button>;
  return (
    <section aria-labelledby={titleId} aria-describedby={outcome ? outcomeId : undefined}
      className={classes('ui-feedback', className)} data-tone={tone}>
      <StatusMark key={tone + title} tone={tone} />
      <Stack className="ui-feedback-copy">
        {outcome && <span className="sr-only" id={outcomeId}>{outcome}</span>}
        <Heading level={2} id={titleId}>{title}</Heading>
        {children && <div id={descriptionId} className="ui-text ui-muted">{children}</div>}
      </Stack>
      {secondaryAction ? <Cluster className="ui-feedback-actions">
        <Button onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>{action}
      </Cluster> : action}
    </section>
  );
}
