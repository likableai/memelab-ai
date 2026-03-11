'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Sparkles, ArrowRight, ChevronDown, ChevronUp,
  Zap, Download, Share2, Check,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { Footer } from '@/components/Footer';
import { useEffect } from 'react';

/* ─── Data ─────────────────────────────────────────────── */

const CATEGORIES = ['All', 'Reactions', 'Animals', 'Classic', 'Gaming', 'Business'];

const TEMPLATES = [
  { id: 1, name: 'Drake Pointing',         category: 'Reactions', rank: 1,  hue: 200 },
  { id: 2, name: 'Two Buttons',            category: 'Reactions', rank: 2,  hue: 240 },
  { id: 3, name: 'Distracted Boyfriend',   category: 'Classic',   rank: 3,  hue: 160 },
  { id: 4, name: 'Left Exit 12 Off Ramp',  category: 'Reactions', rank: 4,  hue: 30  },
  { id: 5, name: 'Change My Mind',         category: 'Classic',   rank: 5,  hue: 280 },
  { id: 6, name: 'This Is Fine',           category: 'Reactions', rank: 6,  hue: 20  },
  { id: 7, name: 'Doge',                   category: 'Animals',   rank: 7,  hue: 50  },
  { id: 8, name: 'Hide the Pain Harold',   category: 'Classic',   rank: 8,  hue: 330 },
];

const TOOLS = [
  {
    emoji: '✨',
    badge: 'AI Powered',
    badgeBg: '#6366f1',
    title: 'AI Meme Generator',
    desc: 'Describe your idea and let AI create stunning images or videos instantly.',
    cta: 'Try It Free',
    href: '/image-studio',
  },
  {
    emoji: '🎨',
    badge: 'Most Popular',
    badgeBg: '#10b981',
    title: 'Meme Editor',
    desc: 'Edit any of 1000+ templates — add text, stickers, filters, and effects.',
    cta: 'Open Editor',
    href: '/meme-studio',
  },
  {
    emoji: '🎙️',
    badge: 'New',
    badgeBg: '#f59e0b',
    title: 'AI Voice Companion',
    desc: 'Brainstorm meme ideas with a voice-powered AI companion. Real-time and on-chain.',
    cta: 'Try Companion',
    href: '/companion',
  },
];

const STEPS = [
  { num: '01', emoji: '📤', title: 'Choose or Upload', desc: 'Pick from 1000+ templates or upload your own image.', color: '#3b82f6' },
  { num: '02', emoji: '✏️', title: 'Customize',        desc: 'Add text, stickers, filters, and effects with ease.', color: '#6366f1' },
  { num: '03', emoji: '🔗', title: 'Share Instantly',  desc: 'Download or share directly to your favorite platform.', color: '#10b981' },
];

const FEATURES = [
  {
    label: '1000+ Premium Templates',
    title: "The internet's largest meme template library",
    bullets: ['Daily fresh templates', 'Category organisation', 'Search & filter'],
    emoji: '🗃️', accentColor: '#3b82f6', alt: false,
  },
  {
    label: 'Lightning-Fast Editor',
    title: 'Edit memes in real-time with AI-powered tools',
    bullets: ['Instant text overlays', 'Sticker & GIF library', 'One-click filters'],
    emoji: '⚡', accentColor: '#10b981', alt: true,
  },
  {
    label: 'High-Quality Export',
    title: 'Download crisp HD memes — zero watermarks',
    bullets: ['PNG & JPG export', 'No watermarks ever', 'Optimised file sizes'],
    emoji: '📥', accentColor: '#6366f1', alt: false,
  },
];

const FAQS = [
  { q: 'Is MemeLab AI really free?',       a: 'Yes! Create and download memes for free. Connect your wallet to unlock AI-powered features.' },
  { q: 'Do I need to create an account?',  a: 'No account needed to browse templates or create basic memes. Connect your wallet to use AI features.' },
  { q: 'Can I upload my own images?',      a: 'Absolutely. Upload any image and our editor will help you add text, stickers, and effects.' },
  { q: 'What AI tools are available?',     a: 'AI Meme Generator, AI captions, Voice Companion for brainstorming, and an Image Studio for custom creations.' },
  { q: 'How do I export?',                 a: 'Export as PNG or JPG, or share directly to social platforms with one click. No watermarks, ever.' },
];

