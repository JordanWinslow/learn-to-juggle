'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { GEOMETRY_LIMITS, geometryArrow } from '../scene/geometry-limits';
import { Button, Checkbox, Cluster, ControlGroup, Range, classes } from './primitives';

export type View = 'front' | 'side';
export function ViewSwitch({ value, onChange, className }: { value: View; onChange: (view: View) => void; className?: string }) {
  return (
    <div role="group" aria-label="View" className={classes('ui-view-switch', className)}>
      {(['front', 'side'] as const).map(view => (
        <Button key={view} variant="quiet" aria-pressed={view === value} onClick={() => onChange(view)}>
          {view === 'front' ? 'Front' : 'Side'}
        </Button>
      ))}
    </div>
  );
}

export { GEOMETRY_LIMITS };

export interface GeometryControlProps {
  spacing?: number;
  apex: number;
  onSpacingChange?: (value: number) => void;
  onApexChange: (value: number) => void;
  className?: string;
}

export function GeometryControls({ spacing = 0, apex, onSpacingChange, onApexChange, className }: GeometryControlProps) {
  const h = GEOMETRY_LIMITS.apex;
  const w = GEOMETRY_LIMITS.spacing;
  const help = useId();
  function adjust(key: string, fine = false) {
    const change = geometryArrow(key, fine, { apex, spacing: onSpacingChange ? spacing : undefined });
    if (!change) return;
    if (change.field === 'apex') {
      if (change.value !== apex) onApexChange(change.value);
    } else if (change.value !== spacing) onSpacingChange?.(change.value);
  }

  // Keep the current button focusable at a limit so the opposite arrow always works.
  return (
    <div data-correction-avoid role="group" aria-label="Geometry adjustments" aria-describedby={help} className={classes('ui-geometry', className)}
      onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        adjust(event.key, event.shiftKey);
      }}>
      <span id={help} className="sr-only">Up and down adjust the peak. {onSpacingChange && 'Left and right adjust hand spacing. '}Hold Shift for smaller adjustments.</span>
      <ControlGroup label="Arc height">
        <Button aria-label="Lower" aria-disabled={apex >= h.max} aria-keyshortcuts="ArrowDown" onClick={() => adjust('ArrowDown')}><span aria-hidden="true">↓</span><span className="ui-arrow-label">Lower</span></Button>
        <Button aria-label="Higher" aria-disabled={apex <= h.min} aria-keyshortcuts="ArrowUp" onClick={() => adjust('ArrowUp')}><span aria-hidden="true">↑</span><span className="ui-arrow-label">Higher</span></Button>
      </ControlGroup>
      {onSpacingChange && <ControlGroup label="Hand spacing">
        <Button aria-label="Closer" aria-disabled={spacing <= w.min} aria-keyshortcuts="ArrowLeft" onClick={() => adjust('ArrowLeft')}><span aria-hidden="true">←</span><span className="ui-arrow-label">Closer</span></Button>
        <Button aria-label="Wider" aria-disabled={spacing >= w.max} aria-keyshortcuts="ArrowRight" onClick={() => adjust('ArrowRight')}><span className="ui-arrow-label">Wider</span><span aria-hidden="true">→</span></Button>
      </ControlGroup>}
    </div>
  );
}

const speeds = [1, 0.5, 0.25] as const;
export type PlaybackSpeed = typeof speeds[number];
const speedLabels = { 1: '1×', 0.5: '½×', 0.25: '¼×' } as const;
const speedNames = { 1: 'normal', 0.5: 'half', 0.25: 'quarter' } as const;
const allSpeedLabels = Object.values(speedLabels);
const playLabels = ['Play', 'Pause'];
const transportSteps = 1000;

export interface TransportProps {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  phase: number;
  onPhaseChange: (phase: number) => void;
  className?: string;
}

export function MotionTransport({ playing, onPlayingChange, speed, onSpeedChange, phase, onPhaseChange, className }: TransportProps) {
  const slider = useRef<HTMLInputElement>(null);
  const gesture = useRef<{ pointerId: number; bounds: DOMRect } | null>(null);
  const [initialValue] = useState(() => Math.round(phase * transportSteps));
  const nextSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];

  // Keep the painted thumb attached to the pointer even while a parent is
  // rendering the scene. The native range still handles keyboard and AT input.
  useLayoutEffect(() => {
    if (slider.current && !gesture.current) {
      slider.current.valueAsNumber = Math.round(phase * transportSteps);
    }
  }, [phase]);

  function seek(x: number) {
    if (!slider.current || !gesture.current) return;
    const { left, width } = gesture.current.bounds;
    if (!width) return;
    const fraction = Math.max(0, Math.min(1, (x - left) / width));
    const position = Math.round(fraction * transportSteps);
    if (slider.current.valueAsNumber === position) return;
    slider.current.valueAsNumber = position;
    onPhaseChange(position / transportSteps);
  }

  return (
    <div role="group" aria-label="Motion" className={classes('ui-transport', className)}>
      <Button reserveLabels={playLabels} onClick={() => onPlayingChange(!playing)}>{playing ? 'Pause' : 'Play'}</Button>
      <Button reserveLabels={allSpeedLabels} aria-label={`${speedLabels[speed]} ${speedNames[speed]} speed. Change to ${speedNames[nextSpeed]} speed`} onClick={() => onSpeedChange(nextSpeed)}>
        {speedLabels[speed]}
      </Button>
      <div className="ui-scrubber"
        onPointerDown={e => {
          if (!e.isPrimary || e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          gesture.current = { pointerId: e.pointerId, bounds: e.currentTarget.getBoundingClientRect() };
          slider.current?.focus({ preventScroll: true });
          if (playing) onPlayingChange(false);
          seek(e.clientX);
        }}
        onPointerMove={e => { if (gesture.current?.pointerId === e.pointerId) seek(e.clientX); }}
        onPointerUp={e => {
          if (gesture.current?.pointerId !== e.pointerId) return;
          seek(e.clientX);
          gesture.current = null;
        }}
        onLostPointerCapture={e => { if (gesture.current?.pointerId === e.pointerId) gesture.current = null; }}>
        <Range ref={slider} label="Motion position" defaultValue={initialValue} min={0} max={transportSteps} step={1}
          aria-valuetext={Math.round(phase * 100) + '% of loop'}
          onChange={e => {
            if (playing) onPlayingChange(false);
            onPhaseChange(e.currentTarget.valueAsNumber / transportSteps);
          }} />
      </div>
    </div>
  );
}

export interface VisibilityProps {
  showBall: boolean;
  showPath: boolean;
  onBallChange: (value: boolean) => void;
  onPathChange: (value: boolean) => void;
  className?: string;
}

export function VisibilityControls({ showBall, showPath, onBallChange, onPathChange, className }: VisibilityProps) {
  return (
    <Cluster role="group" aria-label="Visible elements" className={className}>
      <Checkbox label="Ball" checked={showBall} onChange={e => onBallChange(e.currentTarget.checked)} />
      <Checkbox label="Path" checked={showPath} onChange={e => onPathChange(e.currentTarget.checked)} />
    </Cluster>
  );
}
