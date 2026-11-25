import { GEOMETRY_LIMITS, NEUTRAL_APEX } from './geometry-limits';

export { NEUTRAL_APEX } from './geometry-limits';

export type Hand = 'right' | 'left';
export type BallCount = 1 | 2 | 3;
export type DrillPattern = 'held-third' | 'three-throws' | 'six-throws' | 'nine-throws' | 'continuous';
export type Point = { x: number; y: number };
export type Geometry = { spacing: number; apex: number };
type Ball = Point & { heldBy: Hand | null };
export type ScenePose = { hands: Record<Hand, Point>; balls: Ball[] };

/** Native sprite coordinates. Jordan's right hand appears on the viewer's left. */
export const SPACING_LIMIT = GEOMETRY_LIMITS.spacing.max;
export const APEX_RANGE = GEOMETRY_LIMITS.apex;
export const ELBOW = { right: 58, left: 150, y: 194 } as const;
const BALL_AT_PALM = APEX_RANGE.max;

// One beat separates adjacent throws. At one beat, the previous ball is
// 60% of the way across: past the middle and just starting its descent.
const FLIGHT = 5 / 3;
const READY = 0.75;
const SINGLE_INTERVAL = 2.5;
const BEAT_MS = 510;
const TUCKED_OFFSET = 16;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const unit = (v: number) => clamp(v, 0, 1);
const wrap = (v: number) => v - Math.floor(v);
const smooth = (v: number) => { const t = unit(v); return t * t * (3 - 2 * t); };
const opposite = (hand: Hand): Hand => hand === 'right' ? 'left' : 'right';
const outward = (hand: Hand) => hand === 'right' ? -1 : 1;
const handFor = (first: Hand, i: number) => i % 2 === 0 ? first : opposite(first);

/** Small follow-through of the palm around its projected wrist, in degrees. */
export const palmTilt = (palmY: number) => (palmY - ELBOW.y) * 0.5;

export function boundedGeometry({ spacing, apex }: Geometry): Geometry {
  return {
    spacing: clamp(spacing, GEOMETRY_LIMITS.spacing.min, GEOMETRY_LIMITS.spacing.max),
    apex: clamp(apex, APEX_RANGE.min, APEX_RANGE.max),
  };
}

const finiteThrows = { 'held-third': 2, 'three-throws': 3, 'six-throws': 6, 'nine-throws': 9 } as const;
type FinitePattern = keyof typeof finiteThrows;
const runsPerLoop = (throws: number) => throws === 6 ? 1 : 2;
const beatsPerRun = (throws: number) => throws + 3;

function beatsPerLoop(pattern?: DrillPattern, count: BallCount = 1) {
  if (pattern === 'continuous' || (!pattern && count === 3)) return 6;
  if (!pattern && count === 1) return SINGLE_INTERVAL * 2;
  const throws = pattern ? finiteThrows[pattern] : 2;
  return beatsPerRun(throws) * runsPerLoop(throws);
}

export const loopDuration = (pattern?: DrillPattern, count: BallCount = 1) => beatsPerLoop(pattern, count) * BEAT_MS;
export const LOOP_MS = loopDuration();

/** A drill's first release is beat 0. The next releases are beats 1 and 2. */
export function drillPhase(pattern: DrillPattern, beat: number) {
  return (beat + READY) / beatsPerLoop(pattern);
}

export function catchPhase(pattern: DrillPattern, throwNumber: number) {
  return drillPhase(pattern, throwNumber - 1 + FLIGHT);
}

export const GUIDE_PHASES = {
  release: 0, apex: FLIGHT / (4 * SINGLE_INTERVAL), catch: FLIGHT / (2 * SINGLE_INTERVAL), return: 0.5,
} as const;
export const EXCHANGE_PHASES = {
  ready: 0, firstRelease: drillPhase('held-third', 0), secondRelease: drillPhase('held-third', 1),
  firstCatch: drillPhase('held-third', FLIGHT), secondCatch: drillPhase('held-third', 1 + FLIGHT),
  rest: drillPhase('held-third', 3.25),
} as const;

