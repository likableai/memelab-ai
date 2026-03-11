'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Home, MessageCircle, Settings as SettingsIcon, Wallet as WalletIcon, LayoutDashboard, Search, ImageIcon, ImagePlus, Twitter, Github, Map, MoreVertical } from 'lucide-react';

/* Single sidebar layout tokens - one spacing value for all gaps/padding */
const SIDEBAR_SPACING = 'var(--space-3)';

const SIDEBAR_ASIDE_STYLE = {
  borderColor: 'var(--border-opacity-10)',
  backgroundColor: 'var(--bg-secondary)',
  zIndex: 'var(--z-sidebar)',
  paddingTop: SIDEBAR_SPACING,
} as const;

const SIDEBAR_HEADER_STYLE = {
  padding: SIDEBAR_SPACING,
  borderColor: 'var(--border-opacity-5)',
} as const;

const SIDEBAR_NAV_CONTAINER_STYLE = {
  padding: `${SIDEBAR_SPACING} 0`,
} as const;

const SIDEBAR_NAV_STYLE = {
  gap: SIDEBAR_SPACING,
  paddingLeft: SIDEBAR_SPACING,
  paddingRight: SIDEBAR_SPACING,
} as const;

const SIDEBAR_ITEM_STYLE = {
  gap: SIDEBAR_SPACING,
  padding: SIDEBAR_SPACING,
} as const;

const SIDEBAR_ITEM_CLASS = 'nav-link w-full flex items-center rounded-lg text-left cursor-pointer';

const SIDEBAR_FOOTER_STYLE = {
  borderColor: 'var(--border-opacity-5)',
  padding: SIDEBAR_SPACING,
} as const;

const ICON_LG = { width: 'var(--icon-lg)', height: 'var(--icon-lg)' } as const;
const ICON_XL = { width: 'var(--icon-xl)', height: 'var(--icon-xl)' } as const;

interface SidebarProps {
  onTextChatOpen?: () => void;
  onSettingsOpen?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTextChatOpen, onSettingsOpen }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      {/* Mobile Bottom Nav - kept for backwards compatibility */}
      {isMobile && (
        <>
          {/* Collapsible panel above the bar */}
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
                boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onSettingsOpen === 'function') onSettingsOpen();
                    else router.push('/?drawer=settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`nav-link w-full flex items-center rounded-lg text-left cursor-pointer ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Settings"
                >
                  <SettingsIcon className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Settings</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onTextChatOpen === 'function') onTextChatOpen();
                    else router.push('/?drawer=chat');
                    setMobileMenuOpen(false);
                  }}
                  className={`nav-link w-full flex items-center rounded-lg text-left cursor-pointer ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Chats"
                >
                  <MessageCircle className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Chats</span>
                </button>
                <Link
                  href="/roadmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-link w-full flex items-center rounded-lg no-underline ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Roadmap"
                >
                  <Map className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Roadmap</span>
                </Link>
                <Link
                  href="/image-studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-link w-full flex items-center rounded-lg no-underline ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Image Studio"
                >
                  <ImagePlus className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Image Studio</span>
                </Link>
              </div>
            </div>
          )}
          <nav
            data-mobile-bottom-nav="true"
            className="fixed bottom-0 left-0 right-0 safe-area-bottom"
            style={{
              ...SIDEBAR_ASIDE_STYLE,
              borderTop: '1px solid var(--border-opacity-10)',
              borderRight: 'none',
            }}
          >
            <div className="flex items-center justify-around" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <Link href="/" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Home">
                <Home style={ICON_XL} />
                <span className="text-xs">Home</span>
              </Link>
              <Link href="/dashboard" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Dashboard">
                <LayoutDashboard style={ICON_XL} />
                <span className="text-xs">Dashboard</span>
              </Link>
              <Link href="/explorer" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Explorer">
                <Search style={ICON_XL} />
                <span className="text-xs">Explorer</span>
              </Link>
              <Link href="/meme-studio" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Meme Studio">
                <ImageIcon style={ICON_XL} />
                <span className="text-xs">Meme</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
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
      )}
    </>
  );
};
