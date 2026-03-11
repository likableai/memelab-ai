'use client';

import Link from 'next/link';
import { Map, ImagePlus, LayoutDashboard, Search, Home, ImageIcon, MessageCircle, MoreVertical, Settings as SettingsIcon } from 'lucide-react';
import React from 'react';
import { usePathname } from 'next/navigation';

const SIDEBAR_SPACING = 'var(--space-3)';
const ICON_XL = { width: 'var(--icon-xl)', height: 'var(--icon-xl)' } as const;

interface MobileNavProps {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
  onSettingsOpen?: () => void;
  onTextChatOpen?: () => void;
}

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/explorer', icon: Search, label: 'Explorer' },
  { href: '/meme-studio', icon: ImageIcon, label: 'Meme' },
  { href: '/companion', icon: ImagePlus, label: 'AI' },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  mobileMenuOpen,
  onToggleMenu,
  onSettingsOpen,
  onTextChatOpen,
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed left-0 right-0 lg:hidden transition-opacity"
          style={{
            bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))',
            zIndex: 'calc(var(--z-sidebar) - 1)',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            padding: SIDEBAR_SPACING,
            boxShadow: '0 -4px 18px rgba(15,23,42,0.9)',
          }}
        >
          <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
            <Link
              href="/roadmap"
              onClick={onToggleMenu}
              className="w-full flex items-center rounded-lg no-underline transition-colors"
              style={{
                gap: SIDEBAR_SPACING,
                padding: SIDEBAR_SPACING,
                color: isActive('/roadmap') ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              aria-label="Roadmap"
            >
              <Map className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm font-medium">Roadmap</span>
            </Link>
            <Link
              href="/image-studio"
              onClick={onToggleMenu}
              className="w-full flex items-center rounded-lg no-underline transition-colors"
              style={{
                gap: SIDEBAR_SPACING,
                padding: SIDEBAR_SPACING,
                color: isActive('/image-studio') ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              aria-label="Image Studio"
            >
              <ImagePlus className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm font-medium">Image Studio</span>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTextChatOpen?.();
                onToggleMenu();
              }}
              className="w-full flex items-center rounded-lg transition-colors"
              style={{
                gap: SIDEBAR_SPACING,
                padding: SIDEBAR_SPACING,
                color: 'var(--text-secondary)',
              }}
              aria-label="Chats"
            >
              <MessageCircle className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm font-medium">Chats</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSettingsOpen?.();
                onToggleMenu();
              }}
              className="w-full flex items-center rounded-lg transition-colors"
              style={{
                gap: SIDEBAR_SPACING,
                padding: SIDEBAR_SPACING,
                color: 'var(--text-secondary)',
              }}
              aria-label="Settings"
            >
              <SettingsIcon className="flex-shrink-0" style={ICON_XL} />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
      )}

      <nav
        data-mobile-bottom-nav="true"
        className="fixed bottom-0 left-0 right-0 safe-area-bottom border-t"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          zIndex: 'var(--z-sidebar)',
        }}
      >
        <div
          className="flex items-center justify-around"
          style={{ padding: 'var(--space-3) var(--space-4)' }}
        >
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center no-underline rounded-lg transition-colors duration-200 p-2"
                style={{
                  gap: 'var(--space-1)',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon 
                  style={{
                    ...ICON_XL,
                    opacity: active ? 1 : 0.7,
                  }} 
                />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex flex-col items-center cursor-pointer rounded-lg transition-colors duration-200 p-2"
            style={{
              gap: 'var(--space-1)',
              color: mobileMenuOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            aria-label="More options: Roadmap, Image Studio, Chats, Settings"
            aria-expanded={mobileMenuOpen}
          >
            <MoreVertical 
              style={{
                ...ICON_XL,
                opacity: mobileMenuOpen ? 1 : 0.7,
              }} 
            />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