/* ─── Page ─────────────────────────────────────────────── */

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filtered = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-dvh w-full" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* bg glows */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'var(--gradient-surface)' }}
        />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-14 lg:flex-row lg:gap-16">

            {/* Left text */}
            <div className="flex-1 text-center lg:text-left animate-fade-in-up">
              {/* eyebrow badge */}
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all hover:scale-105"
                style={{
                  border: '1px solid rgba(16,185,129,0.4)',
                  color: '#10b981',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Free Meme Generator — AI-Powered
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.12] tracking-tight lg:text-6xl xl:text-7xl">
                Create Professional<br />
                Memes with{' '}
                <span
                  style={{
                    backgroundImage: 'var(--gradient-text)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  MemeLab AI
                </span>
              </h1>

              <p
                className="mt-5 max-w-lg text-base leading-relaxed mx-auto lg:mx-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                The free meme generator trusted by creators worldwide. Choose from 1000+
                templates, add AI-generated captions, and download instantly — no signup,
                no watermarks.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  href="/meme-studio"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  style={{
                    backgroundImage: 'var(--gradient-primary)',
                    color: '#020617',
                    boxShadow: '0 0 24px rgba(16,185,129,0.38)',
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Start Creating Free
                </Link>
                <Link
                  href="/image-studio"
                  className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105"
                >
                  AI Image Studio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                ✦ No credit card &nbsp;·&nbsp; ✦ No watermarks &nbsp;·&nbsp; ✦ 1000+ templates
              </p>
            </div>

            {/* Right — browser mockup */}
            <div className="flex-1 w-full max-w-sm lg:max-w-none animate-scale-in">
              <div
                className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl"
                style={{
                  border: '1px solid var(--border-opacity-15)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                {/* browser bar */}
                <div
                  className="flex items-center gap-1.5 px-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--border-opacity-10)' }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                  <div
                    className="ml-2 flex-1 rounded-full px-3 py-0.5 text-[10px]"
                    style={{ backgroundColor: 'var(--bg-opacity-10)', color: 'var(--text-secondary)' }}
                  >
                    meme-lab.app
                  </div>
                </div>

                {/* meme cards */}
                <div className="space-y-2 p-3">
                  {[
                    { label: 'WHEN THE MEME IS PERFECT', hue: 200 },
                    { label: 'AI-Generated Caption ✨',   hue: 160 },
                  ].map(({ label, hue }) => (
                    <div
                      key={label}
                      className="flex items-center justify-center rounded-xl p-4 text-center"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue},40%,12%), hsl(${hue + 30},30%,8%))`,
                        border: '1px solid var(--border-opacity-10)',
                        minHeight: '90px',
                      }}
                    >
                      <p className="text-xs font-bold tracking-wide" style={{ color: 'var(--text)' }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* trending pill */}
                <div className="absolute right-3 top-12">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: '#ef4444', color: '#fff' }}
                  >
                    🔥 Trending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ TRENDING TEMPLATES ══════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          <div className="mb-2">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              🔥 Hot Right Now
            </span>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold lg:text-4xl">Trending Templates</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                The most popular meme formats everyone&apos;s using this month
              </p>
            </div>
            <Link
              href="/meme-studio"
              className="inline-flex items-center gap-1 text-sm font-semibold shrink-0 hover:underline"
              style={{ color: 'var(--accent-primary)' }}
            >
              Browse All Templates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-md"
                style={{
                  backgroundColor: activeCategory === cat ? 'var(--accent-primary)' : 'transparent',
                  color: activeCategory === cat ? '#020617' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'transparent' : 'var(--border)',
                }}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* template grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map(t => (
              <Link
                key={t.id}
                href="/meme-studio"
                className="group relative overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl no-underline"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
              >
                {/* enhanced gradient image area with visual appeal */}
                <div
                  className="aspect-square w-full flex items-center justify-center overflow-hidden relative"
                  style={{
                    background: `linear-gradient(135deg, hsl(${t.hue},55%,20%), hsl(${t.hue + 25},48%,14%))`,
                  }}
                >
                  {/* subtle animated background pattern */}
                  <div
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{
                      backgroundImage: `radial-gradient(circle at 20% 50%, hsl(${t.hue}, 40%, 40%) 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  />
                  <span 
                    className="text-5xl opacity-40 group-hover:opacity-60 transition-all group-hover:scale-110" 
                    style={{ transform: 'translate(0, 0)' }}
                    aria-hidden="true"
                  >
                    🎭
                  </span>
                </div>
                {/* rank badge */}
                <div className="absolute left-2 top-2">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-md"
                    style={{ backgroundImage: 'var(--gradient-primary)', color: '#020617' }}
                  >
                    #{t.rank}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>{t.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{t.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CREATION TOOLS ══════════════ */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold mb-4"
              style={{
                color: 'var(--accent-primary)',
                backgroundColor: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
              }}
            >
              Creation Tools
            </span>
            <h2 className="text-3xl font-extrabold lg:text-4xl">Powerful Tools for Every Creator</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              From quick memes to AI-generated masterpieces — we&apos;ve got you covered
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {TOOLS.map(tool => (
              <div
                key={tool.title}
                className="flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 24px rgba(2,6,23,0.5)',
                }}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{tool.emoji}</span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-md"
                    style={{ backgroundColor: tool.badgeBg, color: '#fff' }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{tool.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {tool.desc}
                  </p>
                </div>
                <Link
                  href={tool.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {tool.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold mb-4"
            style={{
              color: 'var(--accent-primary)',
              backgroundColor: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            Simple Process
          </span>
          <h2 className="text-3xl font-extrabold lg:text-4xl">How It Works</h2>
          <p className="mt-2 mb-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create professional memes in three simple steps — no design experience required
          </p>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* connector line */}
            <div
              className="absolute hidden md:block top-8 left-[calc(16.66%+32px)] right-[calc(16.66%+32px)] h-px"
              style={{ backgroundColor: 'var(--border-opacity-15)' }}
            />
            {STEPS.map(step => (
              <div key={step.num} className="flex flex-col items-center gap-4">
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-2xl z-10"
                  style={{
                    backgroundColor: `${step.color}18`,
                    border: `1px solid ${step.color}40`,
                    boxShadow: `0 0 20px ${step.color}20`,
                  }}
                  aria-hidden="true"
                >
                  {step.emoji}
                </div>
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: step.color }}>
                    Step {step.num}
                  </p>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURE HIGHLIGHTS ══════════════ */}
      {FEATURES.map((f, i) => (
        <section
          key={f.label}
          className="py-16 lg:py-24"
          style={{ backgroundColor: f.alt ? 'var(--bg-secondary)' : 'var(--bg)' }}
        >
          <div
            className={`mx-auto flex max-w-5xl flex-col items-center gap-12 px-4 sm:px-6 lg:px-8 lg:flex-row ${f.alt ? 'lg:flex-row-reverse' : ''}`}
          >
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: f.accentColor }}>
                {f.label}
              </p>
              <h2 className="text-2xl font-extrabold leading-snug lg:text-3xl">{f.title}</h2>
              <ul className="mt-5 space-y-3">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ backgroundColor: f.accentColor, color: '#020617' }}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 flex justify-center">
              <div
                className="flex h-44 w-full max-w-xs items-center justify-center rounded-2xl text-5xl"
                style={{
                  border: '1px solid var(--border)',
                  background: `radial-gradient(ellipse at center, ${f.accentColor}14 0%, transparent 70%)`,
                  backgroundColor: 'var(--bg-secondary)',
                }}
                aria-hidden="true"
              >
                {f.emoji}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ══════════════ FAQ ══════════════ */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Everything you need to know about MemeLab AI
            </p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: openFaq === idx ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-colors duration-200"
                  style={{ color: 'var(--text)' }}
                  aria-expanded={openFaq === idx}
                >
                  <span>{faq.q}</span>
                  {openFaq === idx
                    ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                    : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                  }
                </button>
                {openFaq === idx && (
                  <div
                    className="animate-fade-in-up px-5 pb-4 text-sm leading-relaxed border-t"
                    style={{ 
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'var(--gradient-surface)' }}
        />
        <div className="mx-auto max-w-2xl px-4 text-center">
          <span className="text-5xl" aria-hidden="true">🎭</span>
          <h2 className="mt-5 text-4xl font-extrabold lg:text-5xl animate-tracking-in">
            Ready to Create Viral{' '}
            <span
              style={{
                backgroundImage: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Memes?
            </span>
          </h2>
          <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
            Join 120,000+ creators already making memes with MemeLab AI.
            Start for free — no signup required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/meme-studio"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-105 hover:shadow-xl"
              style={{
                backgroundImage: 'var(--gradient-primary)',
                color: '#020617',
                boxShadow: '0 0 30px rgba(16,185,129,0.4)',
              }}
            >
              <Sparkles className="h-4 w-4" />
              Start Creating Free
            </Link>
            <Link
              href="/companion"
              className="btn-secondary inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold transition-all duration-200 hover:scale-105"
            >
              Try AI Companion
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile nav */}
      {isMobile && (
        <MobileNav
          mobileMenuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen(o => !o)}
        />
      )}
      
      <Footer />
    </div>
  );
}
