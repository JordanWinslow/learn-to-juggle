'use client';

import { NEUTRAL_APEX, SpriteScene } from '../scene';
import { loopDuration } from '../scene/motion';
import { Button, Caption } from '../ui/primitives';
import { usePlayback } from '@/lessons/usePlayback';

export function CoachPreview() {
  const motion = usePlayback({ autoPlay: true, initialPhase: 0.12, initialSpeed: 0.5, duration: loopDuration(undefined, 3) });
  return (
    <figure className="welcome-coach">
      <SpriteScene spacing={0} apex={NEUTRAL_APEX} phase={motion.phase} count={3} showPath />
      <figcaption>
        <Caption>Three-ball cascade</Caption>
        <Button variant="quiet" reserveLabels={['Play', 'Pause']}
          aria-label={motion.playing ? 'Pause demonstration' : 'Play demonstration'}
          onClick={() => motion.onPlayingChange(!motion.playing)}>{motion.playing ? 'Pause' : 'Play'}</Button>
      </figcaption>
    </figure>
  );
}
