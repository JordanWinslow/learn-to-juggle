'use client';

import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FeedbackCard, type FeedbackProps } from './feedback';
import { Button, Cluster, Heading, StatusMark } from './primitives';
import './lesson-layers.css';

export interface StageNoteProps {
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAcknowledge?: () => void;
  actionLabel?: ReactNode;
  actionName?: string;
  keepOpen?: boolean;
  actionPending?: boolean;
  progress?: string;
  triggerLabel?: string;
}

/** Place immediately after the picture inside its positioned stage wrapper. */
export function StageNote({
  title, children, open, onOpenChange, onAcknowledge, actionLabel = 'Got it', actionName,
  keepOpen = false, actionPending = false, progress, triggerLabel,
}: StageNoteProps) {
  const [localOpen, setLocalOpen] = useState(true);
  const expanded = open ?? localOpen;
  const titleId = useId();
  const shell = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const previousBounds = useRef<DOMRect | null>(null);

  function change(open: boolean) {
    previousBounds.current = shell.current?.getBoundingClientRect() ?? null;
    setLocalOpen(open);
    onOpenChange?.(open);
  }

  useLayoutEffect(() => {
    const from = previousBounds.current;
    previousBounds.current = null;
    if (!from || !shell.current) return;
    action.current?.focus({ preventScroll: true });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = shell.current.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const duration = parseFloat(getComputedStyle(shell.current).getPropertyValue('--duration-feedback')) || 240;
    const animation = shell.current.animate([
      { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.72 },
      { transform: 'translate(0, 0)', opacity: 1 },
    ], { duration, easing: 'ease-out' });
    return () => animation.cancel();
  }, [expanded]);

  return (
    <div className="ui-note-slot">
      <div ref={shell} className="ui-stage-note" data-open={expanded}>
        {expanded ? (
          <section className="ui-note-card" aria-labelledby={titleId}
            onKeyDown={event => {
              if (event.key === 'Escape') { event.stopPropagation(); change(false); }
            }}>
            <div className="ui-note-title" aria-live={progress ? 'polite' : undefined} aria-atomic="true">
              {progress && <small className="ui-caption">{progress}</small>}
              <Heading level={2} id={titleId}>{title}</Heading>
            </div>
            <div className="ui-note-body ui-text">{children}</div>
            <Cluster className="ui-note-actions">
              <Button ref={action} aria-label={actionName} aria-disabled={actionPending || undefined}
                aria-expanded={keepOpen ? undefined : true} onClick={() => {
                  if (actionPending) return;
                  onAcknowledge?.();
                  if (!keepOpen) change(false);
                }}>{actionLabel}</Button>
            </Cluster>
          </section>
        ) : (
          <Button ref={action} variant="quiet" aria-expanded={false} onClick={() => change(true)}>
            <StatusMark tone="info" /> {triggerLabel ?? title}
          </Button>
        )}
      </div>
    </div>
  );
}

// Particles start around the card perimeter and travel outward. Fixed angles
// keep the celebration identical across server rendering and hydration.
const confetti = Array.from({ length: 40 }, (_, i) => {
  const angle = i * Math.PI * 2 / 40;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const distance = 6 + i % 5;
  return {
    left: `${50 + 48 * x}%`,
    top: `${50 + 48 * y}%`,
    '--burst-x': `${(x * distance).toFixed(2)}rem`,
    '--burst-y': `${(y * distance).toFixed(2)}rem`,
    '--burst-spin': `${(i % 2 ? 1 : -1) * (55 + i * 9)}deg`,
    '--burst-delay': `${(i % 3) * 75}ms`,
  } as CSSProperties;
});

export interface LessonDialogProps {
  tone: 'success' | 'error';
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  actionLabel?: ReactNode;
  onAction?: () => void;
  secondaryAction?: FeedbackProps['secondaryAction'];
}

// A course can keep its navigation in the browser's active top layer.
export const DialogFooterHost = createContext<((element: HTMLDivElement | null) => void) | null>(null);

/** Mount to open. The native dialog keeps the underlying exercise inert. */
export function LessonDialog({ tone, title, children, onDismiss, actionLabel = 'Got it', onAction, secondaryAction }: LessonDialogProps) {
  const registerFooter = useContext(DialogFooterHost);
  const dialog = useRef<HTMLDialogElement>(null);
  const descriptionId = useId();
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog ref={dialog} className="ui-lesson-dialog" aria-label={title} aria-describedby={descriptionId}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:enabled, a[href], input:enabled, select:enabled, textarea:enabled, [tabindex="0"]',
        );
        const first = controls[0], last = controls[controls.length - 1];
        const edge = event.shiftKey ? first : last;
        if (edge && document.activeElement === edge) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
      }}
      onCancel={event => { event.preventDefault(); onDismiss(); }}>
      <div className="ui-dialog-content">
        {tone === 'success' && (
          <div className="ui-confetti" aria-hidden="true">
            {confetti.map((style, i) => <i key={i} style={style} />)}
          </div>
        )}
        <FeedbackCard className="ui-dialog-card" title={title} tone={tone} secondaryAction={secondaryAction}
          onDismiss={onAction ?? onDismiss} actionLabel={actionLabel}>
          <div id={descriptionId}>{children}</div>
        </FeedbackCard>
        {onAction && (
          <Button variant="quiet" className="ui-dialog-close" aria-label="Dismiss" onClick={onDismiss}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m5 5 10 10 M15 5 5 15" />
            </svg>
          </Button>
        )}
      </div>
      {registerFooter && <div className="ui-dialog-footer-slot" ref={registerFooter} />}
    </dialog>
  );
}
