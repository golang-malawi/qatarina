// import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Providers } from "./providers";
import {
  Grid,
  GridItem
} from '@chakra-ui/react';
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QATARINA",
  description: "Next-Generation platform for Testing Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Grid
          templateAreas={`"header header"
                  "nav main"
                  "nav footer"`}
          gridTemplateRows={'50px 1fr 30px'}
          gridTemplateColumns={'150px 1fr'}
          h='100%'
          gap='1'
          color='blackAlpha.700'
          fontWeight='bold'
        >
          <GridItem pl='2' area={'header'}>
            QATARINA
          </GridItem>
          <GridItem pl='2' area={'nav'}>
            <Sidebar />
          </GridItem>
          <GridItem pl='2' area={'main'}>
            <Providers>{children}</Providers>
          </GridItem>
          <GridItem pl='2' area={'footer'}>
            <footer>
              A Research and Development Project by NNDI Ltd
            </footer>
          </GridItem>
        </Grid>
      </body>
    </html>
  );
}
