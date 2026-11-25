'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { ELBOW, GUIDE_PHASES, type Geometry } from '../../scene/motion';
import { compareArcHeight } from '../../scene/geometry-limits';
import { Caption, GeometryInputOptions, StageCorrection, StageNote, useGeometryInputPreference } from '../../ui';
import { QuizSubmit, QuizSuccess, type QuizProps } from './QuizFeedback';
import { geometryQuizCopy } from '../curriculum';
import { assessGeometry, initialGeometry, initialQuizState, quizReducer } from '../toss-geometry';
import { ScenePanel } from '../ScenePanel';
import { usePlayback } from '../usePlayback';

export function TossGeometryQuiz({ title, onNext, onQuizPassed }: QuizProps) {
  const [state, dispatch] = useReducer(quizReducer, initialGeometry, initialQuizState);
  const [successDismissed, dismissSuccess] = useState(false);
  const [noteOpen, setNoteOpen] = useState(true);
  const { geometry, issues, status } = state;
  const issue = issues[0];
  const motion = usePlayback({ initialPhase: GUIDE_PHASES.apex / 2 });
  const input = useGeometryInputPreference();
  const action = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (restoreFocus.current && action.current) {
      action.current.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [status, successDismissed]);

  function adjust(field: keyof Geometry, value: number) {
    dispatch({ type: 'set', field, value });
  }
  function check() {
    setNoteOpen(false);
    dismissSuccess(false);
    if (!assessGeometry(geometry).length) onQuizPassed?.();
    dispatch({ type: 'submit' });
  }
  const height = compareArcHeight(geometry.apex);
  const shoulders = ELBOW.left - ELBOW.right;
  const width = Math.round((shoulders + 2 * geometry.spacing) / shoulders * 100);
  return (
    <ScenePanel title={title}
      scene={{ ...geometry, phase: motion.phase, correction: issue?.target, onGeometryChange: adjust }}
      playback={motion}
      note={issue ? <StageCorrection key={issue.target} title={issue.title} target={issue.target}
          onDismiss={() => {
            restoreFocus.current = issues.length === 1;
            dispatch({ type: 'acknowledge', target: issue.target });
          }}>
          {issue.explanation}
          {state.feedbackTotal > 1 && <Caption className="block">{state.feedbackTotal - issues.length + 1} of {state.feedbackTotal}</Caption>}
        </StageCorrection> : <StageNote title={geometryQuizCopy.prompt} open={noteOpen} onOpenChange={setNoteOpen}>
          {geometryQuizCopy.instruction}
        </StageNote>}
      toolbar={
        <div className="lesson-adjustments">
          <GeometryInputOptions {...input} {...geometry}
            onSpacingChange={value => adjust('spacing', value)} onApexChange={value => adjust('apex', value)} />
          <QuizSubmit ref={action} passed={status === 'success'} onSubmit={check} onNext={onNext} />
          {input.useArrowButtons && <span className="sr-only" role="status">
            Peak {height} eye level. Hands at {width}% of shoulder width.
          </span>}
        </div>
      }>
      {status === 'success' && !successDismissed && <QuizSuccess onNext={onNext}
        onRetry={() => { dispatch({ type: 'retry' }); motion.onPhaseChange(GUIDE_PHASES.apex / 2); setNoteOpen(true); }}
        onDismiss={() => { restoreFocus.current = true; dismissSuccess(true); }}>
        {geometryQuizCopy.success}
      </QuizSuccess>}
    </ScenePanel>
  );
}
