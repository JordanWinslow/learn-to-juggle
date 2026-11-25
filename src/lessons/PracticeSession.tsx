'use client';

import { useState } from 'react';
import { loopDuration, type BallCount } from '../scene/motion';
import type { PracticeRound } from './curriculum';
import { Button, Cluster, ForwardLabel, LessonDialog, StageNote } from '../ui';
import { CascadeCounter } from './CascadeCounter';
import { correctGeometry } from './toss-geometry';
import { ScenePanel } from './ScenePanel';
import { useNextStepLabel } from './StepHeading';
import { usePlayback } from './usePlayback';

type Props = {
  title: string;
  count: BallCount;
  rounds: readonly PracticeRound[];
  onGoalReached?: () => void;
  onComplete: () => void;
};

export function PracticeSession({ rounds, onComplete, onGoalReached, ...props }: Props) {
  const [index, setIndex] = useState(0);
  const courseLabel = useNextStepLabel();
  const nextRound = rounds[index + 1];
  const round = rounds[index];
  return <PracticeAttempt key={index} {...props} {...round}
    nextLabel={nextRound ? round.nextLabel ?? nextRound.instructionTitle : courseLabel}
    onGoalReached={nextRound ? undefined : onGoalReached}
    onComplete={nextRound ? () => setIndex(index + 1) : onComplete} />;
}

function PracticeAttempt({ title, instructionTitle, instruction, completion, count, pattern, cascadeGoal,
  nextLabel, recordLabel = 'I did it!', onGoalReached, onComplete }: Omit<Props, 'rounds'> & PracticeRound & { nextLabel: string }) {
  const [result, setResult] = useState<'ready' | 'practicing' | 'celebrate' | 'done'>('ready');
  const motion = usePlayback({ autoPlay: true, duration: loopDuration(pattern, count) });
  const continuous = pattern === 'continuous';
  const phase = continuous ? motion.phase + motion.loops : motion.phase;

  function recordPractice() {
    onGoalReached?.();
    setResult('celebrate');
  }

  return (
    <ScenePanel title={title} guided scene={{ ...correctGeometry, count, pattern, phase }}
      playback={motion} allowVisibility
      overlay={pattern && (cascadeGoal || continuous) && <CascadeCounter
        pattern={pattern} phase={motion.phase} loops={motion.loops} goal={cascadeGoal} />}
      note={<StageNote title={instructionTitle} progress="With your own balls"
        actionLabel={result === 'ready' ? 'Start practice' : 'Got it'}
        onAcknowledge={() => { if (result === 'ready') setResult('practicing'); }}>
        {instruction}
      </StageNote>}
      toolbar={<Cluster className="lesson-advance">
        <Button variant="primary" disabled={result === 'ready'} reserveLabels={[recordLabel, `${nextLabel} →`]}
          onClick={result === 'done' ? onComplete : recordPractice}>
          {result === 'done' ? <ForwardLabel>{nextLabel}</ForwardLabel> : recordLabel}
        </Button>
      </Cluster>}>
      {result === 'celebrate' && <LessonDialog tone="success" title="Practice complete" actionLabel={<ForwardLabel>{nextLabel}</ForwardLabel>}
        onDismiss={() => setResult('done')} onAction={onComplete}>{completion}</LessonDialog>}
    </ScenePanel>
  );
}
