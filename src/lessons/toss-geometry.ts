import { NEUTRAL_APEX, type Geometry } from '../scene/motion';
import { compareArcHeight } from '../scene/geometry-limits';
import { geometryQuizCopy } from './curriculum';

type GeometryStatus = 'editing' | 'feedback' | 'success';
type GeometryIssue = {
  target: 'spacing' | 'apex';
  title: string;
  explanation: string;
};

export const initialGeometry: Geometry = { spacing: 32, apex: NEUTRAL_APEX + 80 };
export const correctGeometry: Geometry = { spacing: 0, apex: NEUTRAL_APEX };

export function assessGeometry({ spacing, apex }: Geometry): GeometryIssue[] {
  const issues: GeometryIssue[] = [];
  if (spacing > 5) {
    issues.push({ target: 'spacing', ...geometryQuizCopy.wide });
  } else if (spacing < -5) {
    issues.push({ target: 'spacing', ...geometryQuizCopy.close });
  }
  const height = compareArcHeight(apex);
  if (height === 'below') {
    issues.push({ target: 'apex', ...geometryQuizCopy.low });
  } else if (height === 'above') {
    issues.push({ target: 'apex', ...geometryQuizCopy.high });
  }
  return issues;
}

type State = { geometry: Geometry; status: GeometryStatus; issues: GeometryIssue[]; feedbackTotal: number };
type Action =
  | { type: 'set'; field: keyof Geometry; value: number }
  | { type: 'submit' }
  | { type: 'retry' }
  | { type: 'acknowledge'; target: GeometryIssue['target'] };

export function initialQuizState(geometry: Geometry): State {
  return { geometry, issues: [], status: 'editing', feedbackTotal: 0 };
}

export function quizReducer(state: State, action: Action): State {
  if (action.type === 'retry') return initialQuizState(initialGeometry);
  if (action.type === 'acknowledge' && state.status === 'feedback') {
    const issues = state.issues.filter(issue => issue.target !== action.target);
    return { ...state, issues, status: issues.length ? 'feedback' : 'editing' };
  }
  if (action.type === 'set') {
    if (action.value === state.geometry[action.field]) return state;
    return initialQuizState({ ...state.geometry, [action.field]: action.value });
  }
  if (action.type === 'submit') {
    const issues = assessGeometry(state.geometry);
    return { ...state, issues, status: issues.length ? 'feedback' : 'success', feedbackTotal: issues.length };
  }
  return state;
}
