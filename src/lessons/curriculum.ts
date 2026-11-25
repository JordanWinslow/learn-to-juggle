import { catchPhase, drillPhase, getReleaseEvent, EXCHANGE_PHASES, GUIDE_PHASES, type BallCount, type DrillPattern, type ThrowNumber, type ReleaseEvent } from '../scene/motion';
import type { SceneTarget } from '../scene/SceneHint';

// Edit the course here. Each phase lists its steps in teaching order.
// IDs are used by saved progress, and slugs are used in bookmarked URLs.
// A step defaults to /course/<phase slug>/<kind>. Set its slug for another step of the same kind.
// Mark exactly one quiz or practice per phase with earnsBadge: true.
export type TeachingCue = {
  title: string;
  text: string;
  pauseAt: number;
  target: SceneTarget;
  view?: 'front' | 'side';
  showGrip?: boolean;
};

export type PracticeRound = {
  instructionTitle: string;
  instruction: string;
  completion: string;
  pattern?: DrillPattern;
  cascadeGoal?: number;
  recordLabel?: string;
  nextLabel?: string;
};

type NonemptyList<T> = readonly [T, ...T[]];
type Quiz = { quiz: 'geometry' | 'grip' | 'count' } | { quiz: 'release'; throwNumber: ThrowNumber };
export type Activity = { id: string; title: string; slug?: string } & (
  | { kind: 'lesson'; cues: NonemptyList<TeachingCue>; pattern?: DrillPattern; initialSpeed?: 0.5 | 1; greeting?: boolean }
  | ({ kind: 'quiz'; earnsBadge?: true } & Quiz)
  | { kind: 'practice'; rounds: NonemptyList<PracticeRound>; earnsBadge?: true }
);

