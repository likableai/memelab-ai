'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const QUARTERS = [
  {
    id: 'q1',
    title: 'Q1 2025',
    status: 'complete' as const,
    items: [
      'Launch v1.0 on BNB Chain',
      '$CLAW token listed, dev assets locked',
      'Meme Studio: images, GIFs, videos',
      'Meme websites & hosting',
    ],
  },
  {
    id: 'q2',
    title: 'Q2 2025',
    status: 'active' as const,
    items: [
      'AI meme system & UI overhaul',
      'Community profiles, likes, voting',
      'Leaderboards & bounty model',
      'Invitation & referral system',
    ],
  },
  {
    id: 'q3',
    title: 'Q3 2025',
    status: 'upcoming' as const,
    items: [
      'Meme games & on-chain rewards',
      'On-chain meme NFT / tokenization',
      'Bots: X, Telegram, TikTok, Instagram',
      'Multi-chain (BNB, Base, ETH)',
    ],
  },
  {
    id: 'q4',
    title: 'Q4 2025',
    status: 'upcoming' as const,
    items: [
      '$CLAW on major CEX',
      'Rebrand across Web2 + Web3',
      'MemeClaw App (EU, Android, iOS, web)',
    ],
  },
];

const DISTRIBUTION = [
  { pct: '50%', label: 'Burned', sub: 'Until supply cap reached' },
  { pct: '25%', label: 'Platform', sub: 'Servers & infrastructure' },
  { pct: '15%', label: 'Community', sub: 'Marketing & growth' },
  { pct: '10%', label: 'Team', sub: 'Core contributors' },
];

const UPDATES = [
  { date: 'Mar 2025', text: 'Image Studio and AI generation launched.' },
  { date: 'Feb 2025', text: 'Full platform redesign to MemeClaw AI.' },
  { date: 'Feb 2025', text: '$CLAW ticker confirmed, BNB Chain deployment.' },
  { date: 'Feb 2025', text: 'Meme Studio added to platform.' },
  { date: 'Jan 2025', text: 'v1.0 launched on BNB Chain.' },
  { date: 'Jan 2025', text: 'Project inception; community round begins.' },
];

const STATUS_META = {
  complete: {
    icon: CheckCircle2,
    label: 'Shipped',
    color: 'var(--accent-primary)',
    bg: 'rgba(0,229,160,0.08)',
    border: 'rgba(0,229,160,0.25)',
    dotBg: 'var(--accent-primary)',
  },
  active: {
    icon: Clock,
    label: 'In Progress',
    color: 'var(--text)',
    bg: 'var(--bg-secondary)',
    border: 'var(--border-medium)',
    dotBg: 'var(--text)',
  },
  upcoming: {
    icon: Circle,
    label: 'Planned',
    color: 'var(--text-secondary)',
    bg: 'var(--bg-secondary)',
    border: 'var(--border)',
    dotBg: 'var(--text-secondary)',
  },
};

export default function RoadmapPage() {
  return (
    <AppLayout>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Product Roadmap
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '0.875rem',
            }}
          >
            Building the future of memes
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '480px',
            }}
          >
            AI meme lab, voice companion, NFT tokenization, and full multi-chain support — all powered by{' '}
            <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>$CLAW</span> on BNB Chain.
          </p>
        </div>

        {/* Quarter grid */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '0.875rem',
            }}
          >
            {QUARTERS.map((q) => {
              const meta = STATUS_META[q.status];
              const Icon = meta.icon;
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '1.375rem 1.25rem',
                    border: `1px solid ${meta.border}`,
                    borderRadius: '16px',
                    background: meta.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  {/* Quarter header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: meta.color, letterSpacing: '-0.01em' }}>
                      {q.title}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        letterSpacing: '0.02em',
                      }}
                    >
                      <Icon style={{ width: 11, height: 11 }} />
                      {meta.label}
                    </span>
                  </div>
                  {/* Items */}
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.items.map((item, j) => (
                      <li
                        key={j}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.625rem',
                          fontSize: '0.875rem',
                          color: q.status === 'upcoming' ? 'var(--text-secondary)' : 'var(--text)',
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            marginTop: '7px',
                            flexShrink: 0,
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: meta.dotBg,
                            opacity: q.status === 'upcoming' ? 0.45 : 1,
                          }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom two-col: distribution + updates */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* $CLAW distribution */}
          <section>
            <h2
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '1rem',
              }}
            >
              <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>$CLAW</span> revenue distribution
            </h2>
            <div
              style={{
                padding: '1.375rem 1.25rem',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.125rem',
              }}
            >
              {DISTRIBUTION.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      minWidth: '58px',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {row.pct}
                  </span>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{row.label}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{row.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent updates */}
          <section>
            <h2
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '1rem',
              }}
            >
              Recent updates
            </h2>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '16px',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
              }}
            >
              {UPDATES.map((u, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.875rem 1.125rem',
                    borderBottom: i < UPDATES.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      minWidth: '64px',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {u.date}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {u.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
