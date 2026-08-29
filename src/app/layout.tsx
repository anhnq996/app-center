import type { Metadata } from "next";
import "../index.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "App Downloads",
  description: "Manage app download pages.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
