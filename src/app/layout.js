import "./globals.css";
import Providers from "./providers";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Intelligent Stakeholder Matching",
  description: "Hybrid recommendation system for mentorship and networking",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
