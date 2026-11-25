'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, GeometryInputOptions, StableLabel, StageCorrection, StageNote, useGeometryInputPreference } from '../../ui';
import { describePreviewBalls, type CorrectionTarget } from '../../scene/SpriteScene';
import { RELEASE_EVENTS, getReleaseEvent, releasePhase, releasePreview, releasePreviewPose, type ThrowNumber } from '../../scene/motion';
import { compareArcHeight } from '../../scene/geometry-limits';
import { FramePicker } from './FramePicker';
import { correctGeometry, initialGeometry } from '../toss-geometry';
import { throwQuizCopy } from '../curriculum';
import { QuizSubmit, QuizSuccess, type QuizProgress, type QuizProps } from './QuizFeedback';
import { ScenePanel } from '../ScenePanel';
import './choice-quiz.css';

type Replay = { mode: 'preview' | 'submit'; elapsed: number; finished: boolean };
type Issue = { title: string; hint: string; target: CorrectionTarget };

export function ReleaseTimingQuiz({ title, throwNumber, onNext, onQuizPassed }: QuizProps & { throwNumber: ThrowNumber }) {
  const [part, setPart] = useState<'arc' | 'timing'>('arc');
  const [frame, setFrame] = useState(0);
  const [apex, setApex] = useState(initialGeometry.apex);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [result, setResult] = useState<QuizProgress>('answering');
  const input = useGeometryInputPreference();
  const timeline = useRef<HTMLInputElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const animation = useRef(0);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);
  const timing = part === 'timing';
  const arcBall = throwNumber === 2 ? 1 : 2;
  const copy = throwQuizCopy[throwNumber];
  const event = RELEASE_EVENTS[frame];
  const descriptions = RELEASE_EVENTS.map(option => copy.frames[option.id]);
  const preview = useMemo(() => releasePreview(throwNumber, event), [throwNumber, event]);
  const playing = replay !== null && !replay.finished;
  const passedTiming = event.id === throwQuizCopy.correctRelease.id;
  const reviewTime = preview.contact ?? (passedTiming ? preview.passing : undefined) ?? preview.release;
  const graded = replay?.mode === 'submit' && replay.elapsed === reviewTime;
  const encounter = !graded ? undefined : preview.contact !== undefined ? 'contact'
    : passedTiming && preview.passing !== undefined ? 'clear' : 'release';

  function stop() {
    cancelAnimationFrame(animation.current);
    setReplay(null);
  }

  function reset() {
    stop();
    setPart('arc');
    setFrame(0);
    setApex(initialGeometry.apex);
    setIssue(null);
    setResult('answering');
    setNotesOpen(true);
    requestAnimationFrame(() => submit.current?.focus());
  }

  function gradeTiming() {
    if (passedTiming) {
      setResult('celebrate');
      onQuizPassed?.();
    } else {
      const early = event.beat < throwQuizCopy.correctRelease.beat;
      setIssue({
        target: 'ball', title: early ? throwQuizCopy.earlyTitle : throwQuizCopy.lateTitle,
        hint: preview.contact !== undefined ? copy.collision : early ? copy.early : copy.late,
      });
    }
  }

  function play(mode: Replay['mode']) {
    stop();
    setIssue(null);
    setNotesOpen(false);
    const submitting = mode === 'submit';
    // Give each selection the same slow-motion window following its release.
    // Hold the balls at first contact for the remainder of that window.
    const start = submitting ? 0 : preview.release;
    const end = submitting ? reviewTime : start + 0.65;
    function display(time: number, finished: boolean) {
      setReplay({ mode, elapsed: Math.min(time, end, preview.contact ?? Infinity), finished });
    }
    if (submitting && (replay?.finished || window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      display(end, true);
      gradeTiming();
      return;
    }
    display(start, false);
    let last: number | undefined;
    let milliseconds = 0;
    function tick(now: number) {
      milliseconds += last === undefined ? 0 : Math.min(now - last, 80);
      last = now;
      const time = start + milliseconds / 1500;
      // On Submit, hold the marked pose briefly before opening the feedback.
      const finished = time >= end + (submitting ? 0.55 : 0);
      display(time, finished);
      if (!finished) animation.current = requestAnimationFrame(tick);
      else if (submitting) gradeTiming();
    }
    animation.current = requestAnimationFrame(tick);
  }

  function check() {
    if (timing) { play('submit'); return; }
    setNotesOpen(false);
    if (height !== 'at') {
      setIssue({ target: 'apex', ...(height === 'below' ? throwQuizCopy.low : throwQuizCopy.high) });
    } else {
      setApex(correctGeometry.apex);
      setIssue(null);
      setPart('timing');
      setNotesOpen(true);
      requestAnimationFrame(() => timeline.current?.focus());
    }
  }

  function selectFrame(value: number) {
    stop();
    setFrame(value);
    setIssue(null);
    setResult('answering');
  }

  const previewSummary = replay?.mode === 'preview' && replay.finished
    ? describePreviewBalls(releasePreviewPose(throwNumber, event, replay.elapsed)) : undefined;
  const { contact, clear } = throwQuizCopy;
  const height = compareArcHeight(apex);
  const observation = !timing ? `Peak ${height} eye level.` : encounter === 'contact' ? contact
    : encounter === 'clear' ? clear : descriptions[frame];

  return <ScenePanel title={title} guided allowSide={false}
    scene={{ count: throwNumber, faded: true, pattern: throwNumber === 3 ? 'three-throws' : undefined,
      spacing: correctGeometry.spacing, apex, arcBall,
      phase: releasePhase(throwNumber, timing ? event : getReleaseEvent('apex')), waitingForThrow: replay === null,
      releasePreview: replay ? { event, elapsed: replay.elapsed, encounter } : undefined,
      highlight: timing && replay === null ? throwNumber === 2 ? 'first-ball' : 'second-ball' : undefined,
      onGeometryChange: timing ? undefined : (_, value) => { setApex(value); setIssue(null); },
      correction: issue?.target, correctionBallIndex: arcBall - 1 }}
    correction={issue && <StageCorrection title={issue.title} target={issue.target}
      onDismiss={() => { stop(); setIssue(null); (timing ? timeline : submit).current?.focus(); }}>{issue.hint}</StageCorrection>}
    note={!issue && <StageNote title={timing ? throwQuizCopy.timingPrompt : throwQuizCopy.arcPrompt}
      progress={timing ? 'Part 2 of 2' : 'Part 1 of 2'} open={notesOpen} onOpenChange={setNotesOpen} triggerLabel="Quiz notes">
      {timing ? copy.timingInstruction : copy.arcInstruction}
    </StageNote>}
    toolbar={<div data-correction-avoid className="throw-quiz-controls">
      <div className="throw-timing">
        {timing ? <FramePicker inputRef={timeline} label={copy.timingLabel} frame={frame} descriptions={descriptions} onChange={selectFrame} showStops /> : <>
          <span className="ui-label">Arc height</span>
          <GeometryInputOptions {...input} apex={apex} onApexChange={value => { setApex(value); setIssue(null); }} />
        </>}
        <span className="ui-caption" role="status">
          <StableLabel alternatives={[...descriptions, contact, clear]}>{observation}</StableLabel>
          {previewSummary && <span className="sr-only"> Preview finished. {previewSummary}</span>}
        </span>
      </div>
      <div className="throw-actions">
        {timing ? <Button onClick={() => playing ? stop() : play('preview')} reserveLabels={['Preview', 'Replay', 'Stop']}>
          {playing ? 'Stop' : replay?.finished ? 'Replay' : 'Preview'}
        </Button> : <span className="ui-button throw-preview-space" aria-hidden="true">Preview</span>}
        <QuizSubmit ref={submit} passed={result !== 'answering'} disabled={playing} onSubmit={check} onNext={onNext} />
      </div>
    </div>}>
    {result === 'celebrate' && <QuizSuccess onNext={onNext} onDismiss={() => { setResult('passed'); requestAnimationFrame(() => submit.current?.focus()); }} onRetry={reset}>
      {copy.success}
    </QuizSuccess>}
  </ScenePanel>;
}
