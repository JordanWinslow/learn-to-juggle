"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { throwQuizCopy } from "../lessons/curriculum";
import { compareArcHeight, geometryArrow } from "./geometry-limits";
import { GeometryHandle, type GeometryChange } from "./GeometryHandle";
import { SIDE_HEIGHT, SIDE_WIDTH, SideProfile, sidePoint } from "./SideProfile";
import {
  ELBOW, NEUTRAL_APEX, arcPeak, ballTrail, boundedGeometry, palmTilt, nearestReleaseEvent,
  poseAt, releasePreviewPose, trajectoryDots,
  type Encounter, type ReleaseEvent, type BallCount, type DrillPattern, type Geometry, type Hand, type Point, type ScenePose,
} from "./motion";
import { SceneHint, type SceneTarget } from "./SceneHint";
import "./scene.css";

export type CorrectionTarget = "spacing" | "apex" | "ball";

export interface SpriteSceneProps extends Geometry {
  phase: number;
  view?: "front" | "side";
  count?: BallCount;
  pattern?: DrillPattern;
  faded?: boolean;
  showBall?: boolean;
  showPath?: boolean;
  waitingForThrow?: boolean;
  arcBall?: 1 | 2;
  releasePreview?: { event: ReleaseEvent; elapsed: number; encounter?: Encounter };
  highlight?: SceneTarget | readonly SceneTarget[];
  correction?: CorrectionTarget;
  correctionBallIndex?: number;
  onGeometryChange?: GeometryChange;
  className?: string;
}

/** A focused lesson heading or the empty stage can adjust the active drawing.
 * Interactive elements retain their own keyboard conventions. */
export function adjustSceneWithArrows(event: KeyboardEvent<Element>, scene: Pick<SpriteSceneProps, 'apex' | 'spacing' | 'arcBall' | 'onGeometryChange'>) {
  if (!scene.onGeometryChange || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!(event.target instanceof Element) || event.target.closest('button, a, input, select, textarea, dialog, [contenteditable="true"], [role="slider"]')) return;
  const change = geometryArrow(event.key, event.shiftKey, { apex: scene.apex, spacing: scene.arcBall ? undefined : scene.spacing });
  if (!change) return;
  event.preventDefault();
  event.stopPropagation();
  scene.onGeometryChange(change.field, change.value);
}

const sprites = {
  body: { file: "instructor-front", width: 208, height: 240 },
  right: { file: "right-hand", width: 48, height: 48 },
  left: { file: "left-hand", width: 48, height: 48 },
  ball: { file: "juggling-ball", width: 24, height: 24 },
  side: { file: "instructor-side", width: 108, height: 192 },
} as const;
type Asset = keyof typeof sprites;
const assets = Object.keys(sprites) as Asset[];

// The profile sprite supplies the tattooed length of the forearm. Project it
// from the fixed cuff to the moving wrist, then draw the original H1 palm.
function HandSprite({ hand, point, palm, arm }: { hand: Hand; point: Point; palm: string; arm: string }) {
  const elbow = ELBOW[hand];
  const reach = (point.x - elbow) / 29;
  const tilt = (point.y - ELBOW.y - 4) / 29;
  const angle = palmTilt(point.y) * (hand === "right" ? -1 : 1);
  return (
    <g>
      <svg transform={`matrix(${reach} ${tilt} 0 1 ${elbow} ${ELBOW.y - 6})`}
        width="29" height="14" viewBox="39 130 29 14" overflow="hidden">
        <use href={arm} />
      </svg>
      <use href={palm} x={point.x - 24} y={point.y - 40} transform={`rotate(${angle} ${point.x} ${point.y})`} />
    </g>
  );
}

export function describePreviewBalls(pose: ScenePose) {
  return pose.balls.map((ball, index) => {
    const label = ["Coral", "Turquoise", "Gold"][index];
    if (ball.heldBy) return `${label} ball in the ${ball.heldBy} hand.`;
    const side = ball.x < 90 ? "left of center" : ball.x > 118 ? "right of center" : "near the center";
    const height = ball.y < NEUTRAL_APEX + 20 ? "near eye level" : ball.y > ELBOW.y - 26 ? "near hand height" : "between eye and hand height";
    return `${label} ball ${side}, ${height}.`;
  }).join(" ");
}

