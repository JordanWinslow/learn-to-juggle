'use client';

import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { LOOP_MS } from '../scene';
import type { PlaybackSpeed } from '../ui';

type Clock = {
  phase: number;
  loops: number;
  running: boolean;
  /** The learner's transport choice, independent of a teaching cue holding the clock. */
  manualPlay: boolean | null;
  speed: PlaybackSpeed;
  cueIndex: number;
  cuesComplete: boolean;
  stop: { phase: number; loop: number; cueIndex?: number } | null;
};
type ClockAction =
  | { type: 'frame'; elapsed: number; duration: number }
  | { type: 'play'; running: boolean; pausePoints?: readonly number[] }
  | { type: 'seek'; phase: number }
  | { type: 'cue'; from: number; to: number; index: number; animate: boolean }
  | { type: 'finishCues' }
  | { type: 'speed'; speed: PlaybackSpeed };

function clockReducer(s: Clock, a: ClockAction): Clock {
  switch (a.type) {
    case 'play': {
      let stop = s.stop;
      if (a.running && !s.cuesComplete && !stop && a.pausePoints?.length) {
        const ahead = a.pausePoints.filter(point => point > s.phase);
        const phase = Math.min(...(ahead.length ? ahead : a.pausePoints));
        stop = { phase, loop: s.loops + (ahead.length ? 0 : 1) };
      }
      return { ...s, running: a.running, manualPlay: a.running, stop };
    }
    case 'speed':
      return { ...s, speed: a.speed };
    case 'seek':
      return { ...s, phase: Math.max(0, Math.min(1, a.phase)), running: false, manualPlay: false, stop: null };
    case 'cue':
      if (!a.animate || a.from === a.to) {
        return { ...s, phase: a.to, cueIndex: a.index, running: false, stop: null };
      }
      return { ...s, phase: a.from, running: true,
        stop: { phase: a.to, loop: s.loops, cueIndex: a.index } };
    case 'finishCues':
      return { ...s, cuesComplete: true, running: s.manualPlay ?? true, stop: null };
    case 'frame': {
      if (!s.running) return s;
      const next = s.phase + a.elapsed * s.speed / a.duration;
      if (s.stop && s.loops + next >= s.stop.loop + s.stop.phase) {
        return { ...s, phase: s.stop.phase, loops: s.stop.loop, cueIndex: s.stop.cueIndex ?? s.cueIndex,
          running: false, stop: null };
      }
      return { ...s, phase: next % 1, loops: s.loops + Math.floor(next) };
    }
  }
}

const motionQuery = '(prefers-reduced-motion: reduce)';
const readPreference = () => window.matchMedia(motionQuery).matches;
function subscribePreference(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

type Options = {
  autoPlay?: boolean; initialPhase?: number; initialSpeed?: PlaybackSpeed; duration?: number;
  cuePhases?: readonly number[];
};

export function usePlayback({ autoPlay = false, initialPhase = 0, initialSpeed = 1, duration = LOOP_MS, cuePhases }: Options = {}) {
  const reduced = useSyncExternalStore(subscribePreference, readPreference, () => true);
  const [clock, dispatch] = useReducer(clockReducer, {
    phase: initialPhase, loops: 0, speed: initialSpeed, running: autoPlay, manualPlay: null,
    cueIndex: 0, cuesComplete: false, stop: null,
  });
  const playing = clock.running && (!reduced || clock.manualPlay === true);
  useEffect(() => {
    if (!playing) return;
    let request = 0;
    let previous: number | undefined;
    const tick = (now: number) => {
      if (previous !== undefined) {
        // A backgrounded tab should resume at the visible pose.
        dispatch({ type: 'frame', elapsed: Math.min(now - previous, 80), duration });
      }
      previous = now;
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, duration]);

  return {
    phase: clock.phase, speed: clock.speed, loops: clock.loops,
    reduced, playing, cueIndex: clock.cueIndex, cuesComplete: clock.cuesComplete,
    approachingCue: playing && clock.stop?.cueIndex !== undefined,
    finishCues: () => dispatch({ type: 'finishCues' }),
    onPlayingChange: (running: boolean) => dispatch({ type: 'play', running, pausePoints: cuePhases }),
    onPhaseChange: (phase: number) => dispatch({ type: 'seek', phase }),
    goToCue: (index: number, animate = true) => {
      if (!cuePhases || cuePhases[index] === undefined) return;
      const to = cuePhases[index], previous = cuePhases[clock.cueIndex];
      // A repeated teaching moment replays its approach from the beginning.
      const start = previous < to ? previous : 0;
      const from = clock.phase >= start && clock.phase <= to ? clock.phase : start;
      dispatch({ type: 'cue', from, to, index, animate: animate && !reduced });
    },
    onSpeedChange: (speed: PlaybackSpeed) => dispatch({ type: 'speed', speed }),
  };
}

export type Playback = ReturnType<typeof usePlayback>;