export type ThrowNumber = 2 | 3;
// Each beat is measured from the preceding ball's release. This is also the slider order.
export const RELEASE_EVENTS = [
  { id: 'justReleased', beat: FLIGHT * 0.05 },
  { id: 'apex', beat: FLIGHT / 2 },
  { id: 'descending', beat: 1 },
  { id: 'nearCatch', beat: FLIGHT * 0.88 },
] as const;
export type ReleaseEvent = typeof RELEASE_EVENTS[number];

export function getReleaseEvent(id: ReleaseEvent['id']) {
  return RELEASE_EVENTS.find(event => event.id === id)!;
}

export function releasePhase(throwNumber: ThrowNumber, event: ReleaseEvent) {
  const pattern = throwNumber === 2 ? 'held-third' : 'three-throws';
  return drillPhase(pattern, throwNumber - 2 + event.beat);
}

export function nearestReleaseEvent(throwNumber: ThrowNumber, phase: number) {
  const distance = (event: ReleaseEvent) => Math.abs(phase - releasePhase(throwNumber, event));
  return RELEASE_EVENTS.reduce((closest, event) => distance(event) < distance(closest) ? event : closest);
}

type Run = {
  beat: number; first: Hand; count: BallCount; interval: number;
  firstThrow: number; totalThrows: number; lastRelease?: number;
};

function finiteRun(phase: number, pattern: FinitePattern, count: BallCount): Run {
  const totalThrows = finiteThrows[pattern];
  // Dragging the transport to its end should show the last catch. The
  // playback clock advances to phase zero when the next loop really starts.
  const cycle = phase === 1 ? 1 - Number.EPSILON : wrap(phase);
  const run = cycle * runsPerLoop(totalThrows);
  return {
    beat: wrap(run) * beatsPerRun(totalThrows) - READY, first: run < 1 ? 'right' : 'left',
    count, interval: 1, firstThrow: 0, totalThrows,
  };
}

function runAt(phase: number, count: BallCount, pattern?: DrillPattern): Run {
  if (pattern && pattern !== 'continuous') return finiteRun(phase, pattern, 3);
  if (count === 2) return finiteRun(phase, 'held-third', 2);
  // The homepage can start mid-cascade. Practice starts with all three held.
  const startsAtRest = pattern === 'continuous';
  return {
    beat: phase * beatsPerLoop(pattern, count) - (startsAtRest ? READY : 0),
    count, first: 'right', interval: count === 1 ? SINGLE_INTERVAL : 1,
    firstThrow: startsAtRest ? 0 : -Infinity, totalThrows: Infinity,
  };
}

export function landedThrows(phase: number, pattern: DrillPattern, loops = 0) {
  const run = runAt(pattern === 'continuous' ? phase + loops : phase, 3, pattern);
  return clamp(Math.floor(run.beat - FLIGHT + 1e-7) + 1, 0, run.totalThrows);
}

export function cascadeCount(phase: number, pattern: DrillPattern, loops = 0) {
  return Math.floor(landedThrows(phase, pattern, loops) / 3);
}

function palm(hand: Hand, geometry: Geometry, out: number, lift: number): Point {
  // At the flat-arc limit, the diagram stays level with both palms.
  const height = unit((BALL_AT_PALM - geometry.apex) / 12);
  return { x: ELBOW[hand] + outward(hand) * (geometry.spacing + out), y: ELBOW.y + lift * height };
}

// The ball rolls from the outer catching side of the palm to the inner
// releasing fingers. A small wrist circle can thus keep crossing balls apart.
function ballInPalm(point: Point, hand: Hand, geometry: Geometry): Point {
  const centered = ELBOW[hand] + outward(hand) * geometry.spacing;
  return { x: point.x + (point.x - centered) * 1.75, y: point.y + BALL_AT_PALM - ELBOW.y };
}

function releaseBeat(run: Run, index: number) {
  return index === run.totalThrows - 1 && run.lastRelease !== undefined ? run.lastRelease : index * run.interval;
}

