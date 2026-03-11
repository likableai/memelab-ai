'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Sparkles,
  Loader2,
  Download,
  User,
  Type,
  ImageIcon,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Video,
  RefreshCw,
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

const TABS: { id: TabMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'avatar', label: 'Avatar', icon: <User style={{ width: 15, height: 15 }} />, desc: 'Character & profile images' },
  { id: 'logo', label: 'Logo', icon: <Type style={{ width: 15, height: 15 }} />, desc: 'Brand marks & wordmarks' },
  { id: 'meme', label: 'Meme', icon: <ImageIcon style={{ width: 15, height: 15 }} />, desc: 'AI-generated meme images' },
];

export default function ImageStudioPage() {
  const [activeTab, setActiveTab] = useState<TabMode>('avatar');
  const [prompt, setPrompt] = useState('');
  const [patterns, setPatterns] = useState<MemePattern[]>([]);
  const [patternsTotal, setPatternsTotal] = useState(0);
  const [patternsPage, setPatternsPage] = useState(1);
  const [formats, setFormats] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatternIds, setSelectedPatternIds] = useState<Set<string>>(new Set());
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [remixResults, setRemixResults] = useState<Array<{ patternId: string; url: string }>>([]);
  const [memeSource, setMemeSource] = useState<MemeSource>('gemini-reve');
  const [memelordResults, setMemelordResults] = useState<Array<{ url: string; template_name?: string }>>([]);
  const [videoJobs, setVideoJobs] = useState<Array<{ job_id: string; template_name?: string; caption?: string }>>([]);
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
    if (activeTab === 'meme') fetchPatterns(1);
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
    if (activeTab === 'meme') fetchIdeas();
  }, [activeTab, fetchIdeas]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { setError('Enter a prompt.'); return; }
    if (activeTab === 'meme' && memeSource === 'memelord') {
      setMemelordLoading(true);
      setError(null);
      setMemelordResults([]);
      setGeneratedUrl(null);
      setRemixResults([]);
      try {
        const res = await createMemelordMeme({ prompt: prompt.trim(), count: 3 });
        if (res.results?.length) {
          setMemelordResults(
            res.results.filter((r) => r.success && r.url).map((r) => ({ url: r.url, template_name: r.template_name }))
          );
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
      const res = await generateImageStudioImage({ prompt: prompt.trim(), aspectRatio: '1:1', mode: activeTab });
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
          resolve(dataUrl.split(',')[1] || null);
        };
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  }, []);

  const handleSelectForRemix = useCallback(async () => {
    if (!generatedUrl) return;
    const base64 = await captureImageAsBase64(generatedUrl);
    if (base64) setSelectedImageBase64(base64);
  }, [generatedUrl, captureImageAsBase64]);

  const handleRemixBatch = useCallback(async () => {
    if (!selectedImageBase64) { setError('Select an image first (click "Use for Remix").'); return; }
    const ids = selectedPatternIds.size > 0 ? Array.from(selectedPatternIds).slice(0, MAX_BATCH_REMIX) : undefined;
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
    if (!prompt.trim()) { setError('Enter a prompt for the video meme.'); return; }
    setVideoLoading(true);
    setError(null);
    setVideoJobs([]);
    try {
      const res = await createMemelordVideo({ prompt: prompt.trim(), count: 2 });
      if (res.jobs?.length) {
        setVideoJobs(res.jobs.map((j) => ({ job_id: j.job_id, template_name: j.template_name, caption: j.caption })));
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resolvedGeneratedUrl = generatedUrl ? resolveImageStudioFileUrl(generatedUrl) : null;
  const isGenerating = loading || memelordLoading;
  const hasOutput = resolvedGeneratedUrl || memelordResults.length > 0 || remixResults.length > 0;

  return (
    <AppLayout>
      {/* ── Two-panel layout ── */}
      <div
        style={{
          display: 'flex',
          height: 'calc(100dvh - 64px)', // 64px = navbar height
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT PANEL: controls ── */}
        <aside
          style={{
            width: '340px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
          className="hidden md:flex"
        >
          {/* Panel header */}
          <div
            style={{
              padding: '1.25rem 1.25rem 1rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '0.375rem', fontFamily: 'var(--font-mono)' }}>
              AI Generation
            </p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Image Studio
            </h1>
          </div>

          {/* Mode tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              padding: '0.875rem 1.125rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setActiveTab(t.id); setError(null); setGeneratedUrl(null); setMemelordResults([]); setRemixResults([]); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 0.25rem',
                  borderRadius: '10px',
                  border: `1px solid ${activeTab === t.id ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                  background: activeTab === t.id ? 'rgba(0,229,160,0.07)' : 'transparent',
                  color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {t.icon}
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Meme source selector */}
          {activeTab === 'meme' && (
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Engine
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['gemini-reve', 'memelord'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      if (src === 'gemini-reve') { setMemeSource('gemini-reve'); setMemelordResults([]); }
                      else { setMemeSource('memelord'); setGeneratedUrl(null); setSelectedImageBase64(null); setRemixResults([]); }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0',
                      border: `1px solid ${memeSource === src ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: memeSource === src ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: memeSource === src ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {src === 'gemini-reve' ? 'Gemini' : 'Memelord'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt area */}
          <div style={{ padding: '0.875rem 1.125rem', flexShrink: 0 }}>
            <label
              htmlFor="img-prompt"
              style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
            >
              Prompt
            </label>
            <textarea
              id="img-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'avatar' ? 'A friendly crypto mascot, orange fur, sunglasses...'
                : activeTab === 'logo' ? 'MemeClaw, minimal brand mark, dark theme...'
                : 'Pepe celebrating on the moon...'
              }
              rows={4}
              style={{
                width: '100%',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                padding: '0.75rem',
                fontSize: '0.875rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6,
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              style={{
                marginTop: '0.75rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.6875rem 1rem',
                background: isGenerating || !prompt.trim() ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                color: isGenerating || !prompt.trim() ? 'var(--text-secondary)' : '#020617',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'all 150ms ease',
              }}
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Generating...</>
              ) : (
                <><Sparkles style={{ width: 15, height: 15 }} /> Generate</>
              )}
            </button>

            {/* Video meme button for memelord */}
            {activeTab === 'meme' && memeSource === 'memelord' && (
              <button
                type="button"
                onClick={handleMemelordVideo}
                disabled={videoLoading || !prompt.trim()}
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5625rem 1rem',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: videoLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 150ms ease',
                  opacity: videoLoading || !prompt.trim() ? 0.5 : 1,
                }}
              >
                {videoLoading ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Video style={{ width: 14, height: 14 }} />}
                Generate Video Meme
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: '0 1.125rem 0.875rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}

          {/* Idea feed (meme tab) */}
          {activeTab === 'meme' && (
            <div style={{ padding: '0 1.125rem 1.25rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Idea Feed
                </p>
                <button type="button" onClick={fetchIdeas} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '2px' }}>
                  <RefreshCw style={{ width: 12, height: 12 }} className={ideasLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              {ideasLoading ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Loading...</p>
              ) : ideas.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Generate memes with Memelord to populate the feed.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {ideas.map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => setPrompt(idea.caption || idea.prompt)}
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.625rem',
                        borderRadius: '7px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'border-color 150ms ease',
                        fontSize: '0.8125rem',
                        color: 'var(--text)',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                    >
                      {idea.caption || idea.prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── RIGHT PANEL: output canvas ── */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: 'var(--bg)',
          }}
        >
          {/* Mobile controls (collapsed accordion on small screens) */}
          <div
            className="md:hidden"
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Tab row */}
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setActiveTab(t.id); setError(null); setGeneratedUrl(null); setMemelordResults([]); setRemixResults([]); }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${activeTab === t.id ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                    background: activeTab === t.id ? 'rgba(0,229,160,0.07)' : 'transparent',
                    color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            {/* Prompt */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              rows={2}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.625rem', fontSize: '0.875rem', background: 'var(--bg-secondary)', color: 'var(--text)', resize: 'none', outline: 'none' }}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', background: 'var(--accent-primary)', color: '#020617', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: isGenerating || !prompt.trim() ? 0.5 : 1 }}
            >
              {isGenerating ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Sparkles style={{ width: 14, height: 14 }} />}
              Generate
            </button>
            {error && <p style={{ fontSize: '0.8125rem', color: '#fca5a5' }}>{error}</p>}
          </div>

          {/* ── Output area ── */}
          {!hasOutput && !isGenerating && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 2rem',
                gap: '1rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '18px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles style={{ width: 24, height: 24, color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {TABS.find((t) => t.id === activeTab)?.label} Studio
                </p>
                <p style={{ fontSize: '0.8125rem', opacity: 0.6 }}>
                  {TABS.find((t) => t.id === activeTab)?.desc}. Enter a prompt and click Generate.
                </p>
              </div>
            </div>
          )}

          {isGenerating && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 style={{ width: 32, height: 32, color: 'var(--accent-primary)' }} className="animate-spin" />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generating your {activeTab}...</p>
              </div>
            </div>
          )}

          {/* Single generated image */}
          {resolvedGeneratedUrl && !isGenerating && (
            <section style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Generated {activeTab}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {activeTab === 'meme' && (
                    <button
                      type="button"
                      onClick={handleSelectForRemix}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        border: '1px solid rgba(0,229,160,0.3)',
                        borderRadius: '7px',
                        background: selectedImageBase64 ? 'rgba(0,229,160,0.12)' : 'transparent',
                        color: 'var(--accent-primary)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Check style={{ width: 13, height: 13 }} />
                      {selectedImageBase64 ? 'Selected for Remix' : 'Use for Remix'}
                    </button>
                  )}
                  <a
                    href={resolvedGeneratedUrl}
                    download="image-studio.png"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '7px',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <Download style={{ width: 13, height: 13 }} />
                    Download
                  </a>
                </div>
              </div>
              <img
                src={resolvedGeneratedUrl}
                alt="Generated"
                style={{ maxWidth: '480px', width: '100%', borderRadius: '14px', border: '1px solid var(--border)', display: 'block' }}
              />
            </section>
          )}

          {/* Memelord results grid */}
          {memelordResults.length > 0 && !isGenerating && (
            <section style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
                Memelord Results
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
                {memelordResults.map((r, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <img
                      src={r.url}
                      alt={r.template_name ?? 'Meme'}
                      style={{ borderRadius: '10px', width: '100%', aspectRatio: '1', objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    {r.template_name && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.template_name}
                      </span>
                    )}
                    <a
                      href={r.url}
                      download={`memelord-${i}.png`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <Download style={{ width: 11, height: 11 }} />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Meme patterns for remix */}
          {activeTab === 'meme' && selectedImageBase64 && (
            <section style={{ padding: '0 1.5rem 1.5rem' }}>
              <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '14px', background: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                  Meme Patterns — select up to {MAX_BATCH_REMIX} to remix
                </p>
                {/* Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--bg)' }}>
                    <Search style={{ width: 12, height: 12, color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchPatterns(1)}
                      style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.8125rem', color: 'var(--text)', width: '120px' }}
                    />
                  </div>
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    style={{ padding: '0.375rem 0.625rem', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.8125rem', outline: 'none' }}
                  >
                    <option value="">All formats</option>
                    {formats.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {themes.length > 0 && (
                    <select
                      value={themeFilter}
                      onChange={(e) => { setThemeFilter(e.target.value); setPatternsPage(1); }}
                      style={{ padding: '0.375rem 0.625rem', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.8125rem', outline: 'none' }}
                    >
                      <option value="">All themes</option>
                      {themes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                {/* Pattern pills */}
                {patternsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> Loading patterns...
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                      {patterns.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePattern(p.id)}
                          style={{
                            padding: '0.3rem 0.625rem',
                            borderRadius: '6px',
                            border: `1px solid ${selectedPatternIds.has(p.id) ? 'rgba(0,229,160,0.35)' : 'var(--border)'}`,
                            background: selectedPatternIds.has(p.id) ? 'rgba(0,229,160,0.1)' : 'var(--bg)',
                            color: selectedPatternIds.has(p.id) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontSize: '0.8125rem',
                            fontWeight: selectedPatternIds.has(p.id) ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                    {/* Pagination */}
                    {patternsTotal > PATTERNS_PAGE_SIZE && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                        <button type="button" onClick={() => fetchPatterns(patternsPage - 1)} disabled={patternsPage <= 1} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.375rem', cursor: 'pointer', opacity: patternsPage <= 1 ? 0.4 : 1 }}>
                          <ChevronLeft style={{ width: 14, height: 14, color: 'var(--text)' }} />
                        </button>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {patternsPage} / {Math.ceil(patternsTotal / PATTERNS_PAGE_SIZE)}
                        </span>
                        <button type="button" onClick={() => fetchPatterns(patternsPage + 1)} disabled={patternsPage >= Math.ceil(patternsTotal / PATTERNS_PAGE_SIZE)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.375rem', cursor: 'pointer', opacity: patternsPage >= Math.ceil(patternsTotal / PATTERNS_PAGE_SIZE) ? 0.4 : 1 }}>
                          <ChevronRight style={{ width: 14, height: 14, color: 'var(--text)' }} />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemixBatch}
                      disabled={remixLoading}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--accent-primary)',
                        color: '#020617',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: remixLoading ? 'not-allowed' : 'pointer',
                        opacity: remixLoading ? 0.6 : 1,
                      }}
                    >
                      {remixLoading ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <ImageIcon style={{ width: 14, height: 14 }} />}
                      {selectedPatternIds.size > 0
                        ? `Remix ${Math.min(selectedPatternIds.size, MAX_BATCH_REMIX)} patterns`
                        : 'Remix (first 20 patterns)'}
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Remix results */}
          {remixResults.length > 0 && (
            <section style={{ padding: '0 1.5rem 1.5rem' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                Remixed Memes
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {remixResults.map((r) => {
                  const resolved = resolveImageStudioFileUrl(r.url);
                  return (
                    <div key={r.patternId} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <img src={resolved} alt={r.patternId} style={{ borderRadius: '9px', width: '100%', aspectRatio: '1', objectFit: 'cover', border: '1px solid var(--border)' }} />
                      <a href={resolved} download={`${r.patternId}.png`} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        <Download style={{ width: 11, height: 11 }} /> Download
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Video jobs status */}
          {videoJobs.length > 0 && (
            <section style={{ padding: '0 1.5rem 1.5rem' }}>
              <div style={{ padding: '1rem 1.125rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.625rem', fontFamily: 'var(--font-mono)' }}>
                  Video Jobs Running
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {videoJobs.map((j) => (
                    <li key={j.job_id} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                      {j.template_name ?? j.job_id}{j.caption ? ` — ${j.caption}` : ''}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={fetchIdeas} style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  <RefreshCw style={{ width: 12, height: 12 }} /> Refresh Idea Feed
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
