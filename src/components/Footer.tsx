'use client';

export const Footer = () => {
  return (
    <footer className="border-t border-[color:var(--border-opacity-10)] bg-[color:var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-semibold text-primary">MemeLab AI</h3>
            <p className="text-xs text-secondary max-w-sm">
              Create professional memes, GIFs, and video memes with AI-powered tools,
              premium templates, and one-click exports.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Create
            </h4>
            <ul className="space-y-1 text-xs text-secondary">
              <li>AI Meme Generator</li>
              <li>Meme Editor</li>
              <li>Video Memes</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Company
            </h4>
            <ul className="space-y-1 text-xs text-secondary">
              <li>Roadmap</li>
              <li>Resources</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-[color:var(--border-opacity-5)] pt-4 text-[11px] text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} MemeLab AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