function sceneDescription(props: SpriteSceneProps, pose: ScenePose) {
  const encounter = props.releasePreview?.encounter;
  if (encounter === 'contact') return 'Front view. The last two balls touch in the middle, near eye level.';
  if (encounter === 'clear') return 'Front view. The falling ball passes above the rising ball with space between them.';
  if (encounter === 'release') return throwQuizCopy[props.count === 3 ? 3 : 2].frames[props.releasePreview!.event.id];
  if (props.waitingForThrow) {
    const third = props.count === 3;
    const count = third ? 3 : 2;
    const event = nearestReleaseEvent(count, props.phase);
    const description = throwQuizCopy[count].frames[event.id];
    return description +
      (third ? " The starting hand still holds the third ball." : " The opposite hand still holds the second ball.");
  }
  if (props.releasePreview) return describePreviewBalls(pose);
  const spacing = props.spacing === 0 ? "at shoulder width" : props.spacing > 0 ? "wider than the shoulders" : "closer than shoulder width";
  const height = compareArcHeight(props.apex);
  const ball = pose.balls[0];
  let action = "Ball in flight.";
  if (props.count === 2 || props.pattern) {
    action = pose.balls.map((ball, index) => {
      const label = ["Coral ball", "Turquoise ball", "Gold ball"][index];
      return ball.heldBy ? `${label} in the coach’s ${ball.heldBy} hand.` : `${label} in flight.`;
    }).join(" ");
  } else if (props.count === 3) action = "Three-ball cascade.";
  else if (ball.heldBy) action = `Ball held by the coach’s ${ball.heldBy} hand.`;
  const orientation = props.view === "side" ? "Side posture. Elbow bent about 90 degrees, forearm forward." : "Front view.";
  return `${orientation} Palms up ${spacing}. Peak ${height} eye level. ${props.showBall === false ? "Balls hidden." : action}`;
}

const identity = (p: Point) => p;
const ballColors = ["coral", "turquoise", "amber"] as const;

// Re-dye just the yarn. Its transparent edge, dark outline and cream stitches
// retain the original pixels. The red-channel intensity preserves each shade.
function YarnDye({ id, color }: { id: string; color: string }) {
  return <filter id={id} colorInterpolationFilters="sRGB">
    <feColorMatrix in="SourceGraphic" result="yarn" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  10 -10 0 0 -1" />
    <feColorMatrix in="SourceGraphic" result="shading" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0" />
    <feFlood floodColor={`var(--color-${color})`} result="dye" />
    <feBlend in="dye" in2="shading" mode="multiply" />
    <feComposite in2="yarn" operator="in" />
    <feComposite in2="SourceGraphic" operator="over" />
  </filter>;
}

