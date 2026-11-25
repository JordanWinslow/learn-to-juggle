'use client';

import { useId, useState, type ReactNode } from 'react';
import { SpriteScene, adjustSceneWithArrows, type SpriteSceneProps } from '../scene';
import { Cluster, MotionTransport, Surface, ViewSwitch, VisibilityControls } from '../ui';
import { StepHeading } from './StepHeading';
import type { Playback } from './usePlayback';
import './lessons.css';

type ScenePanelProps = {
  title: string;
  scene: SpriteSceneProps;
  picture?: ReactNode;
  playback?: Playback;
  note?: ReactNode;
  overlay?: ReactNode;
  correction?: ReactNode;
  toolbar?: ReactNode;
  children?: ReactNode;
  allowSide?: boolean;
  allowVisibility?: boolean;
  controlsLayout?: 'auto' | 'sidebar';
  guided?: boolean;
};

export function ScenePanel({
  title, scene, picture, playback, note, overlay, correction, toolbar, children, allowSide = true, allowVisibility = false, controlsLayout = 'auto', guided = false,
}: ScenePanelProps) {
  const headingId = useId();
  const [chosenView, setChosenView] = useState<SpriteSceneProps['view']>();
  const view = chosenView ?? scene.view ?? 'front';
  const [showBall, setBall] = useState(true);
  const [showPath, setPath] = useState(true);

  return (
    <main className="lesson-frame" aria-labelledby={headingId} data-still-picture={picture ? true : undefined}
      onKeyDown={scene.onGeometryChange ? event => adjustSceneWithArrows(event, scene) : undefined}>
      <header className="lesson-intro">
        <StepHeading title={title} id={headingId} />
        {allowSide && <ViewSwitch value={view} onChange={setChosenView} />}
      </header>
      <div className="lesson-workspace" data-controls-layout={controlsLayout} data-guided={guided || undefined}>
        <Surface className="lesson-window">
          <div className="lesson-picture">
            {picture ?? <SpriteScene {...scene} view={allowSide ? view : 'front'} showBall={showBall} showPath={showPath} />}
            {overlay}
          </div>
          {!guided && note}
          {correction}
        </Surface>
        {guided && <div className="lesson-guidance">{note}</div>}
        {(playback || toolbar) && (
          <div className="lesson-controls" role="region" aria-label="Lesson controls">
            {playback && <Cluster className="lesson-playback">
              <MotionTransport {...playback} />
              {allowVisibility && <VisibilityControls showBall={showBall} showPath={showPath}
                onBallChange={setBall} onPathChange={setPath} />}
            </Cluster>}
            {toolbar}
          </div>
        )}
      </div>
      {children}
    </main>
  );
}
