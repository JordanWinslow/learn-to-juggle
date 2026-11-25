'use client';

import { useState } from 'react';
import { GeometryControls, type GeometryControlProps } from './controls';
import { Checkbox } from './primitives';

export function useGeometryInputPreference() {
  const [useArrowButtons, setUseArrowButtons] = useState(false);
  return { useArrowButtons, setUseArrowButtons };
}

type OptionsProps = GeometryControlProps & ReturnType<typeof useGeometryInputPreference>;

export function GeometryInputOptions({ useArrowButtons, setUseArrowButtons, ...geometry }: OptionsProps) {
  return (
    <div className="ui-geometry-input" data-buttons={useArrowButtons}>
      <Checkbox label="Use arrow buttons" title="Use arrow buttons" checked={useArrowButtons}
        onChange={event => setUseArrowButtons(event.currentTarget.checked)} />
      {useArrowButtons && <GeometryControls {...geometry} />}
    </div>
  );
}
