'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, ImageIcon, Wand2, Bot } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

// ─── Static data (honest copy only) ──────────────────────────────────────────

const TOOLS = [
  {
    title: 'Meme Studio',
    desc: 'Pick from curated meme templates and customise with text, filters, and effects. Export as PNG or GIF instantly.',
    cta: 'Open Studio',
    href: '/meme-studio',
    Icon: ImageIcon,
  },
  {
    title: 'AI Image Studio',
    desc: 'Describe any image and let AI generate it. Remix existing photos into iconic meme formats with one click.',
    cta: 'Try Generator',
    href: '/image-studio',
    Icon: Wand2,
  },
  {
    title: 'AI Companion',
    desc: 'Voice-powered creative assistant. Brainstorm captions, get meme ideas, and explore trends in real time.',
    cta: 'Start Chat',
    href: '/companion',
    Icon: Bot,
  },
];

const FEATURES = [
  {
    title: 'AI-powered creation',
    desc: 'Generate images, captions, and remixes using Gemini and Memelord AI models.',
  },
  {
    title: 'No watermarks',
    desc: 'Download full-quality PNG and GIF exports. No watermarks, no hidden fees.',
  },
  {
    title: 'Token-gated AI',
    desc: 'Connect your wallet with $LIKA tokens to unlock premium AI generation features.',
  },
];

const STEPS = [
  { num: '01', title: 'Pick a template', desc: 'Choose from our curated meme formats or start with a blank canvas.' },
  { num: '02', title: 'Add your text', desc: 'Customise with text, filters, and effects. Preview updates in real time.' },
  { num: '03', title: 'Export instantly', desc: 'Download as PNG or GIF — no account needed for templates.' },
];

const FAQS = [
  {
    q: 'Is MemeLab AI free to use?',
    a: 'Template-based meme creation is free with no account required. AI generation features (image generation, AI companion) require a wallet connection and $LIKA tokens.',
  },
  {
    q: 'Do I need to sign up?',
    a: 'No account is needed to use templates and the meme editor. A wallet connection is required to access AI-powered features.',
  },
  {
    q: 'What is $LIKA?',
    a: '$LIKA is the native utility token on Solana that powers premium features on MemeLab AI. Connect your wallet via the Dashboard to top up and track usage.',
  },
  {
    q: 'What formats can I export?',
    a: 'Export as PNG, JPG, or animated GIF depending on the tool you use. All exports are watermark-free.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <AppLayout>
      {/* ── Hero ── */}
      <section
        style={{
          padding: 'var(--space-20) var(--space-6)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              marginBottom: 'var(--space-6)',
              padding: 'var(--space-2) var(--space-4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--accent-primary)',
            }}
          >
            AI meme creation on Solana
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 8vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 'var(--space-6)',
              letterSpacing: '-0.02em',
            }}
          >
            Make memes with AI.
            <br />
            <span style={{ color: 'var(--accent-primary)' }}>Actually good ones.</span>
          </h1>

          <p
            style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '560px',
              margin: '0 auto var(--space-10)',
            }}
          >
            AI image generation, curated templates, and a voice companion — all powered by $LIKA.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/meme-studio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'white',
                color: '#020617',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(16,185,129,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              Start creating
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
            <Link
              href="/image-studio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              Try AI generation
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section style={{ padding: 'var(--space-10) var(--space-6)', borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: 'var(--space-6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--border-medium)';
                el.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--border)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tools section ── */}
      <section style={{ padding: 'var(--space-16) var(--space-6)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <p
              style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              What you can build
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-2)',
              }}
            >
              Three ways to create
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.6, maxWidth: '480px' }}>
              Each tool is built for a different workflow. Pick the one that fits how you think.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {TOOLS.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                style={{
                  padding: 'var(--space-6)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-secondary)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--border-medium)';
                  el.style.background = 'var(--bg-tertiary)';
                  el.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--border)';
                  el.style.background = 'var(--bg-secondary)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <tool.Icon style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    {tool.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.6 }}>
                    {tool.desc}
                  </p>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {tool.cta}
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{
          padding: 'var(--space-16) var(--space-6)',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
              How it works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
              Three steps from idea to shareable meme
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {STEPS.map((step) => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    fontSize: 'var(--font-xl)',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'var(--space-16) var(--space-6)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
              Questions answered
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
              The most common things people ask before getting started
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid',
                  borderColor: openFaq === idx ? 'var(--border-medium)' : 'var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: openFaq === idx ? 'var(--bg-secondary)' : 'transparent',
                  overflow: 'hidden',
                  transition: 'all 200ms ease',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-4) var(--space-5)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    color: 'var(--text)',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp style={{ width: '16px', height: '16px', color: 'var(--accent-primary)', flexShrink: 0 }} />
                  ) : (
                    <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--text-secondary)', flexShrink: 0 }} />
                  )}
                </button>
                {openFaq === idx && (
                  <p
                    style={{
                      padding: '0 var(--space-5) var(--space-4)',
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--font-sm)',
                      lineHeight: 1.7,
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          padding: 'var(--space-16) var(--space-6)',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Ready to create?
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-8)',
              fontSize: 'var(--font-sm)',
              lineHeight: 1.7,
            }}
          >
            Template editing is free and instant. Connect your wallet to unlock AI generation powered by $LIKA.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/meme-studio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'white',
                color: '#020617',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              Open Meme Studio
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              Connect wallet
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
