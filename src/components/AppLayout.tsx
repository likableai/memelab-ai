'use client';

import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout wraps all public-facing pages.
 * - Navbar is sticky at the top.
 * - MobileNav renders a fixed bottom tab bar on small screens.
 * - No footer — intentional product decision.
 * - The page body scrolls naturally — no overflow:hidden.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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
        Mobile bottom nav is 64px + safe-area-inset-bottom.
        The inline style handles the dynamic calc. The lg:!pb-0 Tailwind class
        overrides it at large screens (desktop has no bottom nav).
      */}
      <main
        className="lg:!pb-0"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
};
