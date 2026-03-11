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
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-6)',
          paddingBottom: 'var(--space-16)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
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
            AI Generation
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-2)',
              lineHeight: 1.15,
            }}
          >
            Image Studio
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Generate avatars, logos, and memes with Gemini. Replicate into meme patterns with ReVe. Or use Memelord for prompt-to-meme and video memes.
          </p>
        </div>

        {/* Mode switcher for meme tab */}
        {activeTab === 'meme' && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source:</span>
            {(['gemini-reve', 'memelord'] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  if (src === 'gemini-reve') { setMemeSource('gemini-reve'); setMemelordResults([]); }
                  else { setMemeSource('memelord'); setGeneratedUrl(null); setSelectedImageBase64(null); setRemixResults([]); }
                }}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  border: `1px solid ${memeSource === src ? 'var(--accent-primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: memeSource === src ? 'rgba(16,185,129,0.12)' : 'transparent',
                  color: memeSource === src ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {src === 'gemini-reve' ? 'Gemini + ReVe' : 'Memelord'}
              </button>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: '0',
                borderBottom: `2px solid ${activeTab === t.id ? 'var(--accent-primary)' : 'transparent'}`,
                marginBottom: '-1px',
                background: 'transparent',
                color: activeTab === t.id ? 'var(--text)' : 'var(--text-secondary)',
                fontSize: 'var(--font-sm)',
                fontWeight: activeTab === t.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <label
            htmlFor="prompt"
            style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}
          >
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
            style={{
              width: '100%',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: 'var(--space-3)',
              fontSize: 'var(--font-sm)',
              background: 'var(--bg)',
              color: 'var(--text)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.6,
            }}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || memelordLoading || !prompt.trim()}
            style={{
              marginTop: 'var(--space-4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-5)',
              background: 'white',
              color: '#020617',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              opacity: (loading || memelordLoading || !prompt.trim()) ? 0.5 : 1,
              transition: 'opacity 150ms ease',
            }}
          >
            {(loading || memelordLoading) ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                {activeTab === 'meme' && memeSource === 'memelord' ? 'Generating Meme...' : 'Generating...'}
              </>
            ) : (
              <>
                <ImagePlus style={{ width: 16, height: 16 }} />
                {activeTab === 'meme' && memeSource === 'memelord' ? 'Generate Meme' : 'Generate'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: 'var(--font-sm)',
            }}
          >
            {error}
          </div>
        )}

        {memelordResults.length > 0 && (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-5)',
            }}
          >
            <p style={{ fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Memelord Results
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
              {memelordResults.map((r, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <img
                    src={r.url}
                    alt={r.template_name ?? 'Meme'}
                    style={{ borderRadius: 'var(--radius-md)', width: '100%', aspectRatio: '1', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                  {r.template_name && (
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.template_name}
                    </span>
                  )}
                  <a
                    href={r.url}
                    download={`memelord-${i}.png`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-xs)', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    <Download style={{ width: 12, height: 12 }} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {resolvedGeneratedUrl && (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-5)',
            }}
          >
            <p style={{ fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Generated Image
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <img
                src={resolvedGeneratedUrl}
                alt="Generated"
                style={{ borderRadius: 'var(--radius-md)', maxWidth: '280px', maxHeight: '280px', objectFit: 'contain', border: '1px solid var(--border)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <a
                  href={resolvedGeneratedUrl}
                  download="image-studio.png"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-4)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 500,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Download style={{ width: 16, height: 16 }} />
                  Download
                </a>
                {activeTab === 'meme' && (
                  <button
                    type="button"
                    onClick={handleSelectForRemix}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-4)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16,185,129,0.08)',
                      color: 'var(--accent-primary)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
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
