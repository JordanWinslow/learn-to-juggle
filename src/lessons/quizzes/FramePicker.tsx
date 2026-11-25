import { Range, Text } from '../../ui';
import type { Ref } from 'react';

export function FramePicker({ frame, descriptions, onChange, inputRef, label = 'Choose a frame', showStops = false }: {
  frame: number;
  descriptions: readonly string[];
  onChange: (frame: number) => void;
  inputRef?: Ref<HTMLInputElement>;
  label?: string;
  showStops?: boolean;
}) {
  const position = `Frame ${frame + 1} of ${descriptions.length}`;
  const range = <Range ref={inputRef} label={label} min={0} max={descriptions.length - 1} step={1}
    value={frame} aria-valuetext={`${position}. ${descriptions[frame]}`}
    onChange={event => onChange(event.currentTarget.valueAsNumber)} />;
  return <>
    {showStops ? <span className="ui-label">{label} · {frame + 1} of {descriptions.length}</span> : <Text>{position}</Text>}
    {showStops ? <div className="throw-frame-range">
      {range}
      <span className="throw-frame-stops" aria-hidden="true">{descriptions.map(item => <i key={item} />)}</span>
    </div> : range}
  </>;
}