function handAt(run: Run, hand: Hand, geometry: Geometry, waitingThrow?: number) {
  type Contact = { beat: number; angle: number };
  let previous: Contact | undefined;
  let next: Contact | undefined;
  const start = Math.max(run.firstThrow, Math.floor((run.beat - FLIGHT) / run.interval) - 2);
  const end = Math.min(run.totalThrows - 1, Math.ceil(run.beat / run.interval) + 2);
  for (let i = start; i <= end; i++) {
    if (i === waitingThrow) continue;
    const catching = handFor(run.first, i) !== hand;
    const beat = releaseBeat(run, i) + (catching ? FLIGHT : 0);
    const event = { beat, angle: catching ? Math.PI : 0 };
    if (beat <= run.beat && (!previous || beat > previous.beat)) previous = event;
    if (beat > run.beat && (!next || beat < next.beat)) next = event;
  }

  // One oval for every hand in every drill. At its inner edge the palm is
  // rising to release. At the outer edge it moves down to cushion the catch.
  let angle = 0;
  let radius = 0;
  if (previous && next) {
    const turn = previous.angle === next.angle ? 2 * Math.PI : Math.PI;
    angle = previous.angle + turn * (run.beat - previous.beat) / (next.beat - previous.beat);
    radius = 1;
  } else if (next || previous) {
    // Enter or leave the oval gently at the start and end of a finite drill.
    const edge = (next ?? previous)!;
    const t = unit(Math.abs(run.beat - edge.beat) / 0.75);
    angle = edge.angle + (next ? -1 : 1) * t * Math.PI / 2;
    radius = 1 - smooth(t);
  }
  return palm(hand, geometry, -4 * radius * Math.cos(angle), -6 * radius * Math.sin(angle));
}

function contact(hand: Hand, geometry: Geometry, catching: boolean): Point {
  const point = palm(hand, geometry, catching ? 4 : -4, 0);
  return ballInPalm(point, hand, geometry);
}

function arc(t: number, source: Hand, geometry: Geometry): Point {
  const a = contact(source, geometry, false);
  const b = contact(opposite(source), geometry, true);
  const middleY = (a.y + b.y) / 2;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t + 4 * t * (1 - t) * (geometry.apex - middleY),
  };
}

export function arcPeak(geometry: Geometry, source: Hand) {
  return arc(0.5, source, geometry);
}

function throwFor(run: Run, ball: number) {
  const beat = run.beat + 1e-9; // Keep exact release and catch frames stable through phase conversion.
  const last = Math.min(beat / run.interval, run.totalThrows - 1);
  const turn = Math.floor((last - ball) / run.count);
  const i = run.firstThrow === 0 ? ball + Math.max(0, turn) * run.count : ball + turn * run.count;
  return { index: i, hand: handFor(run.first, i), age: beat - releaseBeat(run, i) };
}

function finalTuck(run: Run, index: number) {
  return run.count === 3 && index === run.totalThrows - 1 && index % 3 === 2;
}

function flightPoint(run: Run, index: number, age: number, geometry: Geometry) {
  const t = unit(age / FLIGHT);
  const source = handFor(run.first, index);
  const point = arc(t, source, geometry);
  // On the last catch, two balls share a palm. The last ball settles beside the first.
  if (finalTuck(run, index)) point.x += outward(opposite(source)) * TUCKED_OFFSET * smooth((t - 0.75) / 0.25);
  return point;
}

export function poseAt(phase: number, input: Geometry, count: BallCount = 1, pattern?: DrillPattern, waitingForThrow = false): ScenePose {
  const geometry = boundedGeometry(input);
  const run = runAt(phase, count, pattern);
  return poseForRun(run, geometry, waitingForThrow);
}

