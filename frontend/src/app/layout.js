import localFont from "next/font/local";
import "./globals.css";
import { rethinkSans } from "./fonts";
import Header from "./components/Header";

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
          <div className="mx-auto max-w-[1440px]">
            <div className="absolute top-[20%] left-[20%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BA98D5]/30 blur-[150px] -z-10 pointer-events-none" />
            <div className="absolute hidden lg:block top-[20%] brightness-50 -right-[20%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BA98D5]/30 blur-[150px] -z-10 pointer-events-none" />
            <Header />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
