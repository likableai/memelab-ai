'use client';

import Link from 'next/link';
import { Map, ImagePlus, LayoutDashboard, Search, Home, ImageIcon, MessageCircle, MoreVertical, Settings as SettingsIcon, Mic } from 'lucide-react';
import React from 'react';

const SIDEBAR_SPACING = 'var(--space-3)';
const ICON_XL = { width: 'var(--icon-xl)', height: 'var(--icon-xl)' } as const;

interface MobileNavProps {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
  onSettingsOpen?: () => void;
  onTextChatOpen?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  mobileMenuOpen,
  onToggleMenu,
  onSettingsOpen,
  onTextChatOpen,
}) => {
  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed left-0 right-0 lg:hidden transition-opacity"
          style={{
            bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))',
            zIndex: 'calc(var(--z-sidebar) - 1)',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-opacity-10)',
            borderBottom: '1px solid var(--border-opacity-10)',
            padding: SIDEBAR_SPACING,
            boxShadow: '0 -4px 18px rgba(15,23,42,0.9)',
          }}
        >
          <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSettingsOpen?.();
                onToggleMenu();
              }}
              className="nav-link w-full flex items-center rounded-lg text-left cursor-pointer"
              style={{ gap: SIDEBAR_SPACING, padding: SIDEBAR_SPACING }}
              aria-label="Settings"
            >
              <SettingsIcon className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm">Settings</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTextChatOpen?.();
                onToggleMenu();
              }}
              className="nav-link w-full flex items-center rounded-lg text-left cursor-pointer"
              style={{ gap: SIDEBAR_SPACING, padding: SIDEBAR_SPACING }}
              aria-label="Chats"
            >
              <MessageCircle className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm">Chats</span>
            </button>
            <Link
              href="/roadmap"
              onClick={onToggleMenu}
              className="nav-link w-full flex items-center rounded-lg no-underline"
              style={{ gap: SIDEBAR_SPACING, padding: SIDEBAR_SPACING }}
              aria-label="Roadmap"
            >
              <Map className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm">Roadmap</span>
            </Link>
            <Link
              href="/image-studio"
              onClick={onToggleMenu}
              className="nav-link w-full flex items-center rounded-lg no-underline"
              style={{ gap: SIDEBAR_SPACING, padding: SIDEBAR_SPACING }}
              aria-label="Image Studio"
            >
              <ImagePlus className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm">Image Studio</span>
            </Link>
          </div>
        </div>
      )}

      <nav
        data-mobile-bottom-nav="true"
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{
          borderColor: 'var(--border-opacity-10)',
          backgroundColor: 'var(--bg-secondary)',
          zIndex: 'var(--z-sidebar)',
        }}
      >
        <div
          className="flex items-center justify-around"
          style={{ padding: 'var(--space-3) var(--space-4)' }}
        >
          <Link
            href="/"
            className="nav-link flex flex-col items-center no-underline rounded-lg p-2"
            style={{ gap: 'var(--space-1)' }}
            aria-label="Home"
          >
            <Home style={ICON_XL} />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="nav-link flex flex-col items-center no-underline rounded-lg p-2"
            style={{ gap: 'var(--space-1)' }}
            aria-label="Dashboard"
          >
            <LayoutDashboard style={ICON_XL} />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link
            href="/explorer"
            className="nav-link flex flex-col items-center no-underline rounded-lg p-2"
            style={{ gap: 'var(--space-1)' }}
            aria-label="Explorer"
          >
            <Search style={ICON_XL} />
            <span className="text-xs">Explorer</span>
          </Link>
          <Link
            href="/meme-studio"
            className="nav-link flex flex-col items-center no-underline rounded-lg p-2"
            style={{ gap: 'var(--space-1)' }}
            aria-label="Meme Studio"
          >
            <ImageIcon style={ICON_XL} />
            <span className="text-xs">Meme</span>
          </Link>
          <Link
            href="/companion"
            className="nav-link flex flex-col items-center no-underline rounded-lg p-2"
            style={{ gap: 'var(--space-1)' }}
            aria-label="AI Companion"
          >
            <Mic style={ICON_XL} />
            <span className="text-xs">AI</span>
          </Link>
          <button
            type="button"
            onClick={onToggleMenu}
            className="nav-link flex flex-col items-center cursor-pointer rounded-lg p-2"
            style={{ gap: 'var(--space-1)' }}
            aria-label="More: Settings, Chats, Roadmap"
            aria-expanded={mobileMenuOpen}
          >
            <MoreVertical style={ICON_XL} />
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

