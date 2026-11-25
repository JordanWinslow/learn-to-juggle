'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PHASE_BADGE_STEPS, PHASES, STEP_LABEL } from '../lessons/curriculum';
import { Button, classes } from './primitives';

type PhaseDockProps = {
  value: number;
  onChange: (index: number) => void;
  completed?: readonly string[];
  lessonPicker?: { openPhase: number | null; id: string };
  className?: string;
};

function PhaseArt({ index }: { index: number }) {
  return (
    <span className="ui-phase-art" aria-hidden="true" data-phase={index}>
      {Array.from({ length: PHASES[index].balls }, (_, i) => <span key={i} />)}
    </span>
  );
}

export function PhaseDock({ value, onChange, completed = [], lessonPicker, className }: PhaseDockProps) {
  const [preview, setPreview] = useState<number | null>(null);
  const dismissal = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(dismissal.current), []);

  function inspect(index: number | null) {
    clearTimeout(dismissal.current);
    setPreview(index);
  }

  return (
    <nav aria-label="Course phases" className={classes('ui-dock', className)}
      onPointerLeave={event => { if (event.pointerType !== 'touch') inspect(null); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) inspect(null); }}
      onKeyDown={event => { if (event.key === 'Escape') inspect(null); }}>
      {PHASES.map(({ id, name }, index) => (
        <Button key={id} variant="quiet" aria-label={name} aria-current={value === index ? 'step' : undefined}
          data-phase-id={id} data-complete={completed.includes(id) || undefined}
          aria-description={completed.includes(id) ? `${STEP_LABEL[PHASE_BADGE_STEPS[index].kind]} complete` : undefined}
          aria-expanded={lessonPicker ? lessonPicker.openPhase === index : undefined}
          aria-controls={lessonPicker?.openPhase === index ? lessonPicker.id : undefined}
          data-preview={preview === index || undefined}
          onPointerEnter={event => { if (event.pointerType !== 'touch') inspect(index); }}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) inspect(index); }}
          onPointerDown={event => { if (event.pointerType === 'touch') inspect(index); }}
          onPointerUp={event => {
            if (event.pointerType === 'touch') dismissal.current = setTimeout(() => inspect(null), 2000);
          }}
          onPointerCancel={() => inspect(null)}
          onClick={() => onChange(index)}>
          <PhaseArt index={index} />
          {completed.includes(id) && <span className="ui-dock-check" aria-hidden="true">✓</span>}
        </Button>
      ))}
      {preview !== null && lessonPicker?.openPhase == null && (
        <div className="ui-dock-preview" aria-hidden="true"
          style={{ '--dock-slot': `${100 * (preview + 0.5) / PHASES.length}%` } as CSSProperties}>
          <span className="ui-dock-caption ui-caption">{PHASES[preview].name}{completed.includes(PHASES[preview].id) && ' · Complete'}</span>
          <PhaseArt index={preview} />
        </div>
      )}
    </nav>
  );
}