export const PHASES = [
  {
    id: 'one-ball', slug: 'one-ball', name: 'One ball', balls: 1,
    steps: [
      {
        id: 'guide', kind: 'lesson', title: 'How to toss', greeting: true,
        cues: [
          { title: 'Before you toss', target: 'elbow', view: 'side', pauseAt: GUIDE_PHASES.release,
            text: 'I’m excited to teach you how to juggle. Grab one ball. We’ll add the others once that first toss feels easy.' },
          { title: 'Bend your elbows', target: 'elbow', view: 'side', pauseAt: GUIDE_PHASES.release,
            text: 'Let’s start with your arms. Let them hang loose, then bend your elbows until your forearms point straight ahead. That’s 90 degrees. Turn your palms up.' },
          { title: 'Toss to eye level', target: 'apex', pauseAt: GUIDE_PHASES.apex,
            text: 'Hold your hands about shoulder-width apart. Toss one ball up and across to your other hand. See if the top of the toss lines up with your eyes.' },
          { title: 'Catch with the other hand', target: 'first-ball', pauseAt: GUIDE_PHASES.catch,
            text: 'Let the ball land in your open hand just outside your shoulder. Let your hand move down with it, then scoop inward and toss it back.' },
        ],
      },
      { id: 'geometry', kind: 'quiz', title: 'Hand spacing and arc', quiz: 'geometry', earnsBadge: true },
      {
        id: 'practice', kind: 'practice', title: 'Practice 50 tosses',
        rounds: [{
          instructionTitle: 'One ball',
          instruction: 'Try tossing back and forth at eye level. Count your catches up to 50. If you drop a ball, pick it up and give it another go.',
          completion: 'You’ve got the toss going both ways. Ready to add another ball?',
        }],
      },
    ],
  },
  {
    id: 'two-ball', slug: 'two-ball', name: 'Two-ball exchange', balls: 2,
    steps: [
      {
        id: 'exchange', kind: 'lesson', title: 'How to exchange two balls', initialSpeed: 0.5,
        cues: [
          { title: 'One ball in each hand', target: 'hands', pauseAt: EXCHANGE_PHASES.ready,
            text: 'Got a second ball? Hold one in each hand. Start by tossing the one in your right hand toward your left.' },
          { title: 'When to throw', target: 'first-ball', pauseAt: EXCHANGE_PHASES.secondRelease,
            text: 'Watch the first ball cross the middle. Just as it starts to fall, toss the ball in your left hand.' },
          { title: 'Where to aim', target: 'second-ball', pauseAt: (EXCHANGE_PHASES.secondRelease + EXCHANGE_PHASES.firstCatch) / 2,
            text: 'Send that second ball back toward your right hand. Try to give it the same height as the first, right around eye level.' },
          { title: 'Catch both balls', target: 'hands', pauseAt: EXCHANGE_PHASES.secondCatch,
            text: 'Catch the first ball with your left hand, then the second with your right. Stop there. That’s the whole exchange.' },
          { title: 'If the balls collide', target: 'first-ball', pauseAt: EXCHANGE_PHASES.secondRelease,
            text: 'Try that second throw a little later. See the first ball start down after it passes the middle? That’s your moment to toss.' },
        ],
      },
      { id: 'timing', kind: 'quiz', title: 'Second throw', quiz: 'release', throwNumber: 2, earnsBadge: true },
      {
        id: 'exchange-practice', kind: 'practice', title: 'Practice the exchange',
        rounds: [{
          instructionTitle: 'Both sides',
          instruction: 'Start with one ball in each hand. Toss right, then left, and catch them both. Now try it the other way around, starting with your left.',
          completion: 'You’ve done the exchange both ways. Now you can start with either hand.',
        }],
      },
    ],
  },
  {
    id: 'spare', slug: 'third-ball', name: 'Hold a third ball', balls: 3,
    steps: [
      {
        id: 'third-ball-lesson', kind: 'lesson', title: 'How to hold two balls', pattern: 'held-third', initialSpeed: 0.5,
        cues: [
          { title: 'Two in one hand', pauseAt: 0, target: 'third-ball', showGrip: true,
            text: 'Here’s how to hold two balls. Tuck one against your right palm with your ring finger and pinky. Rest the other on your index and middle fingers.' },
          { title: 'The first toss', pauseAt: drillPhase('held-third', 0), target: 'first-ball',
            text: 'Pick up a third ball with your left hand. Toss the ball on your right index and middle fingers. When it starts down, toss back with your left.' },
          { title: 'Catch beside it', pauseAt: catchPhase('held-third', 2), target: 'right-hand',
            text: 'Keep that tucked ball where it is. Your thumb, index and middle fingers are free to catch the returning ball right beside it.' },
        ],
      },
      { id: 'third-ball-quiz', kind: 'quiz', title: 'Choose which ball to throw', quiz: 'grip', earnsBadge: true },
      {
        id: 'third-ball-practice', kind: 'practice', title: 'Catch with a ball in your hand',
        rounds: [{
          instructionTitle: 'Hold one ball', pattern: 'held-third',
          instruction: 'Try that catch with your own balls. Tuck one ball in your palm and do the two-ball exchange. See if you can keep that tucked ball still.',
          completion: 'You caught one ball and held on to the other. Now you’re ready to throw all three.',
        }],
      },
    ],
  },
  {
    id: 'first-three', slug: 'three-throws', name: 'One cascade', balls: 3,
    steps: [
      {
        id: 'three-throws-lesson', kind: 'lesson', title: 'How to throw the third ball', pattern: 'three-throws', initialSpeed: 0.5,
        cues: [
          { title: 'Start with two', pauseAt: 0, target: 'first-ball',
            text: 'Now you get to throw all three. Toss first from the hand holding two balls. As that ball starts down, toss back from your other hand.' },
          { title: 'The third throw', pauseAt: drillPhase('three-throws', 2), target: 'second-ball',
            text: 'Watch the second ball. As soon as it starts down, toss the ball you kept tucked in your starting hand. Aim for the same height.' },
          { title: 'One cascade', pauseAt: catchPhase('three-throws', 3), target: 'hands',
            text: 'Catch the last ball and stop. We’ll call those three throws and three catches one cascade. Notice which hand holds two balls now.' },
        ],
      },
      { id: 'three-throws-quiz', kind: 'quiz', title: 'Third throw', quiz: 'release', throwNumber: 3, earnsBadge: true },
      {
        id: 'three-throws-practice', kind: 'practice', title: 'Practice one cascade',
        rounds: [{
          instructionTitle: 'One cascade', pattern: 'three-throws', cascadeGoal: 1,
          instruction: 'Toss each ball once. When you catch the third ball, say “one cascade” and stop. For your next try, start with the hand that’s holding two now.',
          completion: 'You just did a whole cascade! You tossed each ball once and caught all three.',
        }],
      },
    ],
  },
  {
    id: 'rotation', slug: 'six-throws', name: 'Link cascades', balls: 3,
    steps: [
      {
        id: 'six-throws-lesson', kind: 'lesson', title: 'How to keep going', pattern: 'six-throws', initialSpeed: 0.5,
        cues: [
          { title: 'Begin the next cascade', pauseAt: drillPhase('six-throws', 3), target: 'third-ball',
            text: 'Want to keep going? When the third ball starts down, toss the first ball again. It’s already back in your other hand.' },
          { title: 'Count one cascade', pauseAt: catchPhase('six-throws', 3), target: 'hands',
            text: 'Here’s where to count. When you catch the third throw, that’s one cascade. Your fourth throw is already on its way.' },
          { title: 'Two in a row', pauseAt: catchPhase('six-throws', 6), target: 'hands',
            text: 'Catch three more and you can say “two cascades.” For three in a row, keep going for one more group of three catches.' },
        ],
      },
      { id: 'six-throws-quiz', kind: 'quiz', title: 'Count a complete cascade', quiz: 'count', earnsBadge: true },
      {
        id: 'six-throws-practice', kind: 'practice', title: 'Link your cascades',
        rounds: [
          { instructionTitle: 'Two cascades', pattern: 'six-throws', cascadeGoal: 2,
            instruction: 'Say “one” when the third ball lands. Catch three more, say “two,” and stop.',
            completion: 'You kept it going through two cascades. Let’s try for three.', nextLabel: 'Practice three cascades' },
          { instructionTitle: 'Three cascades', pattern: 'nine-throws', cascadeGoal: 3,
            instruction: 'Go again, this time aiming for three cascades. Each time the third ball in a group lands, count one cascade.',
            completion: 'Three cascades in a row! You kept the same rhythm all the way through.' },
        ],
      },
    ],
  },
  {
    id: 'continuous', slug: 'cascade', name: 'Continuous cascade', balls: 3,
    steps: [
      {
        id: 'cascade-practice', kind: 'practice', title: 'Practice 50 throws', earnsBadge: true,
        rounds: [{
          instructionTitle: 'Your last practice', pattern: 'continuous',
          instruction: 'Let’s go for 50. Count one cascade every three catches. You’ll need 16 cascades, then two more catches. If you drop a ball, start a fresh run.',
          completion: 'You did it! Sixteen cascades and two more catches. That’s 50 throws in a row.', recordLabel: 'I made 50 throws',
        }],
      },
    ],
  },
] as const satisfies readonly { id: string; slug: string; name: string; balls: BallCount; steps: readonly Activity[] }[];

