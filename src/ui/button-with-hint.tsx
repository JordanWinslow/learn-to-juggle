'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './primitives';

function positionHint(button: HTMLButtonElement, hint: HTMLElement) {
  const bounds = button.getBoundingClientRect();
  const width = button.ownerDocument.documentElement.clientWidth;
  const gap = 8;
  hint.style.left = `${Math.max(gap, Math.min(bounds.right - hint.offsetWidth, width - hint.offsetWidth - gap))}px`;
  hint.style.top = `${bounds.top >= hint.offsetHeight + gap ? bounds.top - hint.offsetHeight : bounds.bottom}px`;
}

/** A gated action stays in the tab order so its prerequisite can be discovered. */
export function ButtonWithHint({ children, disabledReason, onClick }: {
  children: ReactNode;
  disabledReason?: string;
  onClick: () => void;
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const hint = useRef<HTMLSpanElement>(null);

  function showHint() {
    if (!button.current || !hint.current) return;
    hint.current.showPopover();
    positionHint(button.current, hint.current);
  }

  // The top layer keeps the hint clear of scrolling control panels.
  useEffect(() => {
    if (!disabledReason) return;
    function reposition() {
      if (button.current && hint.current?.matches(':popover-open')) positionHint(button.current, hint.current);
    }
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
    };
  }, [disabledReason]);

  return <span className="ui-hint-anchor"
    onPointerEnter={event => { if (event.pointerType === 'mouse') showHint(); }}
    onPointerLeave={event => {
      if (event.pointerType === 'mouse' && document.activeElement !== button.current) hint.current?.hidePopover();
    }}>
    <Button variant="primary" ref={button} aria-disabled={disabledReason ? true : undefined}
      aria-describedby={disabledReason ? id : undefined} onFocus={showHint} onBlur={() => hint.current?.hidePopover()}
      onKeyDown={event => { if (event.key === 'Escape') hint.current?.hidePopover(); }}
      onClick={disabledReason ? showHint : onClick}>{children}</Button>
    {disabledReason && <span ref={hint} id={id} role="tooltip" popover="auto" className="ui-action-hint">{disabledReason}</span>}
  </span>;
}
