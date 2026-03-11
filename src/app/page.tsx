'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { ArrowRight, Globe } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    // Observe the container and all direct reveal children
    const targets = el.querySelectorAll('.reveal');
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    label: 'Meme Studio',
    tag: 'Video & GIF',
    desc: 'Pick from curated meme formats, layer your text, apply filters — export as video or GIF in seconds.',
    href: '/meme-studio',
    img: '/images/tool-meme.jpg',
    accent: '#00E5A0',
  },
  {
    label: 'Image Studio',
    tag: 'AI Generation',
    desc: 'Describe any image and watch AI render it. Generate logos, avatars, or drop it into an iconic meme template.',
    href: '/image-studio',
    img: '/images/tool-image.jpg',
    accent: '#00E5A0',
  },
  {
    label: 'Website Generator',
    tag: 'Coming Soon',
    desc: 'Tell the AI what kind of meme site you want and receive a fully-built, deployable page in minutes.',
    href: '#',
    img: '/images/tool-web.jpg',
    accent: '#00E5A0',
    soon: true,
  },
];

const CAPABILITIES = [
  { num: '01', title: 'Video Meme Export', body: 'Render your creation as an MP4 or animated GIF — every frame, pixel-perfect.' },
  { num: '02', title: 'AI Image Generation', body: 'Gemini and Memelord models generate images from prompts or remix existing photos into templates.' },
  { num: '03', title: 'Voice Companion', body: 'Brainstorm captions and trend ideas with an AI assistant that knows the meme ecosystem.' },
  { num: '04', title: 'Token-gated AI', body: 'Connect a Solana wallet and hold $CLAW to unlock premium AI generation. Template editing is always free.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const pageRef = useScrollReveal();

  return (
    <AppLayout>
      <div ref={pageRef}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            minHeight: '92vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 'var(--space-20) var(--space-6)',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,229,160,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* Subtle grid */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Eyebrow */}
            <div
              className="reveal animate-fade-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-6)',
                padding: '6px 14px',
                border: '1px solid rgba(0,229,160,0.25)',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                background: 'rgba(0,229,160,0.06)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'inline-block',
                  animation: 'accentPulse 2.5s ease-in-out infinite',
                }}
              />
              AI meme creation · Powered by $CLAW
            </div>

            {/* Headline */}
            <h1
              className="reveal animate-fade-up delay-100"
              style={{
                fontSize: 'clamp(2.6rem, 8vw, 5rem)',
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: 'var(--space-6)',
              }}
            >
              Create memes
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #00E5A0, #7FFFD4)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                that actually hit.
              </span>
            </h1>

            {/* Sub */}
            <p
              className="reveal animate-fade-up delay-200"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '560px',
                margin: '0 auto var(--space-10)',
              }}
            >
              AI video memes, generated images, and voice-powered brainstorming —
              all in one studio. Template editing is free. AI requires $CLAW.
            </p>

            {/* CTAs */}
            <div
              className="reveal animate-fade-up delay-300"
              style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <Link
                href="/meme-studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '13px 28px',
                  background: 'white',
                  color: '#080B12',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 180ms ease, transform 180ms ease',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '0.9';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                Start creating
                <ArrowRight style={{ width: '15px', height: '15px' }} />
              </Link>
              <Link
                href="/image-studio"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '13px 28px',
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'border-color 180ms ease, background 180ms ease',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,160,0.4)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,160,0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                Explore Image Studio
              </Link>
            </div>
          </div>
        </section>

        {/* ── Hero visual / preview strip ───────────────────────────────────── */}
        <section
          style={{
            padding: '0 var(--space-6) var(--space-20)',
            maxWidth: '1100px',
            margin: '0 auto',
          }}
        >
          <div
            className="reveal"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-2xl)',
              overflow: 'hidden',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-secondary)',
              aspectRatio: '16/7',
            }}
          >
            <Image
              src="/images/hero-preview.jpg"
              alt="MemeClaw AI studio preview showing meme creation interface"
              fill
              style={{ objectFit: 'cover', opacity: 0.85 }}
              priority
            />
            {/* Bottom gradient fade */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
              }}
            />
          </div>
        </section>

        {/* ── Tools ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 var(--space-6) var(--space-24)',
          }}
        >
          <div className="reveal" style={{ marginBottom: 'var(--space-12)' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 'var(--space-3)' }}>
              The Studio Suite
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
              }}
            >
              Three tools. One creative OS.
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            {TOOLS.map((tool, i) => (
              <Link
                key={tool.label}
                href={tool.href}
                onClick={tool.soon ? (e) => e.preventDefault() : undefined}
                className={`reveal reveal-delay-${i + 1} hover-lift glow-on-hover`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  background: 'var(--bg-secondary)',
                  cursor: tool.soon ? 'default' : 'pointer',
                  opacity: tool.soon ? 0.7 : 1,
                }}
              >
                {/* Image area */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    background: 'var(--bg-tertiary)',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={tool.img}
                    alt={tool.label}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  {/* Tag pill */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 'var(--space-3)',
                      left: 'var(--space-3)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      background: tool.soon ? 'rgba(255,255,255,0.1)' : 'rgba(0,229,160,0.15)',
                      color: tool.soon ? 'var(--text-secondary)' : 'var(--accent-primary)',
                      border: `1px solid ${tool.soon ? 'rgba(255,255,255,0.12)' : 'rgba(0,229,160,0.25)'}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {tool.tag}
                  </div>
                </div>
                {/* Content */}
                <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      color: 'var(--text)',
                    }}
                  >
                    {tool.label}
                  </h3>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                    {tool.desc}
                  </p>
                  {!tool.soon && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Open Studio
                      <ArrowRight style={{ width: '13px', height: '13px' }} />
                    </span>
                  )}
                  {tool.soon && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <Globe style={{ width: '13px', height: '13px' }} />
                      Coming soon
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Capabilities ─────────────────────────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--border)',
            padding: 'var(--space-24) var(--space-6)',
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="reveal" style={{ marginBottom: 'var(--space-14)' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 'var(--space-3)' }}>
                What it does
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  maxWidth: '540px',
                }}
              >
                Built for every layer of meme culture.
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {CAPABILITIES.map((cap, i) => (
                <div
                  key={cap.num}
                  className={`reveal reveal-delay-${i + 1}`}
                  style={{
                    padding: 'var(--space-6)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--accent-primary)',
                      marginBottom: 'var(--space-4)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {cap.num}
                  </p>
                  <h3
                    style={{
                      fontSize: 'var(--font-base)',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {cap.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {cap.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── $CLAW token strip ────────────────────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--border)',
            padding: 'var(--space-20) var(--space-6)',
          }}
        >
          <div
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--space-6)',
            }}
          >
            <div
              className="reveal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '5px 14px',
                border: '1px solid rgba(0,229,160,0.2)',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-primary)',
                background: 'rgba(0,229,160,0.06)',
              }}
            >
              $CLAW · Solana
            </div>
            <h2
              className="reveal reveal-delay-1"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
              }}
            >
              AI access is token-gated.
              <br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                Templates are always free.
              </span>
            </h2>
            <p
              className="reveal reveal-delay-2"
              style={{
                fontSize: 'var(--font-base)',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                maxWidth: '520px',
              }}
            >
              Hold $CLAW in your Solana wallet to unlock AI image generation, the voice companion,
              and advanced meme remixing. Connect via the Dashboard to top up and track usage.
            </p>
            <Link
              href="/dashboard"
              className="reveal reveal-delay-3"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '12px 24px',
                border: '1px solid rgba(0,229,160,0.3)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                background: 'rgba(0,229,160,0.06)',
                transition: 'background 180ms ease, border-color 180ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,160,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,160,0.5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,160,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,160,0.3)';
              }}
            >
              Open Dashboard
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--border)',
            padding: 'var(--space-24) var(--space-6) var(--space-20)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Bottom glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '300px',
              background: 'radial-gradient(ellipse at center bottom, rgba(0,229,160,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ maxWidth: '660px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2
              className="reveal"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                marginBottom: 'var(--space-6)',
              }}
            >
              Ready to make
              <br />
              something viral?
            </h2>
            <p
              className="reveal reveal-delay-1"
              style={{
                fontSize: 'var(--font-base)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-8)',
                lineHeight: 1.6,
              }}
            >
              No account needed to start. Open the studio and create your first meme now.
            </p>
            <Link
              href="/meme-studio"
              className="reveal reveal-delay-2"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '15px 36px',
                background: 'white',
                color: '#080B12',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-base)',
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                transition: 'opacity 180ms ease, transform 180ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '0.88';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              Open Meme Studio
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
