import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import Link from 'next/link';

export function classes(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ');
}

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'quiet';
  attention?: boolean;
  /** Reserve the widest possible label for a control whose text changes. */
  reserveLabels?: readonly string[];
};

export function StableLabel({ alternatives, children }: { alternatives: readonly string[]; children: ReactNode }) {
  return (
    <span className="ui-stable-label">
      {alternatives.map(label => <span key={label} aria-hidden="true" data-reserve={label} />)}
      <span>{children}</span>
    </span>
  );
}

export function ForwardLabel({ children }: { children: string }) {
  return <span>{children} <span aria-hidden="true">→</span></span>;
}

export function Button({ variant = 'secondary', attention = false, reserveLabels, type = 'button', className, children, ...props }: ButtonProps) {
  return (
    <button type={type} className={classes('ui-button', attention && 'ui-attention', className)} data-variant={variant} {...props}>
      {reserveLabels?.length ? (
        <StableLabel alternatives={reserveLabels}>{children}</StableLabel>
      ) : children}
    </button>
  );
}

type ButtonLinkProps = ComponentPropsWithRef<typeof Link> & Pick<ButtonProps, 'variant'>;

export function ButtonLink({ variant = 'secondary', className, ...props }: ButtonLinkProps) {
  return <Link className={classes('ui-button', className)} data-variant={variant} {...props} />;
}

type BoxProps = ComponentPropsWithRef<'div'>;

export function Stack({ className, ...props }: BoxProps) {
  return <div className={classes('ui-stack', className)} {...props} />;
}

/** Align a page heading and its supporting paragraphs to the same reading edge. */
export function ReadingSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="ui-reading">
      <Heading level={1} id={id}>{title}</Heading>
      {children}
    </section>
  );
}

export function Cluster({ className, ...props }: BoxProps) {
  return <div className={classes('ui-cluster', className)} {...props} />;
}

export function Surface({ className, ...props }: BoxProps) {
  return <div className={classes('ui-surface', className)} {...props} />;
}

export function Heading({ level = 2, className, ...props }: ComponentPropsWithRef<'h2'> & { level?: 1 | 2 | 3 | 4 }) {
  const Tag = ({ 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' } as const)[level];
  return <Tag className={classes('ui-heading', className)} {...props} />;
}

export function Text({ muted = false, className, ...props }: ComponentPropsWithRef<'p'> & { muted?: boolean }) {
  return <p className={classes('ui-text', muted && 'ui-muted', className)} {...props} />;
}

export function Caption({ className, ...props }: ComponentPropsWithRef<'span'>) {
  return <span className={classes('ui-caption', className)} {...props} />;
}

export function LabelText({ className, ...props }: ComponentPropsWithRef<'span'>) {
  return <span className={classes('ui-label', className)} {...props} />;
}

export function ControlGroup({ label, children, className, ...props }: ComponentPropsWithRef<'fieldset'> & { label: string }) {
  return (
    <fieldset className={classes('ui-group', className)} {...props}>
      <legend>{label}</legend>
      <Cluster>{children}</Cluster>
    </fieldset>
  );
}

type LabeledInput = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
  label: string;
};

function ChoiceInput({ type, label, className, ...props }: LabeledInput & { type: 'checkbox' | 'radio' }) {
  return (
    <label className={classes('ui-choice', type === 'checkbox' && 'ui-checkbox', className)}>
      <input type={type} {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Checkbox(props: LabeledInput) {
  return <ChoiceInput type="checkbox" {...props} />;
}

export function RadioChoice(props: LabeledInput) {
  return <ChoiceInput type="radio" {...props} />;
}

export function Range({ label, id, className, ...props }: LabeledInput) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <span className={classes('ui-range', className)}>
      <label className="sr-only" htmlFor={inputId}>{label}</label>
      <input id={inputId} type="range" {...props} />
    </span>
  );
}

export function StatusMark({ tone }: { tone: 'info' | 'error' | 'success' }) {
  const shapes: Record<typeof tone, ReactNode> = {
    info: <><circle cx="12" cy="7" r="1" /><path d="M12 11v6" /></>,
    error: <><path pathLength="1" d="m7 7 10 10" /><path pathLength="1" d="M17 7 7 17" /></>,
    success: <><path pathLength="1" d="m5 12 5 5" /><path pathLength="1" d="m10 17 9-10" /></>,
  };
  return (
    <svg aria-hidden="true" className="ui-status-mark" data-tone={tone} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      {shapes[tone]}
    </svg>
  );
}
