import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Manthan | Tech Fundamentals Uncovered",
  description: "Your curiosity, made clear. Turn a question or your notes into an animated tutorial, test your understanding, and build your learning path.",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