export type CoursePhase = typeof PHASES[number];
export type PhaseId = CoursePhase['id'];
export type CourseStep = CoursePhase['steps'][number]['id'];
export type StepKind = Activity['kind'];
export const STEP_LABEL = { lesson: 'Lesson', practice: 'Practice', quiz: 'Quiz' } as const;

export function nextStepLabel(step?: { kind: StepKind }) {
  if (!step) return 'Finish course';
  return step.kind === 'lesson' ? 'Next Lesson' : STEP_LABEL[step.kind];
}

function stepSlug(step: Activity) {
  return step.slug ?? step.kind;
}

export const COURSE_STEPS = PHASES.flatMap((phase, phaseIndex) =>
  phase.steps.map((step, stepIndex) => {
    const slug = stepSlug(step);
    return { ...step, phase, phaseIndex, stepIndex, slug, href: `/course/${phase.slug}/${slug}` };
  }),
);
export type CourseLocation = typeof COURSE_STEPS[number];

// Duplicate entries would otherwise shadow each other in bookmarks and the player.
const stepsById = new Map<CourseStep, CourseLocation>();
const stepUrls = new Set<string>();
for (const step of COURSE_STEPS) {
  if (stepsById.has(step.id)) throw new Error(`Duplicate curriculum step ID: ${step.id}`);
  if (stepUrls.has(step.href)) throw new Error(`Duplicate curriculum URL: ${step.href}. Give the additional step a unique slug.`);
  stepsById.set(step.id, step);
  stepUrls.add(step.href);
}

