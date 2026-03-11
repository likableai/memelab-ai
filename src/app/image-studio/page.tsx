'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  ImagePlus,
  Loader2,
  Download,
  User,
  Type,
  ImageIcon,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Video,
  Sparkles,
} from 'lucide-react';
import {
  getImageStudioPatterns,
  getImageStudioFormats,
  getImageStudioThemes,
  generateImageStudioImage,
  remixImageStudioBatch,
  resolveImageStudioFileUrl,
  createMemelordMeme,
  createMemelordVideo,
  getMemelordIdeas,
  type MemePattern,
  type MemeIdea,
} from '@/lib/api';

type TabMode = 'avatar' | 'logo' | 'meme';
type MemeSource = 'gemini-reve' | 'memelord';

const PATTERNS_PAGE_SIZE = 24;
const MAX_BATCH_REMIX = 20;

export default function ImageStudioPage() {
  const [activeTab, setActiveTab] = useState<TabMode>('avatar');
  const [prompt, setPrompt] = useState('');
  const [patterns, setPatterns] = useState<MemePattern[]>([]);
  const [patternsTotal, setPatternsTotal] = useState(0);
  const [patternsPage, setPatternsPage] = useState(1);
  const [formats, setFormats] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [themeFilter, setThemeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatternIds, setSelectedPatternIds] = useState<Set<string>>(new Set());
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [remixResults, setRemixResults] = useState<Array<{ patternId: string; url: string }>>([]);
  const [memeSource, setMemeSource] = useState<MemeSource>('gemini-reve');
  const [memelordResults, setMemelordResults] = useState<Array<{ url: string; template_name?: string }>>([]);
  const [videoJobs, setVideoJobs] = useState<Array<{ job_id: string; template_name?: string; caption?: string }>>([]);
  const [videoSectionOpen, setVideoSectionOpen] = useState(false);
  const [ideas, setIdeas] = useState<MemeIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memelordLoading, setMemelordLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [remixLoading, setRemixLoading] = useState(false);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async (page = 1) => {
    setPatternsLoading(true);
    try {
      const res = await getImageStudioPatterns({
        page,
        limit: PATTERNS_PAGE_SIZE,
        format: formatFilter || undefined,
        theme: themeFilter || undefined,
        q: searchQuery.trim() || undefined,
      });
      setPatterns(res.patterns);
      setPatternsTotal(res.total);
      setPatternsPage(res.page);
    } catch {
      setPatterns([]);
      setPatternsTotal(0);
    } finally {
      setPatternsLoading(false);
    }
  }, [formatFilter, themeFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === 'meme') {
      fetchPatterns(1);
    }
  }, [activeTab, formatFilter, themeFilter, fetchPatterns]);

  useEffect(() => {
    if (activeTab === 'meme') {
      getImageStudioFormats().then(setFormats).catch(() => setFormats([]));
      getImageStudioThemes().then(setThemes).catch(() => setThemes([]));
    }
  }, [activeTab]);

  const fetchIdeas = useCallback(async () => {
    setIdeasLoading(true);
    try {
      const res = await getMemelordIdeas({ tag: 'crypto', limit: 20 });
      setIdeas(res.ideas);
    } catch {
      setIdeas([]);
    } finally {
      setIdeasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'meme') {
      fetchIdeas();
    }
  }, [activeTab, fetchIdeas]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Enter a prompt.');
      return;
    }
    if (activeTab === 'meme' && memeSource === 'memelord') {
      setMemelordLoading(true);
      setError(null);
      setMemelordResults([]);
      setGeneratedUrl(null);
      setRemixResults([]);
      try {
        const res = await createMemelordMeme({ prompt: prompt.trim(), count: 3 });
        if (res.results?.length) {
          setMemelordResults(res.results.filter((r) => r.success && r.url).map((r) => ({
            url: r.url,
            template_name: r.template_name,
          })));
        }
        fetchIdeas();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setError(err?.response?.data?.error ?? err?.message ?? 'Memelord meme failed');
      } finally {
        setMemelordLoading(false);
      }
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    setMemelordResults([]);
    setRemixResults([]);
    try {
      const res = await generateImageStudioImage({
        prompt: prompt.trim(),
        aspectRatio: '1:1',
        mode: activeTab,
      });
      setGeneratedUrl(res.url);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [prompt, activeTab, memeSource, fetchIdeas]);

  const captureImageAsBase64 = useCallback(async (url: string): Promise<string | null> => {
    try {
      const fullUrl = resolveImageStudioFileUrl(url);
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          resolve(base64 || null);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }, []);

  const handleSelectForRemix = useCallback(async () => {
    if (!generatedUrl) return;
    const base64 = await captureImageAsBase64(generatedUrl);
    if (base64) setSelectedImageBase64(base64);
  }, [generatedUrl, captureImageAsBase64]);

  const handleRemixBatch = useCallback(async () => {
    if (!selectedImageBase64) {
      setError('Select an image first (click "Use for Meme Remix").');
      return;
    }
    const ids = selectedPatternIds.size > 0
      ? Array.from(selectedPatternIds).slice(0, MAX_BATCH_REMIX)
      : undefined;
    setRemixLoading(true);
    setError(null);
    setRemixResults([]);
    try {
      const { results } = await remixImageStudioBatch(selectedImageBase64, ids);
      setRemixResults(results);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Batch remix failed');
    } finally {
      setRemixLoading(false);
    }
  }, [selectedImageBase64, selectedPatternIds]);

  const handleMemelordVideo = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Enter a prompt for the video meme.');
      return;
    }
    setVideoLoading(true);
    setError(null);
    setVideoJobs([]);
    try {
      const res = await createMemelordVideo({ prompt: prompt.trim(), count: 2 });
      if (res.jobs?.length) {
        setVideoJobs(res.jobs.map((j) => ({
          job_id: j.job_id,
          template_name: j.template_name,
          caption: j.caption,
        })));
        setVideoSectionOpen(true);
        fetchIdeas();
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Video meme failed');
    } finally {
      setVideoLoading(false);
    }
  }, [prompt, fetchIdeas]);

  const togglePattern = (id: string) => {
    setSelectedPatternIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resolvedGeneratedUrl = generatedUrl ? resolveImageStudioFileUrl(generatedUrl) : null;

  const tabs: { id: TabMode; label: string; icon: React.ReactNode }[] = [
    { id: 'avatar', label: 'Avatar', icon: <User style={{ width: 18, height: 18 }} /> },
    { id: 'logo', label: 'Logo', icon: <Type style={{ width: 18, height: 18 }} /> },
    { id: 'meme', label: 'Meme', icon: <ImageIcon style={{ width: 18, height: 18 }} /> },
  ];

  return (
    <AppLayout>
      <div
        className="container-padding mx-auto flex flex-col"
        style={{ maxWidth: 'var(--content-max-width)', paddingBottom: 'var(--space-12)' }}
      >
        <h1 className="page-title mb-2 tracking-tight">
          <span className="text-accent">Image Studio</span>
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-opacity-70)' }}>
          Generate avatars, logos, and memes with Gemini. Replicate into famous meme patterns with ReVe. Or use Memelord for prompt-to-meme and video memes.
        </p>

        {activeTab === 'meme' && (
          <div className="flex gap-2 mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-opacity-70)' }}>Source:</span>
            <button
              type="button"
              onClick={() => { setMemeSource('gemini-reve'); setMemelordResults([]); }}
              className={`px-3 py-1.5 rounded-lg text-sm border ${memeSource === 'gemini-reve' ? 'border-accent' : ''}`}
              style={{
                borderColor: memeSource === 'gemini-reve' ? 'var(--accent)' : 'var(--border-opacity-20)',
                backgroundColor: memeSource === 'gemini-reve' ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg)',
              }}
            >
              Create & Remix (Gemini + ReVe)
            </button>
            <button
              type="button"
              onClick={() => { setMemeSource('memelord'); setGeneratedUrl(null); setSelectedImageBase64(null); setRemixResults([]); }}
              className={`px-3 py-1.5 rounded-lg text-sm border ${memeSource === 'memelord' ? 'border-accent' : ''}`}
              style={{
                borderColor: memeSource === 'memelord' ? 'var(--accent)' : 'var(--border-opacity-20)',
                backgroundColor: memeSource === 'memelord' ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg)',
              }}
            >
              Prompt-to-Meme (Memelord)
            </button>
          </div>
        )}

        <div
          className="flex gap-2 mb-6 border-b"
          style={{ borderColor: 'var(--border-opacity-10)' }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className="nav-link flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 -mb-px transition-colors"
              style={{
                borderColor: activeTab === t.id ? 'var(--accent)' : 'transparent',
                backgroundColor: activeTab === t.id ? 'var(--bg-secondary)' : 'transparent',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div
          className="rounded-lg border p-4 mb-6"
          style={{
            borderColor: 'var(--border-opacity-10)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <label className="block text-sm font-medium mb-2" htmlFor="prompt">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              activeTab === 'avatar'
                ? 'e.g. A friendly crypto mascot, orange fur, sunglasses'
                : activeTab === 'logo'
                  ? 'e.g. MemeLab, playful brand mark, minimal'
                  : 'e.g. Doge celebrating a moon mission'
            }
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
            style={{
              borderColor: 'var(--border-opacity-20)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
            }}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || memelordLoading || !prompt.trim()}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            {(loading || memelordLoading) ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                {activeTab === 'meme' && memeSource === 'memelord' ? 'Generating Meme...' : 'Generating...'}
              </>
            ) : (
              <>
                <ImagePlus style={{ width: 18, height: 18 }} />
                {activeTab === 'meme' && memeSource === 'memelord' ? 'Generate Meme' : 'Generate'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)' }}
          >
            {error}
          </div>
        )}

        {memelordResults.length > 0 && (
          <div
            className="rounded-lg border p-4 mb-6"
            style={{
              borderColor: 'var(--border-opacity-10)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <h3 className="text-sm font-medium mb-3">Memelord Results</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {memelordResults.map((r, i) => (
                <div key={i} className="flex flex-col">
                  <img
                    src={r.url}
                    alt={r.template_name ?? 'Meme'}
                    className="rounded-lg w-full aspect-square object-cover border"
                    style={{ borderColor: 'var(--border-opacity-10)' }}
                  />
                  {r.template_name && (
                    <span className="text-xs mt-1 truncate" style={{ color: 'var(--text-opacity-70)' }}>
                      {r.template_name}
                    </span>
                  )}
                  <a
                    href={r.url}
                    download={`memelord-${i}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-1 text-sm nav-link"
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {resolvedGeneratedUrl && (
          <div
            className="rounded-lg border p-4 mb-6"
            style={{
              borderColor: 'var(--border-opacity-10)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <h3 className="text-sm font-medium mb-3">Generated Image</h3>
            <div className="flex flex-wrap gap-4 items-start">
              <img
                src={resolvedGeneratedUrl}
                alt="Generated"
                className="rounded-lg max-w-xs max-h-64 object-contain border"
                style={{ borderColor: 'var(--border-opacity-10)' }}
              />
              <div className="flex flex-col gap-2">
                <a
                  href={resolvedGeneratedUrl}
                  download="image-studio.png"
                  target="_blank"
                  rel="noreferrer"
                  className="nav-link flex items-center gap-2 px-3 py-2 rounded-lg w-fit"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <Download style={{ width: 16, height: 16 }} />
                  Download
                </a>
                {activeTab === 'meme' && (
                  <button
                    type="button"
                    onClick={handleSelectForRemix}
                    className="nav-link flex items-center gap-2 px-3 py-2 rounded-lg w-fit"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <Check style={{ width: 16, height: 16 }} />
                    Use for Meme Remix
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meme' && (
          <>
            {selectedImageBase64 && (
              <div
                className="rounded-lg border p-4 mb-6"
                style={{
                  borderColor: 'var(--border-opacity-10)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <h3 className="text-sm font-medium mb-3">Meme Patterns (select up to {MAX_BATCH_REMIX} to remix)</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search patterns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchPatterns(1)}
                    className="rounded-lg border px-3 py-1.5 text-sm w-48"
                    style={{ borderColor: 'var(--border-opacity-20)', backgroundColor: 'var(--bg)' }}
                  />
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    style={{ borderColor: 'var(--border-opacity-20)', backgroundColor: 'var(--bg)' }}
                  >
                    <option value="">All formats</option>
                    {formats.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  {themes.length > 0 && (
                    <select
                      value={themeFilter}
                      onChange={(e) => { setThemeFilter(e.target.value); setPatternsPage(1); }}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                      style={{ borderColor: 'var(--border-opacity-20)', backgroundColor: 'var(--bg)' }}
                    >
                      <option value="">All themes</option>
                      {themes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchPatterns(1)}
                    className="nav-link flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                  >
                    <Search style={{ width: 14, height: 14 }} />
                    Search
                  </button>
                </div>
                {patternsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                    Loading patterns...
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {patterns.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePattern(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        selectedPatternIds.has(p.id)
                          ? 'border-accent'
                          : ''
                      }`}
                      style={{
                        borderColor: selectedPatternIds.has(p.id)
                          ? 'var(--accent)'
                          : 'var(--border-opacity-20)',
                        backgroundColor: selectedPatternIds.has(p.id)
                          ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                          : 'var(--bg)',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {patternsTotal > PATTERNS_PAGE_SIZE && (
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => fetchPatterns(patternsPage - 1)}
                      disabled={patternsPage <= 1 || patternsLoading}
                      className="nav-link p-2 rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft style={{ width: 18, height: 18 }} />
                    </button>
                    <span className="text-sm">
                      Page {patternsPage} of {Math.ceil(patternsTotal / PATTERNS_PAGE_SIZE)} ({patternsTotal} total)
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchPatterns(patternsPage + 1)}
                      disabled={patternsPage >= Math.ceil(patternsTotal / PATTERNS_PAGE_SIZE) || patternsLoading}
                      className="nav-link p-2 rounded-lg disabled:opacity-50"
                    >
                      <ChevronRight style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRemixBatch}
                  disabled={remixLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
                >
                  {remixLoading ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                      Remixing...
                    </>
                  ) : (
                    <>
                      <ImageIcon style={{ width: 18, height: 18 }} />
                      {selectedPatternIds.size > 0
                        ? `Replicate ${Math.min(selectedPatternIds.size, MAX_BATCH_REMIX)} Patterns`
                        : 'Replicate to Meme Patterns (first 20)'}
                    </>
                  )}
                </button>
                  </>
                )}
              </div>
            )}

            <div
              className="rounded-lg border mb-6"
              style={{
                borderColor: 'var(--border-opacity-10)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <button
                type="button"
                onClick={() => setVideoSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <Video style={{ width: 18, height: 18 }} />
                  Video Memes (Memelord)
                </span>
                {videoSectionOpen ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
              </button>
              {videoSectionOpen && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border-opacity-10)' }}>
                  <p className="text-sm mt-3 mb-3" style={{ color: 'var(--text-opacity-70)' }}>
                    Generate video memes from your prompt. Results are rendered asynchronously.
                  </p>
                  <button
                    type="button"
                    onClick={handleMemelordVideo}
                    disabled={videoLoading || !prompt.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
                  >
                    {videoLoading ? (
                      <>
                        <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video style={{ width: 18, height: 18 }} />
                        Generate Video Meme
                      </>
                    )}
                  </button>
                  {videoJobs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Jobs started</p>
                      <ul className="text-sm space-y-1" style={{ color: 'var(--text-opacity-70)' }}>
                        {videoJobs.map((j) => (
                          <li key={j.job_id}>
                            {j.template_name ?? j.job_id}: {j.caption ?? 'Pending'}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-opacity-50)' }}>
                        Results will appear in Idea Feed when ready. Click Refresh below.
                      </p>
                      <button
                        type="button"
                        onClick={fetchIdeas}
                        className="mt-2 nav-link text-sm px-3 py-1.5 rounded-lg"
                      >
                        Refresh Idea Feed
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="rounded-lg border p-4 mb-6"
              style={{
                borderColor: 'var(--border-opacity-10)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles style={{ width: 18, height: 18 }} />
                Idea Feed (crypto)
              </h3>
              {ideasLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                  Loading ideas...
                </div>
              ) : ideas.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-opacity-70)' }}>
                  No ideas yet. Generate memes with Memelord or add crypto prompts to populate the feed.
                </p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {ideas.map((idea) => (
                    <li key={idea.id} className="text-sm p-2 rounded border" style={{ borderColor: 'var(--border-opacity-20)', backgroundColor: 'var(--bg)' }}>
                      <p className="font-medium">{idea.caption || idea.prompt}</p>
                      {idea.templateName && (
                        <span className="text-xs" style={{ color: 'var(--text-opacity-70)' }}>{idea.templateName}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPrompt(idea.caption || idea.prompt)}
                        className="mt-2 block text-xs nav-link"
                      >
                        Use as prompt
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {ideas.length > 0 && (
                <button
                  type="button"
                  onClick={fetchIdeas}
                  className="mt-3 text-sm nav-link px-3 py-1.5 rounded-lg"
                >
                  Refresh
                </button>
              )}
            </div>

            {remixResults.length > 0 && (
              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: 'var(--border-opacity-10)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <h3 className="text-sm font-medium mb-3">Remixed Memes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {remixResults.map((r) => {
                    const resolved = resolveImageStudioFileUrl(r.url);
                    return (
                      <div key={r.patternId} className="flex flex-col">
                        <img
                          src={resolved}
                          alt={r.patternId}
                          className="rounded-lg w-full aspect-square object-cover border"
                          style={{ borderColor: 'var(--border-opacity-10)' }}
                        />
                        <a
                          href={resolved}
                          download={`${r.patternId}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex items-center gap-1 text-sm"
                        >
                          <Download style={{ width: 14, height: 14 }} />
                          Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