function poseForRun(run: Run, geometry: Geometry, waitingForThrow = false): ScenePose {
  const waitingThrow = waitingForThrow ? run.count - 1 : undefined;
  const hands = { right: handAt(run, 'right', geometry, waitingThrow), left: handAt(run, 'left', geometry, waitingThrow) };
  const balls = Array.from({ length: run.count }, (_, ball) => {
    const { index, hand, age } = throwFor(run, ball);
    const parked = ball >= run.totalThrows;
    const waiting = waitingForThrow && ball === run.count - 1;
    if (!parked && !waiting && age >= 0 && age < FLIGHT) {
      return { ...flightPoint(run, index, age, geometry), heldBy: null };
    }
    const heldBy: Hand = parked ? 'right' : waiting || age < 0 ? hand : opposite(hand);
    let tuck = 0;
    if (parked || (!waiting && finalTuck(run, index) && age >= FLIGHT)) tuck = TUCKED_OFFSET;
    else if (ball === 2 && run.firstThrow === 0 && index === 2) tuck = TUCKED_OFFSET * (1 - smooth(run.beat / 0.7));
    const grip = ballInPalm(hands[heldBy], heldBy, geometry);
    return { x: (parked ? hands[heldBy].x : grip.x) + outward(heldBy) * tuck, y: grip.y, heldBy };
  });
  return { hands, balls };
}

/** The final release can move independently of the preceding throws. All
 * positions still come from the ordinary hand, flight, and catch model. */
export function releasePreviewPose(count: ThrowNumber, event: ReleaseEvent, elapsed: number): ScenePose {
  const previous = count - 2;
  const run: Run = {
    beat: previous + elapsed, first: 'right', count, interval: 1, firstThrow: 0, totalThrows: count,
    lastRelease: previous + event.beat,
  };
  return poseForRun(run, { spacing: 0, apex: NEUTRAL_APEX });
}

export type Encounter = 'contact' | 'clear' | 'release';

export function releasePreview(count: ThrowNumber, event: ReleaseEvent) {
  const release = event.beat;
  // Find the actual contact or passing pose, irrespective of the quiz answer.
  // The last two balls start on opposite sides in the two- and three-ball drills.
  const sourceSign = count === 2 ? 1 : -1;
  let previousGap: number | undefined;
  let passing: number | undefined;
  for (let t = release; t <= FLIGHT; t += 0.002) {
    const { balls } = releasePreviewPose(count, event, t);
    const a = balls[count - 2], b = balls[count - 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) <= 18) return { release, contact: t, passing };
    const gap = (a.x - b.x) * sourceSign;
    if (previousGap !== undefined && previousGap < 0 && gap >= 0) passing = t;
    previousGap = gap;
  }
  return { release, contact: undefined, passing };
}

/** Space circular dots by traveled distance, including around the apex. */
export function trajectoryDots(input: Geometry, source: Hand = 'right'): Point[] {
  const geometry = boundedGeometry(input);
  const samples = Array.from({ length: 81 }, (_, i) => arc(i / 80, source, geometry));
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    lengths.push(lengths[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = lengths[lengths.length - 1];
  const gaps = Math.max(4, Math.round(total / 10));
  let next = 1;
  return Array.from({ length: gaps + 1 }, (_, i) => {
    const target = total * i / gaps;
    while (next < samples.length - 1 && lengths[next] < target) next++;
    const a = samples[next - 1], b = samples[next];
    const mix = (target - lengths[next - 1]) / (lengths[next] - lengths[next - 1]);
    return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix };
  });
}

export function ballTrail(phase: number, ball: number, geometry: Geometry, count: 2 | 3, project: (p: Point) => Point, pattern?: DrillPattern): Point[] {
  const run = runAt(phase, count, pattern);
  if (ball >= run.totalThrows) return [];
  const { index, age } = throwFor(run, ball);
  const end = Math.min(age, FLIGHT);
  const start = Math.max(0, age - 1.15);
  if (end <= start) return [];
  let previous = project(flightPoint(run, index, end, geometry));
  let distance = 0;
  const dots: Point[] = [];
  for (let step = 1; step <= 60 && dots.length < 7; step++) {
    const point = project(flightPoint(run, index, end + (start - end) * step / 60, geometry));
    const segment = Math.hypot(point.x - previous.x, point.y - previous.y);
    const next = (dots.length + 1) * 8;
    if (distance + segment >= next) {
      const mix = (next - distance) / segment;
      dots.push({ x: previous.x + (point.x - previous.x) * mix, y: previous.y + (point.y - previous.y) * mix });
    }
    previous = point;
    distance += segment;
  }
  return dots;
}
