'use client';

import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  /** Pass true to suppress the footer (e.g. full-screen tool pages) */
  noFooter?: boolean;
}

/**
 * AppLayout wraps all public-facing pages.
 * - Navbar is sticky at the top.
 * - MobileNav renders a fixed bottom tab bar on small screens (lg:hidden inside MobileNav).
 * - Footer renders at the bottom unless noFooter=true.
 * - The page body scrolls naturally — no overflow:hidden.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  noFooter = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        width: '100%',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        overflowX: 'hidden',
      }}
    >
      <Navbar />

      {/*
        pb-20 on mobile creates clearance for the 80px fixed bottom nav.
        On lg+ screens no extra padding is needed (bottom nav is hidden).
      */}
      <main
        className="lg:pb-0 pb-20"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {children}
      </main>

      {!noFooter && <Footer />}

      {/* Bottom tab bar — self-contained, hides itself on lg+ via CSS */}
      <MobileNav />
    </div>
  );
};
