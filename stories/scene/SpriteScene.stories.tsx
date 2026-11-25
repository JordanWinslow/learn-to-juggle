import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SpriteScene, type SpriteSceneProps } from "@/scene/SpriteScene";
import { GEOMETRY_LIMITS } from "@/scene/geometry-limits";
import {
  cascadeCount, catchPhase, drillPhase, EXCHANGE_PHASES, GUIDE_PHASES, NEUTRAL_APEX,
  poseAt, releasePhase, getReleaseEvent, type DrillPattern,
} from "@/scene/motion";

const meta = {
  title: "Organisms/Sprite scene",
  component: SpriteScene,
  args: {
    phase: GUIDE_PHASES.apex / 2,
    spacing: 0,
    apex: NEUTRAL_APEX,
    view: "front",
    count: 1,
    faded: false,
    showBall: true,
    showPath: true,
    waitingForThrow: false,
  },
  argTypes: {
    phase: { control: { type: "range", min: 0, max: 1, step: 0.005 }, description: "One complete out-and-back loop." },
    spacing: { control: { type: "range", ...GEOMETRY_LIMITS.spacing, step: 1 }, description: "Outward offset per palm in native sprite pixels." },
    apex: { control: { type: "range", ...GEOMETRY_LIMITS.apex, step: 1 }, description: "Peak Y from the top of the sprite. Eye level is 79." },
    count: { options: [1, 2, 3], control: "inline-radio" },
    view: { options: ["front", "side"], control: "inline-radio" },
    highlight: { options: [undefined, "apex", "spacing"], control: "select" },
    onGeometryChange: { table: { disable: true } },
    className: { table: { disable: true } },
  },
} satisfies Meta<typeof SpriteScene>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Front: Story = {};
export const SidePosture: Story = { args: { view: "side" } };

function EditableScene(props: SpriteSceneProps) {
  const [geometry, setGeometry] = useState({ spacing: props.spacing, apex: props.apex });
  return <SpriteScene {...props} {...geometry} onGeometryChange={(field, value) =>
    setGeometry(previous => ({ ...previous, [field]: value }))} />;
}

export const DragGeometry: Story = {
  argTypes: {
    apex: { control: { type: "range", ...GEOMETRY_LIMITS.apex, step: 1 } },
    spacing: { control: { type: "range", ...GEOMETRY_LIMITS.spacing, step: 1 } },
  },
  render: (args) => <EditableScene key={`${args.apex} ${args.spacing}`} {...args} />,
};

export const KeyboardGeometry: Story = {
  ...DragGeometry,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const peak = canvas.getByRole("slider", { name: "Arc peak" });
    const rightHand = canvas.getByRole("slider", { name: /coach’s right hand/ });
    const leftHand = canvas.getByRole("slider", { name: /coach’s left hand/ });
    await userEvent.tab();
    await expect(peak).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(peak).toHaveAttribute("aria-valuenow", "0");
    const dots = Array.from(canvasElement.querySelectorAll(".sprite-path circle"));
    await expect(dots.length).toBeGreaterThan(2);
    await expect(dots.every(dot => Number(dot.getAttribute("cy")) === GEOMETRY_LIMITS.apex.max)).toBe(true);
    await userEvent.keyboard("{End}");
    await expect(peak).toHaveAttribute("aria-valuenow", String(GEOMETRY_LIMITS.apex.max - GEOMETRY_LIMITS.apex.min));
    await userEvent.tab();
    await expect(rightHand).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    const wider = Number(rightHand.getAttribute("aria-valuenow"));
    await userEvent.keyboard("{ArrowRight}");
    await expect(Number(rightHand.getAttribute("aria-valuenow"))).toBe(wider - GEOMETRY_LIMITS.spacing.step);
    await userEvent.tab();
    await expect(leftHand).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(leftHand).toHaveAttribute("aria-valuenow", String(wider));
    const scene = canvas.getByRole("group", { name: "Juggling coach" });
    scene.focus();
    const before = Number(peak.getAttribute("aria-valuenow"));
    await userEvent.keyboard("{ArrowDown}");
    await expect(peak).toHaveAttribute("aria-valuenow", String(before - GEOMETRY_LIMITS.apex.step));
  },
};

