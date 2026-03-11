'use client';

const FOOTER_LINKS = {
  'AI Tools': [
    { label: 'Meme Studio', href: '/meme-studio' },
    { label: 'Image Studio', href: '/image-studio' },
    { label: 'AI Companion', href: '/companion' },
  ],
  Platform: [
    { label: 'Token Explorer', href: '/explorer' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Roadmap', href: '/roadmap' },
  ],
};

export const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-6)',
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-10)',
            marginBottom: 'var(--space-10)',
          }}
        >
          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
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
                }}
              >
                ML
              </div>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text)' }}>
                MemeLab AI
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '280px',
              }}
            >
              AI meme creation powered by $LIKA on Solana. Template editing is free — connect your wallet to unlock AI features.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {section}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 150ms ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: 'var(--space-6)' }} />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            &copy; {new Date().getFullYear()} MemeLab AI. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {['Privacy Policy', 'Terms of Service'].map((label) => (
              <a
                key={label}
                href="#"
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

