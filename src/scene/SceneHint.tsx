import { ELBOW, type Point, type ScenePose } from './motion';
import { sideElbow } from './SideProfile';

const ballIndex = { 'first-ball': 0, 'second-ball': 1, 'third-ball': 2 } as const;
export type SceneTarget = 'elbow' | 'spacing' | 'apex' | 'crossing' | 'hands' | 'right-hand' | 'left-hand' | keyof typeof ballIndex;

type Props = {
  part: SceneTarget;
  hands: ScenePose['hands'];
  balls: readonly Point[];
  peak: Point;
  profile: boolean;
  pixelScale: number;
};

/** All lesson cues mark the same projected points as the moving sprites. */
export function SceneHint({ part, hands, balls, peak, profile, pixelScale }: Props) {
  const palmY = Math.max(hands.left.y, hands.right.y) + 13;
  const center = (hands.left.x + hands.right.x) / 2;
  let mark;
  switch (part) {
    case 'elbow': {
      const point = profile ? sideElbow : { x: ELBOW.right, y: ELBOW.y };
      mark = <g transform={`translate(${point.x} ${point.y})`}>
        {profile ? <path d="M8 -19 H19 V-9" /> : <path d="M-6 4 l-8 8 h-8" />}
        <text transform={`translate(${profile ? -9 : -24} ${profile ? 8 : 12}) scale(${1 / pixelScale})`} textAnchor="end">
          {profile ? '90°' : 'Elbow'}
        </text>
      </g>;
      break;
    }
    case 'apex':
      mark = <g transform={`translate(${peak.x} ${peak.y}) scale(${1 / pixelScale})`}>
        <path d="M-7 0 h14 m2 0 8 -8 h8" />
        <text x="28" y="-6">Peak</text>
      </g>;
      break;
    case 'spacing':
      mark = <>
        <path d={`M${hands.right.x} ${palmY - 3} v3 H${hands.left.x} v-3`} />
        <text transform={`translate(${center} ${palmY}) scale(${1 / pixelScale})`} y="14" textAnchor="middle">Hand spacing</text>
      </>;
      break;
    case 'crossing':
      mark = <>
        <path strokeDasharray="4 4" d={`M${center} ${peak.y - 10} V${palmY}`} />
        <text transform={`translate(${center} ${palmY}) scale(${1 / pixelScale})`} y="14" textAnchor="middle">Middle</text>
      </>;
      break;
    case 'hands':
    case 'right-hand':
    case 'left-hand':
      mark = (['left', 'right'] as const).map(hand => (part === 'hands' || part === `${hand}-hand`) &&
        <ellipse key={hand} cx={hands[hand].x} cy={hands[hand].y - 3} rx="15" ry="10" />);
      break;
    default: {
      const ball = balls[ballIndex[part]];
      if (!ball) return null;
      mark = <circle cx={ball.x} cy={ball.y} r="12" />;
    }
  }
  return <g className="sprite-callout" data-cue-target={part} aria-hidden="true">{mark}</g>;
}