export function SpriteScene({
  phase, spacing, apex, view = "front", count: requestedCount = 1, pattern, faded = false,
  showBall = true, showPath = true, waitingForThrow = false, arcBall, releasePreview,
  highlight, correction, correctionBallIndex = 0, onGeometryChange, className,
}: SpriteSceneProps) {
  const count = pattern ? 3 : requestedCount;
  const seed = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [pixelScale, setPixelScale] = useState(1);
  const [failedAssets, setFailedAssets] = useState<Partial<Record<Asset, boolean>>>({});
  const geometry = useMemo(() => boundedGeometry({ spacing, apex }), [spacing, apex]);
  const profile = view === "side";
  const project = profile ? sidePoint : identity;
  const proposingArc = arcBall !== undefined;
  const returningSingleBall = count === 1 && Math.floor(phase * 2) % 2 === 1;
  const source = arcBall === 1 || returningSingleBall ? "left" : "right";
  const reference = useMemo(() => proposingArc ? { spacing, apex: NEUTRAL_APEX } : geometry, [proposingArc, spacing, geometry]);
  const dots = useMemo(() => trajectoryDots(geometry, source).map(project), [geometry, source, project]);
  const previousDots = useMemo(() => proposingArc ? trajectoryDots(reference, source === "right" ? "left" : "right").map(project) : [],
    [proposingArc, reference, source, project]);
  const pose = releasePreview
    ? releasePreviewPose(count === 3 ? 3 : 2, releasePreview.event, releasePreview.elapsed)
    : poseAt(phase, reference, count, pattern, waitingForThrow);
  const hands = { left: project(pose.hands.left), right: project(pose.hands.right) };
  const balls = pose.balls.map(project);
  const peak = project(arcPeak(geometry, source));
  const editable = (count === 1 || proposingArc) && Boolean(onGeometryChange);
  const targets = typeof highlight === "string" ? [highlight] : highlight ?? [];
  const elbowDetail = profile && targets.includes('elbow');
  useEffect(() => {
    if (!svg.current) return;
    const resize = new ResizeObserver(() => setPixelScale(svg.current?.getScreenCTM()?.a || 1));
    resize.observe(svg.current);
    return () => resize.disconnect();
  }, [elbowDetail]);
  const handGap = (hands.left.x - hands.right.x) * pixelScale;
  const chipOutset = Math.max(0, (48 - handGap) / 2);
  const desc = sceneDescription({ phase, ...geometry, view, count, pattern, waitingForThrow, releasePreview, showBall }, pose);
  const id = (asset: Asset) => `${seed}-${asset}`;
  const missingCoach = failedAssets.side ||
    (!profile && (failedAssets.body || failedAssets.right || failedAssets.left));
  const missing = missingCoach || (showBall && failedAssets.ball);

  return (
    <svg ref={svg} className={["sprite-scene", className].filter(Boolean).join(" ")}
      viewBox={elbowDetail ? "0 12 208 184" : "-14 -14 236 266"} style={elbowDetail ? { overflow: 'hidden' } : undefined}
      tabIndex={editable ? -1 : undefined} onKeyDown={editable
        ? event => adjustSceneWithArrows(event, { ...geometry, arcBall, onGeometryChange }) : undefined}
      role={editable ? "group" : "img"} aria-labelledby={`${seed}-title`} aria-describedby={`${seed}-description`}>
      <title id={`${seed}-title`}>{profile ? "Side posture" : "Juggling coach"}</title>
      <desc id={`${seed}-description`}>{desc}</desc>
      <defs>
        {assets.map(asset => (
          <image key={asset} id={id(asset)} href={`/sprites/${sprites[asset].file}.png`}
            width={sprites[asset].width} height={sprites[asset].height}
            onError={() => setFailedAssets(old => old[asset] ? old : { ...old, [asset]: true })} />
        ))}
        {count > 1 && ballColors.slice(0, balls.length).map(color =>
          <YarnDye key={color} id={`${seed}-dye-${color}`} color={color} />)}
      </defs>
      {missing ? (
        <text className="sprite-fallback" x="104" y="120" textAnchor="middle">Sprite unavailable</text>
      ) : (
        <>
          {profile ? <SideProfile id={`#${id("side")}`} seed={seed} hands={pose.hands} faded={faded} /> : <>
            <use className={faded ? "sprite-body-faded" : undefined} href={`#${id("body")}`} />
            <HandSprite hand="right" point={hands.right} palm={`#${id("right")}`} arm={`#${id("side")}`} />
            <HandSprite hand="left" point={hands.left} palm={`#${id("left")}`} arm={`#${id("side")}`} />
          </>}
          {showPath && (arcBall !== undefined ? (
            <g className="sprite-path">
              <ArcGuide points={previousDots} name="previous" color={ballColors[arcBall - 1]} />
              <ArcGuide points={dots} name="proposed" color={ballColors[arcBall]} />
            </g>
          ) : count === 1 ? (
            <g className="sprite-path">
              {dots.map((point, index) => {
                const ball = balls[0];
                if (showBall && Math.hypot(ball.x - point.x, ball.y - point.y) < 12) return null;
                return <circle key={index} cx={point.x} cy={point.y} r="2.3" />;
              })}
            </g>
          ) : (
            <g className="sprite-path">
              {balls.map((ball, index) => (
                <g key={index} data-trail={ballColors[index]} fill={`var(--color-${ballColors[index]})`}>
                  {!(waitingForThrow && index === count - 1) && ballTrail(phase, index, geometry, count, project, pattern).map((p, j) =>
                    Math.hypot(p.x - ball.x, p.y - ball.y) < 12 && showBall ? null :
                      <circle key={j} cx={p.x} cy={p.y} r="2.3" />)}
                </g>
              ))}
            </g>
          ))}
          {showBall && balls.map((ball, index) => (
            <g key={index} data-ball={ballColors[index]} transform={`translate(${ball.x} ${ball.y})`}>
              <use href={`#${id("ball")}`} x="-12" y="-12"
                filter={count > 1 ? `url(#${seed}-dye-${ballColors[index]})` : undefined} />
            </g>
          ))}
          {releasePreview?.encounter && releasePreview.encounter !== 'release' && (
            <PassingMark encounter={releasePreview.encounter} a={balls[count - 2]} b={balls[count - 1]} />
          )}
          {targets.map(part => (
            <SceneHint key={part} part={part} hands={hands} balls={balls} peak={peak} profile={profile} pixelScale={pixelScale} />
          ))}
          {editable && onGeometryChange && <>
            {showPath && <GeometryHandle target="apex" point={peak} value={geometry.apex}
              pixelScale={pixelScale} projection={profile ? SIDE_HEIGHT : 1} onChange={onGeometryChange} />}
            {!proposingArc && (["right", "left"] as const).map(hand => <GeometryHandle key={hand} target={hand} point={hands[hand]}
              value={geometry.spacing} pixelScale={pixelScale} chipOutset={chipOutset}
              chipDrop={Math.max(21, 44 - (hands[hand].y - peak.y) * pixelScale)}
              projection={profile ? SIDE_WIDTH : 1} onChange={onGeometryChange} />)}
          </>}
          {correction && releasePreview?.encounter !== "contact" && <CorrectionHighlight target={correction} hands={hands} peak={peak} ball={balls[correctionBallIndex] ?? balls[0]} />}
        </>
      )}
    </svg>
  );
}

