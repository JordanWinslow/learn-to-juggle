'use client';

import { useId, useRef, useState } from 'react';
import { GripIllustration } from '../../scene/GripIllustration';
import { ControlGroup, RadioChoice, StageCorrection, StageNote } from '../../ui';
import { correctGeometry } from '../toss-geometry';
import { gripQuizCopy } from '../curriculum';
import { QuizSubmit, QuizSuccess, type QuizProgress, type QuizProps } from './QuizFeedback';
import { ScenePanel } from '../ScenePanel';
import './choice-quiz.css';

export function GripQuiz({ title, onNext, onQuizPassed }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<QuizProgress | 'incorrect'>('answering');
  const error = result === 'incorrect';
  const firstOption = useRef<HTMLInputElement>(null);
  const group = useId();
  const question = gripQuizCopy.questions[index];

  function openQuestion(next: number) {
    setIndex(next);
    setSelected(null);
    setOpen(true);
    setResult('answering');
    requestAnimationFrame(() => firstOption.current?.focus());
  }

  function select(option: number) { setSelected(option); setResult('answering'); }

  function check() {
    if (selected === null) return;
    setOpen(false);
    if (selected !== question.answer) { setResult('incorrect'); return; }
    if (index + 1 < gripQuizCopy.questions.length) openQuestion(index + 1);
    else { setResult('celebrate'); onQuizPassed?.(); }
  }

  return <ScenePanel title={title} allowSide={false} guided scene={{ ...correctGeometry, phase: 0 }}
    picture={<GripIllustration description={gripQuizCopy.picture} selected={selected} onSelect={select} correction={error} />}
    note={!error && <StageNote title={question.title} triggerLabel="Quiz notes" open={open}
      onOpenChange={setOpen}>{question.instruction}</StageNote>}
    correction={error && <StageCorrection title={gripQuizCopy.correctionTitle} target="ball"
      onDismiss={() => setResult('answering')}>{question.hint}</StageCorrection>}
    toolbar={<div className="lesson-choice-quiz" data-correction-avoid>
      <ControlGroup label={question.prompt}>
        {gripQuizCopy.choices.map((pair, i) => <RadioChoice key={pair} ref={i === 0 ? firstOption : undefined}
          name={group} label={pair} checked={selected === i} onChange={() => select(i)} />)}
      </ControlGroup>
      <QuizSubmit passed={result === 'passed'} disabled={selected === null} onSubmit={check} onNext={onNext} />
    </div>}>
    {result === 'celebrate' && <QuizSuccess onNext={onNext} onRetry={() => openQuestion(0)} onDismiss={() => setResult('passed')}>
      {gripQuizCopy.success}
    </QuizSuccess>}
  </ScenePanel>;
}