export const SideAdjustment: Story = {
  ...DragGeometry,
  args: { view: "side", phase: GUIDE_PHASES.apex },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const peak = canvas.getByRole("slider", { name: "Arc peak" });
    const hand = canvas.getByRole("slider", { name: /coach’s left hand/ });
    const ball = canvasElement.querySelector("[data-ball]");
    const palm = canvasElement.querySelector('[data-profile-arm="left"] > svg');
    const startBall = ball?.getAttribute("transform");
    const startPalm = Number(palm?.getAttribute("x"));
    peak.focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(ball?.getAttribute("transform")).not.toBe(startBall);
    hand.focus();
    await userEvent.keyboard("{End}");
    await expect(hand).toHaveAttribute("aria-valuenow", String(GEOMETRY_LIMITS.spacing.max - GEOMETRY_LIMITS.spacing.min));
    await expect(Number(palm?.getAttribute("x"))).toBeGreaterThan(startPalm);
  },
};
export const CatchDip: Story = { args: { phase: (GUIDE_PHASES.catch + GUIDE_PHASES.return) / 2 } };
export const WideHands: Story = { args: { spacing: GEOMETRY_LIMITS.spacing.max, faded: true, highlight: "spacing" } };
export const CloseHands: Story = { args: { spacing: GEOMETRY_LIMITS.spacing.min, faded: true, highlight: "spacing" } };
export const LowArc: Story = { args: { apex: GEOMETRY_LIMITS.apex.max, phase: GUIDE_PHASES.apex, faded: true, highlight: "apex" } };
export const HighArc: Story = { args: { apex: GEOMETRY_LIMITS.apex.min, phase: GUIDE_PHASES.apex, faded: true, highlight: "apex" } };
export const HandsOnly: Story = { args: { faded: true, showBall: false, showPath: false } };
async function checkTrails(canvas: HTMLElement, yarns: string[]) {
  const colors = new Set<string>();
  for (const yarn of yarns) {
    const flood = canvas.querySelector(`filter[id$="-dye-${yarn}"] feFlood`)!;
    const dots = canvas.querySelectorAll(`[data-trail="${yarn}"] circle`);
    await expect(dots.length).toBeGreaterThan(0);
    await expect(canvas.querySelector(`[data-ball="${yarn}"] use`)?.getAttribute("filter")).toContain(`dye-${yarn}`);
    const dye = getComputedStyle(flood).floodColor;
    colors.add(dye);
    for (const dot of dots) {
      await expect(getComputedStyle(dot).fill).toBe(dye);
      await expect(dot).toHaveAttribute("r", "2.3");
    }
  }
  await expect(colors.size).toBe(yarns.length);
}

export const TwoBallExchange: Story = {
  args: { count: 2, phase: (EXCHANGE_PHASES.secondRelease + EXCHANGE_PHASES.firstCatch) / 2 },
  play: async ({ canvasElement, args }) => {
    await expect(canvasElement.querySelectorAll("[data-ball]")).toHaveLength(2);
    await checkTrails(canvasElement, ["coral", "turquoise"]);
    // Both halves return each ball to a palm. Check the handoff and the
    // timing cue, including when the left hand starts the next exchange.
    for (const offset of [0, 0.5]) {
      const ballsAt = (phase: number) => poseAt(offset + phase, args, 2).balls;
      const lead = offset === 0 ? "right" : "left";
      const follow = offset === 0 ? "left" : "right";
      await expect(ballsAt(EXCHANGE_PHASES.ready).map(ball => ball.heldBy)).toEqual([lead, follow]);
      await expect(ballsAt(EXCHANGE_PHASES.firstRelease).map(ball => ball.heldBy)).toEqual([null, follow]);
      const [first, second] = ballsAt(EXCHANGE_PHASES.secondRelease);
      const justBefore = ballsAt(EXCHANGE_PHASES.secondRelease - 0.002)[0];
      await expect(first.y).toBeGreaterThan(justBefore.y);
      await expect(first.y).toBeGreaterThan(args.apex);
      await expect(offset === 0 ? first.x > 104 : first.x < 104).toBe(true);
      await expect(second.heldBy).toBeNull();
      await expect(ballsAt(EXCHANGE_PHASES.firstCatch).map(ball => ball.heldBy)).toEqual([follow, null]);
      await expect(ballsAt(EXCHANGE_PHASES.secondCatch).map(ball => ball.heldBy)).toEqual([follow, lead]);
      for (let phase = EXCHANGE_PHASES.secondRelease; phase < EXCHANGE_PHASES.firstCatch; phase += 0.002) {
        const [a, b] = ballsAt(phase);
        // On their matching crossing arcs, the twenty-pixel balls pass clear of one another.
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20);
      }
      const beforeRestart = ballsAt(0.49999);
      for (const [index, ball] of ballsAt(0.5).entries()) {
        await expect(ball.heldBy).toBe(beforeRestart[index].heldBy);
        await expect(ball.x).toBeCloseTo(beforeRestart[index].x, 2);
        await expect(ball.y).toBeCloseTo(beforeRestart[index].y, 2);
      }
    }
  },
};

