'use client';

import { useMemo, useState } from 'react';
import type { SpriteSceneProps } from '../scene';
import { GripIllustration } from '../scene/GripIllustration';
import { loopDuration } from '../scene/motion';
import { ButtonWithHint, Cluster, ForwardLabel, StageNote, type PlaybackSpeed } from '../ui';
import { LearnerGreeting } from '../ui/coach-message';
import { gripQuizCopy, type TeachingCue } from './curriculum';
import { correctGeometry } from './toss-geometry';
import { ScenePanel } from './ScenePanel';
import { useNextStepLabel } from './StepHeading';
import { usePlayback } from './usePlayback';

type Props = {
  title: string;
  cues: readonly TeachingCue[];
  count?: SpriteSceneProps['count'];
  pattern?: SpriteSceneProps['pattern'];
  initialSpeed?: PlaybackSpeed;
  greeting?: boolean;
  onNext: () => void;
};

export function GuidedLesson({ title, cues, count = 1, pattern, initialSpeed = 1, greeting, onNext }: Props) {
  const nextLabel = useNextStepLabel();
  const [open, setOpen] = useState(true);
  const cuePhases = useMemo(() => cues.map(cue => cue.pauseAt), [cues]);
  const motion = usePlayback({
    initialSpeed, initialPhase: cues[0].pauseAt, duration: loopDuration(pattern, count), cuePhases,
  });
  const index = motion.cueIndex;
  const cue = cues[index];
  const next = cues[index + 1];
  // Show a new angle as the movement begins. Otherwise hold the current cue until arrival.
  const sceneCue = motion.approachingCue && next && cue.view !== next.view ? next : cue;
  const showCue = open || !motion.cuesComplete;
  const showGrip = showCue && cue.showGrip && !motion.playing && motion.phase === cue.pauseAt;

  function openNotes(value: boolean) {
    if (motion.cuesComplete) {
      if (value) motion.goToCue(0, false);
      else motion.finishCues();
    }
    setOpen(value);
  }

  return (
    <ScenePanel title={title} guided picture={showGrip ? <GripIllustration description={gripQuizCopy.picture} selected={1} /> : undefined}
      scene={{ ...correctGeometry, count, pattern, view: showCue ? sceneCue.view : undefined, phase: motion.phase,
        highlight: showCue ? sceneCue.target : undefined, faded: open && sceneCue.target !== 'elbow' }}
      playback={motion} allowVisibility
      note={<StageNote title={cue.title} open={open} onOpenChange={openNotes}
        triggerLabel={motion.cuesComplete ? 'Review cues' : 'Lesson notes'} progress={`Cue ${index + 1} of ${cues.length}`}
        actionLabel={next ? <ForwardLabel>Next cue</ForwardLabel> : 'Got it'}
        actionName={next ? `Next cue, ${next.title}` : undefined}
        keepOpen={!!next} actionPending={motion.approachingCue}
        onAcknowledge={() => {
          if (next) motion.goToCue(index + 1);
          else if (!motion.cuesComplete) motion.finishCues();
        }}>
        <span aria-live="polite" aria-atomic="true">{greeting && index === 0 && <><LearnerGreeting occasion="firstLesson" /> </>}{cue.text}</span>
      </StageNote>}
      toolbar={<Cluster className="lesson-advance">
        <ButtonWithHint disabledReason={motion.cuesComplete ? undefined : 'Read each cue, then choose “Got it” to continue.'} onClick={onNext}>
          <ForwardLabel>{nextLabel}</ForwardLabel>
        </ButtonWithHint>
      </Cluster>}
    />
  );
}
