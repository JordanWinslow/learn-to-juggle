'use client';

import { useRef, useState } from 'react';
import { Cluster, StageCorrection, StageNote } from '../../ui';
import { catchPhase } from '../../scene/motion';
import { FramePicker } from './FramePicker';
import { cascadeQuizCopy } from '../curriculum';
import { correctGeometry } from '../toss-geometry';
import { QuizSubmit, QuizSuccess, type QuizProgress, type QuizProps } from './QuizFeedback';
import { ScenePanel } from '../ScenePanel';

const { frames } = cascadeQuizCopy;
const descriptions = frames.map(frame => frame.description);

export function CascadeCountQuiz({ title, onNext, onQuizPassed }: QuizProps) {
  const [frame, setFrame] = useState(0);
  const [result, setResult] = useState<QuizProgress | 'incorrect'>('answering');
  const error = result === 'incorrect';
  const [open, setOpen] = useState(true);
  const slider = useRef<HTMLInputElement>(null);
  const selectedPhase = frames[frame].phase;
  const thirdCatch = catchPhase('six-throws', 3);
  function check() {
    setOpen(false);
    if (selectedPhase !== thirdCatch) { setResult('incorrect'); return; }
    setResult('celebrate');
    onQuizPassed?.();
  }
  function retry() {
    setFrame(0);
    setResult('answering');
    setOpen(true);
    requestAnimationFrame(() => slider.current?.focus());
  }
  return <ScenePanel title={title} guided
    scene={{ ...correctGeometry, count: 3, faded: true, pattern: 'six-throws', phase: selectedPhase,
      highlight: 'third-ball', correction: error ? 'ball' : undefined, correctionBallIndex: 2 }}
    note={!error && <StageNote title={cascadeQuizCopy.prompt} open={open} onOpenChange={setOpen} triggerLabel="Quiz notes">
      {cascadeQuizCopy.instruction}
    </StageNote>}
    correction={error && <StageCorrection target="ball" title={cascadeQuizCopy.correctionTitle}
      onDismiss={() => { setResult('answering'); slider.current?.focus(); }}>
      {selectedPhase < thirdCatch ? cascadeQuizCopy.early : cascadeQuizCopy.late}
    </StageCorrection>}
    toolbar={<Cluster className="lesson-frame-picker" data-correction-avoid>
      <FramePicker inputRef={slider} frame={frame} descriptions={descriptions}
        onChange={value => { setFrame(value); setResult('answering'); }} />
      <QuizSubmit passed={result === 'passed'} onSubmit={check} onNext={onNext} />
    </Cluster>}>
    {result === 'celebrate' && <QuizSuccess onRetry={retry} onDismiss={() => setResult('passed')} onNext={onNext}>
      {cascadeQuizCopy.success}
    </QuizSuccess>}
  </ScenePanel>;
}
