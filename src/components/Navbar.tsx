'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { Sparkles } from 'lucide-react';

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
      className="sticky top-0 z-40 w-full"
      style={{
        borderBottom: '1px solid var(--border-opacity-10)',
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Left — brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline shrink-0"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs tracking-tight shadow-lg"
            style={{
              backgroundImage: 'var(--gradient-primary)',
              color: '#020617',
              boxShadow: '0 0 16px rgba(16,185,129,0.35)',
            }}
          >
            ML
          </div>
          <span className="hidden font-semibold text-sm sm:block" style={{ color: 'var(--text)' }}>
            MemeLab<span style={{ color: 'var(--accent-primary)' }}> AI</span>
          </span>
        </Link>

        {/* Center — nav links (desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200"
                style={{
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'rgba(16,185,129,0.1)' : 'transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right — wallet + CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex">
            <WalletButton />
          </div>
          <Link
            href="/companion"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.03]"
            style={{
              backgroundImage: 'var(--gradient-primary)',
              color: '#020617',
              boxShadow: '0 0 18px rgba(16,185,129,0.28)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Try AI</span>
            <span className="sm:hidden">AI</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
