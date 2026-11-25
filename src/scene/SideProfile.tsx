import { palmTilt, type Hand, type Point, type ScenePose } from "./motion";

// The side art faces right. Project the transverse toss plane into this
// slightly offset profile so both palms remain visible behind one another.
export const SIDE_WIDTH = 0.34;
export const SIDE_HEIGHT = 0.86;
export function sidePoint({ x, y }: Point): Point {
  return { x: 133 + (x - 104) * SIDE_WIDTH, y: 153 + (y - 183) * SIDE_HEIGHT + (x - 104) * 0.12 };
}

const scale = 1.13;
const origin = { x: 42, y: 20 };
const elbow = { x: 34, y: 135 };
export const sideElbow = { x: origin.x + scale * elbow.x, y: origin.y + scale * elbow.y };
const wrist = 68;
const palm = { x: 84, y: 132 };

function ProfileArm({ hand, front, sprite }: { hand: Hand; front: Point; sprite: string }) {
  const point = sidePoint(front);
  const targetX = (point.x - origin.x) / scale;
  const targetY = (point.y - origin.y) / scale;
  const moveX = targetX - palm.x;
  const moveY = targetY - palm.y;
  const reach = (wrist - elbow.x + moveX) / (wrist - elbow.x);
  const tilt = moveY / (wrist - elbow.x);
  return (
    <g data-profile-arm={hand}>
      <g transform={`translate(${elbow.x} ${elbow.y}) matrix(${reach} ${tilt} 0 1 0 0) translate(${-elbow.x} ${-elbow.y})`}>
        <svg x={elbow.x} y="124" width={wrist - elbow.x} height="21" viewBox={`${elbow.x} 124 ${wrist - elbow.x} 21`} overflow="hidden">
          <use href={sprite} />
        </svg>
      </g>
      <svg x={wrist + moveX} y={124 + moveY} width="40" height="21" viewBox="68 124 40 21" overflow="hidden"
        transform={`rotate(${palmTilt(front.y)} ${wrist + moveX} ${palm.y + moveY})`}>
        <use href={sprite} />
      </svg>
    </g>
  );
}

export function SideProfile({ id, seed, hands, faded }: {
  id: string; seed: string; hands: ScenePose["hands"]; faded: boolean;
}) {
  return (
    <g transform={`translate(${origin.x} ${origin.y}) scale(${scale})`}>
      <defs>
        <clipPath id={`${seed}-forearm`}>
          <path d="M34 130 H40 V129 H60 V125 H104 V144 H34 Z" />
        </clipPath>
        <g id={`${seed}-arm`} clipPath={`url(#${seed}-forearm)`}><use href={id} /></g>
        <mask id={`${seed}-torso`} maskUnits="userSpaceOnUse" x="0" y="0" width="108" height="192">
          <rect width="108" height="192" fill="white" />
          <path d="M34 130 H40 V129 H60 V125 H108 V145 H34 Z" fill="black" />
        </mask>
      </defs>
      <ProfileArm hand="right" front={hands.right} sprite={`#${seed}-arm`} />
      <g className={faded ? "sprite-body-faded" : undefined}>
        {/* Restore the shirt behind the movable forearm from the same raster. */}
        <svg x="34" y="129" width="26" height="16" viewBox="34 146 26 1" preserveAspectRatio="none" overflow="hidden">
          <use href={id} />
        </svg>
        <use href={id} mask={`url(#${seed}-torso)`} />
      </g>
      <ProfileArm hand="left" front={hands.left} sprite={`#${seed}-arm`} />
    </g>
  );
}
