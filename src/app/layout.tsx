import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Learn to juggle", template: "%s | Learn to juggle" },
  description: "Learn a three-ball cascade with juggling instructor Jordan Winslow. Watch each movement, check your understanding, and practice at your own pace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
