# Learn to juggle

[Open the course](https://learn-to-juggle.pages.dev/) · [Try the two-ball quiz](https://learn-to-juggle.pages.dev/course/two-ball/quiz) · [Explore the component library](https://storybook.learn-to-juggle.pages.dev/)

Jordan Winslow teaches a beginner how to juggle three balls. Learners watch one movement at a time, try it on screen, then practice with their own balls. Six phases take them from one toss to a continuous cascade.

## Edit a lesson

Open **[src/lessons/curriculum.ts](src/lessons/curriculum.ts)**. Use Find for a phrase such as `How to toss` or `Show me how you will toss the second ball`. The text appears there as it reads on screen. The same file contains the welcome, cues, quiz questions, corrections, and practice goals.

- **Change what Jordan says.** In `PHASES`, find the lesson and edit its `cues` in reading order. Each cue has a `title`, spoken `text`, a `pauseAt` position in the animation, and a `target` to highlight. A cue can request a side view or show the grip illustration.
- **Change the sequence.** Move a step within a phase’s `steps` list. The menu, destination buttons, static URLs, and Storybook gallery all read this list. Keep existing IDs and slugs stable so saved progress and bookmarks still work.
- **Choose what earns a phase badge.** Set `earnsBadge: true` on one quiz or practice in each phase. In this course, the first five badges come from quizzes. The final badge comes from reporting 50 throws.
- **Add a step.** Copy a `lesson`, `quiz`, or `practice` entry and give it a unique `id`. The URL defaults to `/course/<phase slug>/<kind>`. Set a unique `slug` if the phase has two steps of the same kind. In the final phase, the old `lesson` and `quiz` URLs redirect to the final practice. A new quiz can reuse an existing interaction. Add a new renderer to [quizzes](src/lessons/quizzes) and [CourseActivity](src/lessons/CourseActivity.tsx) only when its interaction changes.

## Run locally

Use Node.js 22.12 or newer. Fonts and sprites ship with the course.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). For the component library, run `npm run storybook` and open [Storybook](http://127.0.0.1:6006/). **Review → Component catalog → Every course step** lists every curriculum entry automatically. The sidebar also has named stories for the current 16 steps. Add a named export to [CourseSteps.stories.tsx](stories/course/CourseSteps.stories.tsx) if you want a new step pinned there. The end-to-end suite opens every curriculum URL automatically.

## How the course works

- **Routes and progress.** Next.js App Router builds a page for each curriculum step. Learners can bookmark a quiz or revisit a lesson from the phase menu. Browser storage keeps their name, earned badges and last visited step. Each visit starts the activity fresh. [Route](src/app/course/%5Bphase%5D/%5Bstep%5D/page.tsx) · [Progress](src/lessons/course-progress.ts)
- **Instruction.** Each cue stops at a specific pose. Learners choose when to move on. After the last cue, the demonstration loops. The transport honors a manual pause and the device’s reduced-motion setting. [Guided lesson](src/lessons/GuidedLesson.tsx) · [Playback](src/lessons/usePlayback.ts)
- **Interaction.** One motion model places the hands and balls in both views. In the two-ball quiz, the learner sets the arc, then chooses when to release the second ball. The preview shows the movement. Submitting explains the effect of that choice. Drag handles, keyboard controls and optional arrow buttons all adjust the same geometry. [Motion model](src/scene/motion.ts) · [Release timing quiz](src/lessons/quizzes/ReleaseTimingQuiz.tsx)
- **Shared UI.** [Theme](src/ui/theme.css) defines typography, contrast, control sizes and focus treatments. [UI components](src/ui) supply controls and feedback. [ScenePanel](src/lessons/ScenePanel.tsx) assembles the stage. [Welcome screens](src/welcome) share one mounted instructor across navigation. Story definitions, fixtures and interaction tests live under [stories](stories).

## Verification and deployment

Install Chromium once with `npx playwright install chromium`.

| Command | What it checks |
| --- | --- |
| `npm run lint` and `npm run typecheck` | ESLint, generated route types and TypeScript |
| `npm test` | Storybook component interactions and automated accessibility checks in Chromium |
| `npm run build-storybook` | The standalone component library |
| `npm run build` | A static production export in `out/` |
| `npm run test:e2e` | Phone and desktop learner flows using the local Pages runtime after building |

`npm start` serves the production export locally. Set `PLAYWRIGHT_BASE_URL` to run the same end-to-end tests against a deployment. To publish a new version, authenticate with `npx wrangler login` and run `npm run deploy` from `main`. Run `npm run deploy-storybook` to publish the component library to the `storybook` branch of the same Pages project. GitHub pushes and deployment are separate steps.

## Scope and tools

The quizzes check decisions a learner can demonstrate on screen. Physical practice is self-reported. Progress stays in the current browser. The next teaching check would be watching first-time jugglers follow the cues, especially whether they recognize the moment to release the second ball.

Built in Marker Learning’s Next.js, React, TypeScript and Tailwind starter. Jordan supplied the curriculum, selected the sprites and reviewed the interactions. Higgsfield produced the grip illustration and closing portrait. ImageGen was also used during visual exploration. Codex assisted with implementation, testing and documentation. Planning, artwork, development and verification took about three and a half hours of active work. [Original take-home exercise](https://github.com/markerlearning/teach-me-takehome/blob/6daf585fda6428df87406191e6d82fff0e2f49e6/README.md)
