'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { WalletButton } from './WalletButton';
import { Menu, X, ChevronDown, ImageIcon, Wand2, Bot, LayoutDashboard, Search, Map, Globe } from 'lucide-react';

// ─── Data ───────────────────────────────────────────────────────────────────

const AI_TOOLS = [
  {
    href: '/meme-studio',
    icon: ImageIcon,
    label: 'Meme Studio',
    desc: 'Video & GIF meme creation',
    soon: false,
  },
  {
    href: '/image-studio',
    icon: Wand2,
    label: 'Image Studio',
    desc: 'Logos, avatars, AI image generation',
    soon: false,
  },
  {
    href: '/companion',
    icon: Bot,
    label: 'AI Companion',
    desc: 'Voice-powered creative assistant',
    soon: false,
  },
  {
    href: '#',
    icon: Globe,
    label: 'Website Generator',
    desc: 'Generate meme sites with AI',
    soon: true,
  },
];

const SECONDARY_LINKS = [
  { href: '/explorer', icon: Search, label: 'Explorer' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/roadmap', icon: Map, label: 'Roadmap' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

const ProductDropdown: React.FC<DropdownMenuProps> = ({ open, onClose }) => {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div
      role="menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '320px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-2)',
        boxShadow: '0 20px 40px rgba(2,6,23,0.7)',
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <p
        style={{
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          padding: 'var(--space-2) var(--space-3)',
          marginBottom: 'var(--space-1)',
        }}
      >
        AI Tools
      </p>
      {AI_TOOLS.map(({ href, icon: Icon, label, desc, soon }) => {
        const active = !soon && (pathname === href || pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            role="menuitem"
            onClick={soon ? (e) => e.preventDefault() : onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              background: active ? 'rgba(0,229,160,0.07)' : 'transparent',
              transition: 'background 150ms ease',
              opacity: soon ? 0.6 : 1,
              cursor: soon ? 'default' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!active && !soon) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (!active && !soon) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: active ? 'rgba(0,229,160,0.15)' : 'var(--bg-tertiary)',
                border: `1px solid ${active ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: '15px', height: '15px', color: active ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: active ? 'var(--accent-primary)' : 'var(--text)' }}>
                  {label}
                </p>
                {soon && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0,229,160,0.12)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(0,229,160,0.2)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    Soon
                  </span>
                )}
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {desc}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

// ─── Mobile drawer ────────────────────────────────────────────────────────────

const MobileDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2,6,23,0.7)',
          zIndex: 49,
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(320px, 90vw)',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text)' }}>
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* AI Tools section */}
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <p
            style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            AI Tools
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {AI_TOOLS.map(({ href, icon: Icon, label, desc }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
                    border: active ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'rgba(16,185,129,0.18)' : 'var(--bg-tertiary)',
                      border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px', color: active ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: active ? 'var(--accent-primary)' : 'var(--text)' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0 var(--space-5)' }} />

        {/* Secondary links */}
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <p
            style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            More
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {SECONDARY_LINKS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: active ? 'var(--accent-primary)' : 'var(--text)',
                    background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 500,
                    transition: 'all 150ms ease',
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px', color: active ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Wallet at bottom */}
        <div style={{ marginTop: 'auto', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border)' }}>
          <WalletButton />
        </div>
      </div>
    </>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

export const Navbar = () => {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close on route change
  useEffect(() => {
    setDropdownOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  const isToolActive = AI_TOOLS.some(
    (t) => pathname === t.href || pathname.startsWith(t.href)
  );

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          width: '100%',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(2, 6, 23, 0.88)',
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
            padding: '0 var(--space-6)',
            height: '56px',
            gap: 'var(--space-4)',
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
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: '#020617',
                letterSpacing: '0.02em',
              }}
            >
              MC
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-sm)',
                letterSpacing: '-0.01em',
                color: 'var(--text)',
              }}
            >
              MemeClaw<span style={{ color: 'var(--accent-primary)' }}> AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden lg:flex"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: 1, justifyContent: 'center' }}
          >
            {/* AI Tools dropdown trigger */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: isToolActive ? 'rgba(16,185,129,0.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: isToolActive ? 'var(--accent-primary)' : 'var(--text)',
                  transition: 'all 150ms ease',
                  borderBottom: isToolActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
                }}
              >
                AI Tools
                <ChevronDown
                  style={{
                    width: '14px',
                    height: '14px',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease',
                    opacity: 0.7,
                  }}
                />
              </button>
              <ProductDropdown open={dropdownOpen} onClose={() => setDropdownOpen(false)} />
            </div>

            {/* Secondary links */}
            {SECONDARY_LINKS.map(({ href, label }) => {
              const active = pathname === href;
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
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
            {/* Wallet — hidden on mobile */}
            <div className="hidden md:flex">
              <WalletButton />
            </div>

            {/* Hamburger — shown on mobile only */}
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <Menu style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};
