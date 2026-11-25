import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { compareArcHeight, GEOMETRY_LIMITS } from "./geometry-limits";
import { ELBOW, type Geometry, type Hand, type Point } from "./motion";

export type GeometryChange = (field: keyof Geometry, value: number) => void;

type Props = {
  target: "apex" | Hand;
  point: Point;
  value: number;
  projection: number;
  pixelScale: number;
  chipOutset?: number;
  chipDrop?: number;
  onChange: GeometryChange;
};

export function GeometryHandle({ target, point, value, projection, pixelScale, chipOutset = 0, chipDrop = 0, onChange }: Props) {
  const drag = useRef<{ id: number; origin: number; startValue: number; unitsPerPixel: number } | null>(null);
  const instructionId = useId();
  const handle = useRef<SVGGElement>(null);
  useEffect(() => {
    const element = handle.current;
    if (!element) return;
    // A fast finger lift can otherwise become a browser fling and consume
    // the next button tap. A two-finger gesture remains available for zoom.
    function dragTouch(event: TouchEvent) {
      if (event.touches.length === 1 && event.cancelable) event.preventDefault();
    }
    element.addEventListener("touchmove", dragTouch, { passive: false });
    return () => element.removeEventListener("touchmove", dragTouch);
  }, []);
  const vertical = target === "apex";
  const field = vertical ? "apex" : "spacing";
  const limits = GEOMETRY_LIMITS[field];
  const shoulderWidth = ELBOW.left - ELBOW.right;
  const name = vertical ? "Arc peak" : `Hand spacing, coach’s ${target} hand`;
  const height = { at: 'At eye level', above: 'Above eye level', below: 'Below eye level' }[compareArcHeight(value)];
  const outward = target === "right" ? -1 : 1;
  const badgeX = chipOutset * outward;
  const coordinate = (e: PointerEvent<SVGGElement>) => vertical ? e.clientY : e.clientX;
  const commit = (next: number) => onChange(field, Math.max(limits.min, Math.min(limits.max, Math.round(next))));

  function start(e: PointerEvent<SVGGElement>) {
    if (!e.isPrimary || e.button !== 0 || drag.current) return;
    const matrix = e.currentTarget.ownerSVGElement?.getScreenCTM();
    if (!matrix) return;
    e.preventDefault();
    e.currentTarget.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragging = "true";
    const pixelsPerUnit = (vertical ? matrix.d : matrix.a) * projection;
    drag.current = { id: e.pointerId, origin: coordinate(e), startValue: value, unitsPerPixel: outward / pixelsPerUnit };
  }

  function move(e: PointerEvent<SVGGElement>) {
    const gesture = drag.current;
    if (gesture?.id === e.pointerId) commit(gesture.startValue + (coordinate(e) - gesture.origin) * gesture.unitsPerPixel);
  }

  function finish(e: PointerEvent<SVGGElement>) {
    if (drag.current?.id !== e.pointerId) return;
    move(e);
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function keyDown(e: KeyboardEvent<SVGGElement>) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step = e.shiftKey ? 1 : limits.step;
    const increase = vertical ? -step : step;
    let next: number;
    switch (e.key) {
      case "ArrowUp": next = value + increase; break;
      case "ArrowDown": next = value - increase; break;
      case "ArrowRight": next = value + (vertical ? increase : step * outward); break;
      case "ArrowLeft": next = value - (vertical ? increase : step * outward); break;
      case "PageUp": next = value + increase * 4; break;
      case "PageDown": next = value - increase * 4; break;
      case "Home": next = vertical ? limits.max : limits.min; break;
      case "End": next = vertical ? limits.min : limits.max; break;
      default: return;
    }
    e.preventDefault();
    e.stopPropagation();
    commit(next);
  }

  function release(e: PointerEvent<SVGGElement>) {
    if (drag.current && drag.current.id !== e.pointerId) return;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
  }

  return (
    <g ref={handle} className="sprite-handle" data-axis={vertical ? "vertical" : "horizontal"}
      role="slider" tabIndex={0} aria-label={name} aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-describedby={instructionId}
      aria-valuemin={0} aria-valuemax={limits.max - limits.min}
      aria-valuenow={vertical ? limits.max - value : value - limits.min}
      aria-valuetext={vertical ? `${height}, ${Math.round((limits.max - value) / (limits.max - limits.min) * 100)}% of available height` :
        `${Math.round((shoulderWidth + 2 * value) / shoulderWidth * 100)}% of shoulder width`}
      transform={`translate(${point.x} ${point.y})`}
      onPointerDown={start} onPointerMove={move} onPointerUp={finish}
      onPointerCancel={release} onLostPointerCapture={release}
      onKeyDown={keyDown}>
      <desc id={instructionId}>{vertical ? "Use the up and down arrows to adjust the peak." : "Use the left and right arrows to move this hand."}</desc>
      <g transform={`scale(${1 / pixelScale})`}>
        {!vertical && <>
          <rect className="sprite-hit" x={outward < 0 ? -19 : -2} y="-4" width="21" height={chipDrop + 6} />
          <path className="sprite-tether" d={`M0 2 L${badgeX} ${chipDrop}`} />
        </>}
        <g transform={`translate(${badgeX} ${chipDrop})`}>
          <rect className="sprite-hit" x="-22" y="-22" width="44" height="44" rx="10" />
          {vertical ? <>
            <circle className="sprite-handle-focus" r="16" />
            <circle className="sprite-button-surface" r="9" />
            <circle className="sprite-hub" r="2" />
          </> : <>
            <rect className="sprite-handle-focus" x="-20" y="-12" width="40" height="24" rx="10" />
            <rect className="sprite-button-surface" x="-17" y="-9" width="34" height="18" rx="7" />
            <path className="sprite-grip" d="M-2 -2 h.1 M2 -2 h.1 M-2 2 h.1 M2 2 h.1" />
          </>}
          <path className="sprite-arrows" d={vertical ? "M-4 -14 L0 -18 L4 -14 M-4 14 L0 18 L4 14" :
            "M-8 -3 l-3 3 3 3 M8 -3 l3 3 -3 3"} />
        </g>
      </g>
    </g>
  );
}