export function getCourseStep(id: CourseStep): CourseLocation {
  return stepsById.get(id)!;
}

export const PHASE_BADGE_STEPS = PHASES.map(phase => {
  const marked = phase.steps.filter(step => 'earnsBadge' in step && step.earnsBadge === true);
  if (marked.length !== 1) throw new Error(`Phase ${phase.id} needs exactly one badge-earning quiz or practice.`);
  return marked[0];
});

export const FINAL_BADGE_STEP = getCourseStep(PHASE_BADGE_STEPS[PHASE_BADGE_STEPS.length - 1].id);

// Quiz instructions, answers and feedback. The quizzes select the messages here
// after evaluating the learner’s choice or comparing it with the animation.
export const geometryQuizCopy = {
  prompt: 'Adjust the toss',
  instruction: 'Show how far apart you would hold your hands and how high you would toss one ball. Drag the handles or use the arrow keys.',
  success: 'Your hands are shoulder-width apart, and your toss reaches eye level.',
  wide: { title: 'Hands too wide', explanation: 'Bring your hands closer together until each palm lines up with its shoulder.' },
  close: { title: 'Hands too close', explanation: 'Move your hands farther apart until each palm lines up with its shoulder.' },
  low: { title: 'Arc too low', explanation: 'Raise the top of your toss to eye level. That gives you time to catch the ball.' },
  high: { title: 'Arc too high', explanation: 'Lower the top of your toss until it lines up with your eyes.' },
};

export const throwQuizCopy = {
  correctRelease: getReleaseEvent('descending'),
  arcPrompt: 'Choose the arc',
  timingPrompt: 'Choose the moment',
  earlyTitle: 'Too early',
  lateTitle: 'Too late',
  low: { title: 'Arc too low', hint: 'Raise your toss to eye level so it reaches the same height as the previous toss.' },
  high: { title: 'Arc too high', hint: 'Lower your toss to eye level so it reaches the same height as the previous toss.' },
  contact: 'The balls collide near the middle.',
  clear: 'The falling ball passes above the rising ball.',
  2: {
    arcInstruction: 'Show me how you will toss the second ball. Move the circle to choose its arc.',
    timingInstruction: 'Choose the correct moment to toss the second ball after the first one.',
    timingLabel: 'Second toss timing',
    frames: {
      justReleased: 'The first ball has just left the hand.',
      apex: 'The first ball is at its highest point.',
      descending: 'The first ball has passed the middle and is starting to fall.',
      nearCatch: 'The first ball is close to the catching hand.',
    } satisfies Record<ReleaseEvent['id'], string>,
    collision: 'The two balls collide near the middle. Wait until the first ball starts to fall before you toss the second.',
    early: 'The first ball is still at its highest point. Wait until it starts to fall, then toss the second ball.',
    late: 'The first ball is about to land. Toss the second ball a little sooner, just as the first starts to fall.',
    success: 'You tossed the second ball as the first started to fall. Both reached the same height and passed each other without colliding.',
  },
  3: {
    arcInstruction: 'Show me how you will toss the third ball. Move the circle to choose its arc.',
    timingInstruction: 'Choose the correct moment to toss the third ball after the second one.',
    timingLabel: 'Third toss timing',
    frames: {
      justReleased: 'The second ball has just left the hand.',
      apex: 'The second ball is at its highest point.',
      descending: 'The second ball has passed the middle and is starting to fall.',
      nearCatch: 'The second ball is close to the catching hand.',
    } satisfies Record<ReleaseEvent['id'], string>,
    collision: 'The second and third balls collide near the middle. Wait until the second ball starts to fall before you toss the third.',
    early: 'The second ball is still at its highest point. Wait until it starts to fall, then toss the third ball.',
    late: 'The second ball is about to land. Toss the third ball a little sooner, just as the second starts to fall.',
    success: 'You tossed the third ball as the second started to fall. It followed the same arc a moment later, giving both balls room to pass.',
  },
} as const;

