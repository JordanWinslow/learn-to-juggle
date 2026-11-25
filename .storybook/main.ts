import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwind from "@tailwindcss/postcss";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  staticDirs: [
    { from: "../public/fonts", to: "/fonts" },
    { from: "../public/sprites", to: "/sprites" },
  ],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  async viteFinal(config) {
    // Next uses the starter's Turbopack loader. Vite uses the same theme via PostCSS.
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      // Loading a new portal or navigation dependency mid-test remounts the canvas.
      optimizeDeps: { include: ["react-dom", "next/link", "next/image"] },
      server: { watch: { ignored: ["**/.next/**", "**/out/**", "**/storybook-static/**"] } },
      css: { postcss: { plugins: [tailwind()] } },
    });
  },
};

export default config;
