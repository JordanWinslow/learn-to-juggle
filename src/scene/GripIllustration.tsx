'use client';

import { useId } from 'react';
import './scene.css';

// Positions are percentages of the square teaching illustration.
const ballCenters = [{ x: 38, y: 68 }, { x: 55, y: 44 }] as const;

type Props = {
  description: string;
  selected?: number | null;
  correction?: boolean;
  onSelect?: (index: number) => void;
};

export function GripIllustration({ description, selected, correction = false, onSelect }: Props) {
  const titleId = useId();
  return <svg className="sprite-scene" role="img" aria-labelledby={titleId} viewBox="0 0 100 100">
    <title id={titleId}>{description}</title>
    <image href="/sprites/two-ball-grip.png" width="100" height="100" />
    {ballCenters.map(({ x, y }, index) => {
      const showError = correction && selected === index;
      return <g key={index} data-correction-feature={showError ? 'ball' : undefined}>
        {selected === index && <circle className={showError ? 'grip-ring grip-error' : 'grip-ring'} cx={x} cy={y} r="9" />}
        {showError && <circle cx={x} cy={y} r="0.3" fill="transparent" data-correction-anchor="ball" />}
        {onSelect && <circle cx={x} cy={y} r="10" fill="transparent" className="grip-hotspot"
          aria-hidden="true" onClick={() => onSelect(index)} />}
      </g>;
    })}
  </svg>;
}
