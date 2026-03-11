'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ImageIcon, Wand2, Bot, Search } from 'lucide-react';

/**
 * MobileNav — bottom tab bar shown on screens < lg (1024px).
 * Ordered by priority: Home → Meme Studio → Image Studio → AI Companion → Explorer.
 * The Navbar desktop drawer handles all secondary navigation (Dashboard, Roadmap, etc.).
 */

const TABS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/meme-studio', icon: ImageIcon, label: 'Meme' },
  { href: '/image-studio', icon: Wand2, label: 'Image AI' },
  { href: '/companion', icon: Bot, label: 'Companion' },
  { href: '/explorer', icon: Search, label: 'Explorer' },
];

export const MobileNav = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 lg:hidden safe-area-bottom"
      style={{
        borderTop: '1px solid var(--border)',
        backgroundColor: 'rgba(13, 27, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 30,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: 'var(--space-2)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'color 150ms ease',
                minWidth: '52px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                  transition: 'background 150ms ease',
                }}
              >
                <Icon style={{ width: '18px', height: '18px' }} />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
