import { cascadeCount, type DrillPattern } from '../scene/motion';
import { Caption, LabelText } from '../ui/primitives';

type Props = { phase: number; loops: number; pattern: DrillPattern; goal?: number };

export function CascadeCounter({ phase, loops, pattern, goal }: Props) {
  const count = cascadeCount(phase, pattern, loops);
  return <div className="lesson-cascade-count" aria-label="Cascades in the demonstration">
    <Caption>Cascades</Caption>
    <LabelText>{count}{goal && ` / ${goal}`}</LabelText>
  </div>;
}
