import localFont from "next/font/local";
import "./globals.css";
import { rethinkSans } from "./fonts";

// const rethinkSans = localFont({
//   src: "./fonts/RethinkSans-VariableFont_wght.ttf",
//   variable: "--font-rethink-sans",
//   weight: "100 900",
// });

// export const urbanist = localFont({
//   src: "./fonts/Urbanist-VariableFont_wght.ttf",
//   variable: "--font-urbanist",
//   weight: "100 900",
// });

const metadata = {
  title: "finowl",
  description: "finowl app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={` ${rethinkSans.className} bg-black antialiased`}>
        <div className="//bg-image//">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </div>
      </body>
    </html>
  );
}
