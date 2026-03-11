'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  onTextChatOpen?: () => void;
  onSettingsOpen?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onTextChatOpen,
  onSettingsOpen,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="flex min-h-dvh w-full flex-col overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <Navbar />
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {children}
      </main>
      <Footer />
      {isMobile && (
        <MobileNav
          mobileMenuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((open) => !open)}
          onSettingsOpen={onSettingsOpen}
          onTextChatOpen={onTextChatOpen}
        />
      )}
    </div>
  );
};
