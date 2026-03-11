'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';

const QUARTERS = [
  {
    id: 'q1',
    title: 'Q1 2025',
    status: 'complete',
    items: ['Launch v1.0', '$LIKA listed, dev assets locked', 'Meme Studio: images, GIFs, videos', 'Meme websites & hosting'],
  },
  {
    id: 'q2',
    title: 'Q2 2025',
    status: 'active',
    items: ['AI meme system & UI refresh', 'Community: profiles, likes, voting', 'Leaderboards & bounty model', 'Invitation & referral system'],
  },
  {
    id: 'q3',
    title: 'Q3 2025',
    status: 'upcoming',
    items: ['Meme games & rewards', 'On-chain meme NFT / tokenization', 'Bots: X, Telegram, TikTok, Instagram', 'Multi-chain (Solana, BNB, Base, ETH)'],
  },
  {
    id: 'q4',
    title: 'Q4 2025',
    status: 'upcoming',
    items: ['$LIKA on major CEX', 'Rebrand, Web2 + Web3', 'Likable AI App (EU, Android, iOS, web)'],
  },
];

const DISTRIBUTION = [
  { pct: '50%', label: 'Burned', sub: 'Until 100M $LIKA' },
  { pct: '25%', label: 'Platform', sub: 'Servers & infrastructure' },
  { pct: '15%', label: 'Community', sub: 'Market & growth' },
  { pct: '10%', label: 'Team', sub: 'Core contributors' },
];

const UPDATES = [
  { date: 'Feb 14', text: 'Roadmap update and recent progress published.' },
  { date: 'Feb 12', text: '$LIKA token officially launched on Solana.' },
  { date: 'Feb 6', text: 'Meme Studio added to platform.' },
  { date: 'Feb 4', text: '$LIKA confirmed as official platform currency.' },
  { date: 'Feb 1', text: 'v1.0 launched.' },
  { date: 'Jan', text: 'Project launched; Pumpfun Hackathon participation.' },
];

const statusColor = {
  complete: 'var(--accent-primary)',
  active: 'var(--text)',
  upcoming: 'var(--text-secondary)',
};

const statusBg = {
  complete: 'rgba(16, 185, 129, 0.1)',
  active: 'var(--bg-tertiary)',
  upcoming: 'var(--bg-secondary)',
};

const statusBorder = {
  complete: 'rgba(16, 185, 129, 0.35)',
  active: 'var(--border-medium)',
  upcoming: 'var(--border)',
};

const statusLabel = {
  complete: 'Shipped',
  active: 'In Progress',
  upcoming: 'Planned',
};

export default function RoadmapPage() {
  return (
    <AppLayout>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'var(--space-16) var(--space-6)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
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
            Product Roadmap
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-4)',
              lineHeight: 1.15,
            }}
          >
            Building the future of memes
          </h1>
          <p
            style={{
              fontSize: 'var(--font-base)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '520px',
            }}
          >
            AI meme lab, voice companion, NFT tokenization, and full multi-chain support — all powered by $LIKA.
          </p>
        </div>

        {/* Quarters grid */}
        <section style={{ marginBottom: 'var(--space-16)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {QUARTERS.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: 'var(--space-6)',
                  border: `1px solid ${statusBorder[q.status as keyof typeof statusBorder]}`,
                  borderRadius: 'var(--radius-lg)',
                  background: statusBg[q.status as keyof typeof statusBg],
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-base)',
                      fontWeight: 700,
                      color: statusColor[q.status as keyof typeof statusColor],
                    }}
                  >
                    {q.title}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                      background: q.status === 'complete' ? 'rgba(16,185,129,0.15)' : 'var(--bg-hover)',
                      color: statusColor[q.status as keyof typeof statusColor],
                      border: `1px solid ${statusBorder[q.status as keyof typeof statusBorder]}`,
                    }}
                  >
                    {statusLabel[q.status as keyof typeof statusLabel]}
                  </span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {q.items.map((item, j) => (
                    <li
                      key={j}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--font-sm)',
                        color: q.status === 'upcoming' ? 'var(--text-secondary)' : 'var(--text)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          marginTop: '6px',
                          flexShrink: 0,
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: statusColor[q.status as keyof typeof statusColor],
                          opacity: q.status === 'upcoming' ? 0.4 : 1,
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Two columns: distribution + updates */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-8)',
          }}
        >
          {/* Revenue distribution */}
          <section>
            <h2
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 700,
                marginBottom: 'var(--space-4)',
                letterSpacing: '-0.01em',
              }}
            >
              $LIKA revenue distribution
            </h2>
            <div
              style={{
                padding: 'var(--space-6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {DISTRIBUTION.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-xl)',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      minWidth: '52px',
                    }}
                  >
                    {row.pct}
                  </span>
                  <div>
                    <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)' }}>{row.label}</p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{row.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent updates */}
          <section>
            <h2
              style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 700,
                marginBottom: 'var(--space-4)',
                letterSpacing: '-0.01em',
              }}
            >
              Recent updates
            </h2>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
              }}
            >
              {UPDATES.map((update, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-5)',
                    borderBottom: i < UPDATES.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      minWidth: '52px',
                      flexShrink: 0,
                    }}
                  >
                    {update.date}
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {update.text}
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