export const gripQuizCopy = {
  picture: 'Two balls in one hand. The coral ball rests on the index and middle fingers. The gold ball rests against the ring finger and pinky.',
  choices: ['Index and middle', 'Ring and pinky'],
  questions: [
    { title: '1. The first throw', prompt: 'Which fingers release the first ball?', answer: 0,
      instruction: 'Which ball would you toss first? Tap it or choose the fingers holding it.',
      hint: 'Toss the ball resting on your index and middle fingers.' },
    { title: '2. The catch', prompt: 'Which fingers keep their grip during the catch?', answer: 1,
      instruction: 'You’re about to catch a ball. Which fingers will you use to hold on to the ball already in your hand?',
      hint: 'Hold the ball against your palm with your ring finger and pinky. That leaves your thumb and first two fingers free for the catch.' },
  ],
  correctionTitle: 'Look at your grip',
  success: 'You can toss from your index and middle fingers and keep the other ball tucked against your palm.',
} as const;

export const cascadeQuizCopy = {
  prompt: 'When does one cascade count?',
  instruction: 'Watch the ball inside the ring. Choose the first frame where you’ve completed one cascade.',
  frames: [
    { phase: drillPhase('six-throws', 1.65), description: 'The third ball is still in the starting hand.' },
    { phase: drillPhase('six-throws', 2.05), description: 'The third ball has just left the hand.' },
    { phase: drillPhase('six-throws', 3.1), description: 'The third ball is falling toward the other hand.' },
    { phase: catchPhase('six-throws', 3), description: 'The third ball lands in the other hand.' },
    { phase: drillPhase('six-throws', 4.2), description: 'The fifth throw is in the air. The third ball is still in the catching hand.' },
  ],
  correctionTitle: 'Watch the third catch',
  early: 'The third ball hasn’t landed yet. Look for the moment it reaches your catching hand.',
  late: 'You caught the third ball in an earlier frame. Go back to the moment it landed.',
  success: 'You caught the third ball. Count one cascade and keep tossing.',
} as const;

// The welcome, name and completion screens bookend the lessons.
export const welcomeCopy = {
  greetings: {
    firstLesson: { named: 'Hey, {name}!', anonymous: 'Hey there!' },
    returning: { named: 'Welcome back, {name}!', anonymous: 'Welcome back!' },
    finished: { named: 'Congratulations, {name}!', anonymous: 'Congratulations!' },
  },
  title: 'Learn to juggle',
  introduction: 'Hi, I’m Jordan Winslow, your juggling instructor. Grab three balls and come juggle with me.',
  goal: 'See how the balls cross from hand to hand?',
  explanation: 'That’s a three-ball cascade. It’s tempting to try all three right away. We’ll get one good toss down first, then build from there. Pause me whenever you want a turn.',
  benefits: {
    heading: 'Benefits of juggling',
    coordination: 'When you juggle, you practice following a ball with your eyes and moving your hand to catch it.',
    research: 'In one study, people who learned to juggle got faster at imagining a shape turned a different way. In another, brain scans showed changes in areas that track motion.',
    sources: [
      { label: 'Read the shape study', href: 'https://www.ijsp-online.com/abstract/view/40/351' },
      { label: 'Read the brain scan study', href: 'https://doi.org/10.1038/427311a' },
    ],
  },
  history: {
    heading: 'How old is juggling?',
    text: 'People juggled in ancient Egypt about 4,000 years ago. A tomb painting shows women tossing balls.',
    source: { label: 'Read about the painting', href: 'https://egymonuments.gov.eg/monuments/the-tomb-of-khety/' },
  },
  name: {
    heading: 'What should I call you?',
    instruction: 'Your first name or a nickname works. I’ll use it when we get started.',
    label: 'Your name or nickname',
    hint: 'Your name stays in this browser.',
  },
  finish: {
    heading: 'You know how to juggle!',
    achievement: 'Remember tossing just one ball back and forth? You just kept three going for 50 throws in a row.',
    nextGoal: 'Want to keep going? Try juggling clubs next. Flaming chainsaws? Just kidding.',
    retry: 'Choose Retry course to start again on this device.',
    resumeHeading: 'Your juggling practice',
    resumeInstruction: 'Ready to try for 50 throws in a row? You can pick up where you left off or go straight to the last practice.',
  },
} as const;
