'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';

const NAV_LINKS = [
  { label: 'Create', href: '/meme-studio' },
  { label: 'AI Studio', href: '/image-studio' },
  { label: 'Explorer', href: '/explorer' },
  { label: 'Roadmap', href: '/roadmap' },
];

export const Navbar = () => {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        width: '100%',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          gap: 'var(--space-6)',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              color: '#020617',
              letterSpacing: '0.02em',
            }}
          >
            ML
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 'var(--font-sm)',
              color: 'var(--text)',
              display: 'none',
            }}
            className="md:block"
          >
            MemeLab<span style={{ color: 'var(--accent-primary)' }}> AI</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
          className="hidden lg:flex"
        >
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: active ? 'var(--text)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-hover)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                  borderBottom: active ? '1px solid var(--accent-primary)' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <div className="hidden md:flex">
            <WalletButton />
          </div>
          <Link
            href="/companion"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-2) var(--space-4)',
              background: 'white',
              color: '#020617',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.01em',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Try AI
          </Link>
        </div>
      </div>
    </header>
  );
};
