'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { CorrectionTarget } from '../scene';
import { FeedbackCard } from './feedback';
import './stage-correction.css';

type Props = {
  target: CorrectionTarget;
  title: string;
  children: ReactNode;
  onDismiss: () => void;
};
type Bounds = { left: number; top: number; right: number; bottom: number };

const keepWithin = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
function overlap(a: Bounds, b: Bounds, padding = 0) {
  const width = Math.min(a.right, b.right + padding) - Math.max(a.left, b.left - padding);
  const height = Math.min(a.bottom, b.bottom + padding) - Math.max(a.top, b.top - padding);
  return Math.max(0, width) * Math.max(0, height);
}

function positionCallout(host: HTMLElement, card: HTMLElement, line: SVGLineElement, scene: Element, target: CorrectionTarget) {
  const anchor = scene.querySelector(`[data-correction-anchor="${target}"]`);
  if (!anchor?.parentElement) return;
  // Work in viewport coordinates so projected SVG points, fonts, and browser zoom agree.
  const frame = host.getBoundingClientRect();
  if (!frame.width || !frame.height) return;
  const sx = host.clientWidth / frame.width, sy = host.clientHeight / frame.height;
  const width = card.offsetWidth / sx, height = card.offsetHeight / sy;
  const mark = anchor.parentElement.getBoundingClientRect(), point = anchor.getBoundingClientRect();
  const x = (point.left + point.right) / 2, y = (point.top + point.bottom) / 2;
  const lesson = host.closest('main') ?? host.offsetParent;
  const obstacle = lesson?.querySelector('[data-correction-avoid]')?.getBoundingClientRect();
  const boundary = lesson?.getBoundingClientRect() ?? frame;
  const gap = 8, radius = 16;
  const left = frame.left + gap, right = Math.max(left, frame.right - width - gap);
  const top = frame.top + gap, bottom = Math.max(top, frame.bottom - height - gap);
  const minY = Math.max(0, boundary.top) + gap;
  const maxY = Math.max(minY, Math.min(window.innerHeight, boundary.bottom) - height - gap);
  const minX = Math.max(0, boundary.left) + gap;
  const maxX = Math.max(minX, Math.min(window.innerWidth, boundary.right) - width - gap);
  // On a short phone, a card can straddle the picture boundary to keep both palms
  // or the peak exposed. It stays within the lesson, leaving phase navigation free.
  const rows = [top, bottom, keepWithin(y - height / 2, top, bottom), mark.top - height - 22, mark.bottom + 22];
  const columns = [left, right, keepWithin(mark.left - width - 22, minX, maxX), keepWithin(mark.right + 22, minX, maxX)];
  const options = rows.flatMap(row => columns.map(column => {
    const t = keepWithin(row, minY, maxY);
    const box = { left: column, top: t, right: column + width, bottom: t + height };
    const dx = x - keepWithin(x, box.left, box.right), dy = y - keepWithin(y, box.top, box.bottom);
    const side = Math.abs(dx) > Math.abs(dy);
    // Meet the straight border, leaving the rounded corner clear.
    const edgeX = side ? (dx > 0 ? box.right : box.left) : keepWithin(x, box.left + radius, box.right - radius);
    const edgeY = side ? keepWithin(y, box.top + radius, box.bottom - radius) : (dy > 0 ? box.bottom : box.top);
    return { box, edgeX, edgeY, obscures: overlap(box, mark, gap), controls: obstacle ? overlap(box, obstacle, gap) : 0,
      spill: Math.max(0, frame.left - box.left) + Math.max(0, box.right - frame.right) +
        Math.max(0, frame.top - box.top) + Math.max(0, box.bottom - frame.bottom),
      length: Math.hypot(edgeX - x, edgeY - y) };
  }));
  const best = options.sort((a, b) => a.obscures - b.obscures || a.controls - b.controls ||
    a.spill - b.spill || Math.abs(a.length - 56) - Math.abs(b.length - 56))[0];
  card.style.transform = `translate(${(best.box.left - frame.left) * sx}px, ${(best.box.top - frame.top) * sy}px)`;
  card.style.setProperty('--join-x', `${(best.edgeX - best.box.left) * sx}px`);
  card.style.setProperty('--join-y', `${(best.edgeY - best.box.top) * sy}px`);
  line.setAttribute('x1', String((x - frame.left) * sx));
  line.setAttribute('y1', String((y - frame.top) * sy));
  line.setAttribute('x2', String((best.edgeX - frame.left) * sx));
  line.setAttribute('y2', String((best.edgeY - frame.top) * sy));
}

/** Place inside the positioned container shared with the highlighted scene. */
export function StageCorrection({ target, title, children, onDismiss }: Props) {
  const layer = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGLineElement>(null);
  const action = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const host = layer.current, message = card.current, line = leader.current;
    const stage = host?.offsetParent, scene = stage?.querySelector('.sprite-scene');
    if (!host || !message || !line || !stage || !scene) return;
    const connect = () => positionCallout(host, message, line, scene, target);
    connect();
    const resize = new ResizeObserver(connect);
    [host, message, scene].forEach(el => resize.observe(el));
    const changes = new MutationObserver(connect);
    // Ball flight can update every frame while the corrected peak stays still.
    // Listen to the highlighted feature and new overlays, not the entire coach.
    const feature = scene.querySelector(`[data-correction-feature="${target}"]`);
    if (feature) changes.observe(feature, { subtree: true, attributes: true, attributeFilter: ['cx', 'cy', 'd', 'transform'] });
    changes.observe(stage, { childList: true });
    const obstacle = (host.closest('main') ?? stage).querySelector('[data-correction-avoid]');
    if (obstacle) resize.observe(obstacle);
    return () => { resize.disconnect(); changes.disconnect(); };
  }, [target]);

  useLayoutEffect(() => {
    const previous = document.activeElement, button = action.current;
    button?.focus({ preventScroll: true });
    return () => {
      if (document.activeElement === button && previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [title]);

  return (
    <div className="ui-stage-correction" ref={layer} onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onDismiss(); }
    }}>
      <svg aria-hidden="true" className="ui-correction-leader"><line ref={leader} /></svg>
      <div className="ui-correction-position" ref={card}>
        <FeedbackCard className="ui-correction-card" tone="error" title={title} onDismiss={onDismiss}
          actionRef={action}>{children}</FeedbackCard>
      </div>
    </div>
  );
}