// The arrow follows the ascending side, so direction remains visible even
// when both peaks are level. Ring dots distinguish the learner's throw.
function ArcGuide({ points, name, color }: { points: Point[]; name: 'previous' | 'proposed'; color: string }) {
  const at = Math.max(1, Math.floor(points.length / 4));
  const p = points[at], next = points[at + 1];
  const angle = Math.atan2(next.y - p.y, next.x - p.x) * 180 / Math.PI;
  return <g data-arc={name} fill={`var(--color-${color})`}>
    {points.map((point, i) => <circle key={i} cx={point.x} cy={point.y} r={name === 'proposed' ? 2.7 : 2.1}
      {...(name === 'proposed' && { fill: 'var(--color-stage)', stroke: `var(--color-${color})`, strokeWidth: 1.25 })} />)}
    <path d="M-4 -4 L4 0 L-4 4 Z" transform={`translate(${p.x} ${p.y}) rotate(${angle})`} />
  </g>;
}

function PassingMark({ a, b, encounter }: { a: Point; b: Point; encounter: 'contact' | 'clear' }) {
  const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
  return <g data-encounter={encounter} className="sprite-encounter" aria-hidden="true">
    {encounter === 'contact' ? <g data-correction-feature="ball" transform={`translate(${x} ${y})`}>
      <circle data-correction-anchor="ball" r="1" fill="none" stroke="none" /><circle r="22" /><path d="M0 -25 v-5 M-15 -21 l-3 -4 M15 -21 l3 -4" />
    </g> : <path d={`M${x + 13} ${a.y + 10} h4 V${b.y - 10} h-4`} />}
  </g>;
}

function CorrectionHighlight({ target, hands, peak, ball }: {
  target: CorrectionTarget; hands: ScenePose["hands"]; peak: Point; ball: Point;
}) {
  const { left, right } = hands;
  const bracketY = Math.max(left.y, right.y) + 10;
  const anchor = target === "spacing" ? { x: left.x, y: left.y - 3 }
    : target === "apex" ? peak : ball;
  return (
    <g className="sprite-correction" data-correction-feature={target} aria-hidden="true">
      {target === "spacing" ? <>
        {[left, right].map((point, i) => <ellipse key={i} cx={point.x} cy={point.y - 3} rx="15" ry="9" />)}
        <path d={`M${right.x} ${right.y + 6} V${bracketY} H${left.x} V${left.y + 6}`} />
      </> : <circle cx={anchor.x} cy={anchor.y} r="14" />}
      <circle data-correction-anchor={target} cx={anchor.x} cy={anchor.y} r="1" />
    </g>
  );
}