export const ThreeBallDemo: Story = {
  args: { count: 3, phase: 0.12 },
  play: ({ canvasElement }) => checkTrails(canvasElement, ["coral", "turquoise", "amber"]),
};
export const TimingFrame: Story = {
  args: { waitingForThrow: true, count: 2, phase: EXCHANGE_PHASES.secondRelease },
  play: async ({ canvasElement }) => {
    const scene = within(canvasElement).getByRole("img", { name: /Juggling coach/ });
    await expect(scene).toHaveAccessibleDescription(/first ball has passed the middle and is starting to fall/);
    await expect(scene.querySelector('use[href$="-left"]')).toBeInTheDocument();
    await expect(scene.querySelector('use[href$="-right"]')).toBeInTheDocument();
    await expect(scene.querySelectorAll('[data-ball]')).toHaveLength(2);
    await expect(scene.querySelectorAll('[data-trail="turquoise"] circle')).toHaveLength(0);
  },
};

export const ReleaseAndCatch: Story = {
  args: { count: 3, pattern: 'three-throws', phase: drillPhase('three-throws', 2) },
  play: ({ args }) => {
    for (const pattern of ['held-third', 'three-throws', 'six-throws', 'nine-throws', 'continuous'] as const) {
      const hand = (beat: number) => poseAt(drillPhase(pattern, beat), args, 3, pattern).hands.right;
      expect(hand(0).y).toBeLessThan(hand(-0.4).y);
      expect(hand(0).x).toBeGreaterThan(hand(-0.4).x);
      for (let beat = 0; beat < 2.65; beat += 0.1) {
        const p = hand(beat);
        // The wrist follows the same 8 × 12 native-pixel oval at every tempo.
        expect(((p.x - 58) / 4) ** 2 + ((p.y - 194) / 6) ** 2).toBeCloseTo(1, 6);
      }
    }
    const middle = poseAt(releasePhase(3, getReleaseEvent('apex')), args, 3, 'three-throws').balls[1];
    const descending = poseAt(releasePhase(3, getReleaseEvent('descending')), args, 3, 'three-throws', true).balls;
    expect(descending[1].x).toBeLessThan(middle.x);
    expect(descending[1].y).toBeGreaterThan(middle.y);
    expect(descending[2].heldBy).toBe('right');
  },
};

export const CountLandedCascades: Story = {
  args: { count: 3, pattern: 'nine-throws', phase: catchPhase('nine-throws', 6) },
  play: () => {
    for (const [pattern, groups] of [['three-throws', 1], ['six-throws', 2], ['nine-throws', 3]] as const) {
      for (let group = 1; group <= groups; group++) {
        const landing = catchPhase(pattern, group * 3);
        expect(cascadeCount(landing - 0.0001, pattern)).toBe(group - 1);
        expect(cascadeCount(landing, pattern)).toBe(group);
      }
      expect(cascadeCount(1, pattern, 2)).toBe(groups);
    }
    const pattern: DrillPattern = 'continuous';
    const landing = catchPhase(pattern, 12);
    expect(cascadeCount(landing % 1, pattern, Math.floor(landing))).toBe(4);
  },
};

export const RehearseTheReturnArc: Story = {
  ...DragGeometry,
  args: { count: 3, pattern: 'three-throws', arcBall: 2, waitingForThrow: true, phase: releasePhase(3, getReleaseEvent('descending')), apex: 145 },
  play: async ({ canvasElement }) => {
    const quiz = within(canvasElement);
    const reference = canvasElement.querySelector('[data-arc="previous"]')!;
    const candidate = canvasElement.querySelector('[data-arc="proposed"]')!;
    const previousDots = reference.innerHTML;
    const startingDots = candidate.innerHTML;
    const held = canvasElement.querySelector('[data-ball="amber"]')!.getAttribute('transform');
    const slider = quiz.getByRole('slider', { name: 'Arc peak' });
    slider.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(candidate.innerHTML).not.toBe(startingDots);
    expect(reference.innerHTML).toBe(previousDots);
    expect(canvasElement.querySelector('[data-ball="amber"]')).toHaveAttribute('transform', held);
    expect(quiz.getAllByRole('slider')).toHaveLength(1);
  },
};
