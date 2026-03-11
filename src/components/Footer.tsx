'use client';

export const Footer = () => {
  return (
    <footer 
      className="border-t"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <h3 
              className="text-sm font-semibold"
              style={{ color: 'var(--text)' }}
            >
              MemeLab AI
            </h3>
            <p 
              className="text-xs max-w-sm"
              style={{ color: 'var(--text-opacity-70)' }}
            >
              Create professional memes, GIFs, and video memes with AI-powered tools,
              premium templates, and one-click exports.
            </p>
          </div>
          <div className="space-y-2">
            <h4 
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-opacity-70)' }}
            >
              Create
            </h4>
            <ul 
              className="space-y-1 text-xs"
              style={{ color: 'var(--text-opacity-60)' }}
            >
              <li>AI Meme Generator</li>
              <li>Meme Editor</li>
              <li>Video Memes</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-opacity-70)' }}
            >
              Company
            </h4>
            <ul 
              className="space-y-1 text-xs"
              style={{ color: 'var(--text-opacity-60)' }}
            >
              <li>Roadmap</li>
              <li>Resources</li>
            </ul>
          </div>
        </div>
        <div 
          className="mt-6 flex flex-col gap-2 border-t pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between"
          style={{ 
            borderColor: 'var(--border)',
            color: 'var(--text-opacity-60)'
          }}
        >
          <span>© {new Date().getFullYear()} MemeLab AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

