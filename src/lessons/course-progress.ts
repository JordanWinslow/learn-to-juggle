'use client';

import { useSyncExternalStore } from 'react';
import { COURSE_STEPS, PHASES, type PhaseId } from './curriculum';

const prefix = 'learn-to-juggle.';
const nameKey = prefix + 'learner-name';
const stepKey = prefix + 'last-step';
const changed = 'learn-to-juggle:progress';
const memory = new Map<string, string | null>();

export function badgeStorageKey(id: PhaseId) {
  return prefix + 'badge.' + id;
}

function read(key: string) {
  if (memory.has(key)) return memory.get(key) ?? '';
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }
  window.dispatchEvent(new Event(changed));
}

function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener(changed, notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(changed, notify);
  };
}

const empty = () => '';
const readName = () => read(nameKey);
const readStep = () => read(stepKey);
const readBadges = () => PHASES.filter(phase => read(badgeStorageKey(phase.id)) === '1')
  .map(phase => phase.id).join(' ');

export function saveLearnerName(name: string) { write(nameKey, name.trim().slice(0, 32)); }
export function useLearnerName() { return useSyncExternalStore(subscribe, readName, empty); }

export function saveLastStep(href: string) {
  if (read(stepKey) !== href) write(stepKey, href);
}

export function useResumeStep(name: string, completed: readonly string[]) {
  const href = useSyncExternalStore(subscribe, readStep, empty);
  const bookmark = COURSE_STEPS.find(step => step.href === href);
  if (bookmark) return bookmark;
  if (name || completed.length) return COURSE_STEPS.find(step => !completed.includes(step.phase.id)) ?? COURSE_STEPS[0];
}

// One key per badge lets different tabs earn badges independently.
export function markPhaseComplete(id: PhaseId) { write(badgeStorageKey(id), '1'); }

export function useCompletedPhases() {
  const ids = useSyncExternalStore(subscribe, readBadges, empty);
  return ids ? ids.split(' ') : [];
}

export function resetCourseProgress() {
  for (const { id } of PHASES) write(badgeStorageKey(id), null);
  write(stepKey, null);
}
