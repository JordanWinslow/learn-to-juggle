import type { Preview } from "@storybook/nextjs-vite";
import "../stories/preview.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    a11y: { test: "error" },
    options: {
      storySort: {
        order: [
          "Review", ["Component catalog", "Course introduction", "Every course step", "Course navigation",
            "One ball", "Two-ball exchange", "Three-ball lessons", "Assessments", "Unavailable step"],
          "Foundations", "Atoms", "Molecules", "Organisms",
        ],
      },
    },
  },
};

export default preview;
