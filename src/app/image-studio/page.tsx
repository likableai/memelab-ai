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
  History,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  getImageStudioPatterns,
  getImageStudioFormats,
  getImageStudioThemes,
  generateImageStudioImage,
  createNanoBananaSession,
  sendNanoBananaSessionMessage,
  remixImageStudioBatch,
  resolveImageStudioFileUrl,
  createMemelordMeme,
  createMemelordVideo,
  getMemelordIdeas,
  type MemePattern,
  type MemeIdea,
  type ImageStudioProvider,
} from '@/lib/api';
import { useEvmWallet } from '@/components/WalletProvider';
import { useStudioHistory } from '@/hooks/useStudioHistory';

type TabMode = 'avatar' | 'logo' | 'meme';
type MemeSource = 'nano_banana_2' | 'reve_ai' | 'memelord';
type NanoBananaModel = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview';
type NanoBananaResolution = '1K' | '2K' | '4K';

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
  const [imageProvider, setImageProvider] = useState<ImageStudioProvider>('nano_banana_2');
  const [memeSource, setMemeSource] = useState<MemeSource>('nano_banana_2');
  const [nanoBananaModel, setNanoBananaModel] = useState<NanoBananaModel>('gemini-3.1-flash-image-preview');
  const [nanoBananaResolution, setNanoBananaResolution] = useState<NanoBananaResolution>('2K');
  const [nanoBananaSessionId, setNanoBananaSessionId] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<
    Array<{ id: string; base64: string; mimeType: string; previewUrl: string }>
  >([]);
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

  const { address } = useEvmWallet();
  const { history, selectedItem, addItem, selectItem, clearHistory } = useStudioHistory({
    studio: 'image',
    walletAddress: address ?? null,
  });

  useEffect(() => {
    if (selectedItem) setGeneratedUrl(selectedItem.url);
    else setGeneratedUrl(null);
  }, [selectedItem]);

  const clearReferenceImages = useCallback(() => {
    for (const r of referenceImages) {
      if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
    }
    setReferenceImages([]);
  }, [referenceImages]);

  const removeReferenceImage = useCallback((id: string) => {
    setReferenceImages((prev) => {
      const next = prev.filter((r) => r.id !== id);
      const removed = prev.find((r) => r.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }, []);

  const downloadFromUrl = useCallback(async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: still allow the user to get the file even if blob download fails (CORS, etc.)
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, []);

  const handleReferenceFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    const valid = files.filter((f) => f.type.startsWith('image/')).slice(0, 14);
    if (!valid.length) return;

    valid.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        if (!base64) return;
        setReferenceImages((prev) => {
          const capped = prev.slice(0, 13); // allow adding one more => max 14
          return [
            ...capped,
            { id, base64, mimeType: file.type || 'image/png', previewUrl },
          ].slice(0, 14);
        });
      };
      reader.readAsDataURL(file);
    });
  }, []);

  useEffect(() => {
    return () => {
      for (const r of referenceImages) {
        if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      }
    };
  }, [referenceImages]);

  const supportsReferenceImage =
    (activeTab !== 'meme' && (imageProvider === 'reve_ai' || imageProvider === 'nano_banana_2')) ||
    (activeTab === 'meme' && (memeSource === 'reve_ai' || memeSource === 'nano_banana_2'));

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
    const provider: ImageStudioProvider =
      activeTab === 'meme' ? (memeSource as ImageStudioProvider) : imageProvider;
    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    setMemelordResults([]);
    setRemixResults([]);
    try {
      const refsPayload = referenceImages.length
        ? { referenceImages: referenceImages.map((r) => ({ base64: r.base64, mimeType: r.mimeType })) }
        : {};

      const isNanoBanana = provider === 'nano_banana_2';
      const useSession = isNanoBanana && nanoBananaSessionId;

      const res = useSession
        ? await sendNanoBananaSessionMessage({
            sessionId: nanoBananaSessionId!,
            prompt: prompt.trim(),
            mode: activeTab,
            aspectRatio: '1:1',
            ...refsPayload,
          })
        : await generateImageStudioImage({
            prompt: prompt.trim(),
            aspectRatio: '1:1',
            mode: activeTab,
            provider,
            nanoBananaModel,
            nanoBananaResolution,
            ...refsPayload,
          });
      addItem({ url: res.url, format: 'image', prompt: prompt.trim().slice(0, 120) });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [prompt, activeTab, memeSource, imageProvider, referenceImages, nanoBananaModel, nanoBananaResolution, nanoBananaSessionId, fetchIdeas, addItem]);

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

          {/* Image provider: Nano Banana 2 / Reve AI (avatar & logo) */}
          {(activeTab === 'avatar' || activeTab === 'logo') && (
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Engine
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['nano_banana_2', 'reve_ai'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setImageProvider(p)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0',
                      border: `1px solid ${imageProvider === p ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: imageProvider === p ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: imageProvider === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {p === 'nano_banana_2' ? 'Nano Banana 2' : 'Reve AI'}
                  </button>
                ))}
              </div>
              {imageProvider === 'nano_banana_2' && (
                <div style={{ marginTop: '0.625rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Model
                    </p>
                    <select
                      value={nanoBananaModel}
                      onChange={(e) => setNanoBananaModel(e.target.value as NanoBananaModel)}
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.8125rem' }}
                    >
                      <option value="gemini-3.1-flash-image-preview">Nano Banana 2</option>
                      <option value="gemini-3-pro-image-preview">Nano Banana Pro Preview</option>
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Resolution
                    </p>
                    <select
                      value={nanoBananaResolution}
                      onChange={(e) => setNanoBananaResolution(e.target.value as NanoBananaResolution)}
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.8125rem' }}
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                </div>
              )}
              {imageProvider === 'nano_banana_2' && (
                <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (nanoBananaSessionId) {
                        setNanoBananaSessionId(null);
                        return;
                      }
                      try {
                        const s = await createNanoBananaSession({ model: nanoBananaModel, resolution: nanoBananaResolution });
                        setNanoBananaSessionId(s.sessionId);
                      } catch (e: unknown) {
                        const err = e as { response?: { data?: { error?: string } }; message?: string };
                        setError(err?.response?.data?.error ?? err?.message ?? 'Failed to start Nano Banana session');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0',
                      border: `1px solid ${nanoBananaSessionId ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: nanoBananaSessionId ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: nanoBananaSessionId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Multi-turn session (keeps context across generates)"
                  >
                    {nanoBananaSessionId ? 'Reset Nano Session' : 'Start Nano Session'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Meme source selector: Nano Banana 2 / Reve AI / Memelord */}
          {activeTab === 'meme' && (
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Engine
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['nano_banana_2', 'reve_ai', 'memelord'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      if (src === 'memelord') {
                        setMemeSource('memelord');
                        setGeneratedUrl(null);
                        setSelectedImageBase64(null);
                        setRemixResults([]);
                      } else {
                        setMemeSource(src);
                        setMemelordResults([]);
                      }
                    }}
                    style={{
                      flex: '1 1 0',
                      minWidth: '90px',
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
                    {src === 'nano_banana_2' ? 'Nano Banana 2' : src === 'reve_ai' ? 'Reve AI' : 'Memelord'}
                  </button>
                ))}
              </div>
              {memeSource === 'nano_banana_2' && (
                <div style={{ marginTop: '0.625rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Model
                    </p>
                    <select
                      value={nanoBananaModel}
                      onChange={(e) => setNanoBananaModel(e.target.value as NanoBananaModel)}
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.8125rem' }}
                    >
                      <option value="gemini-3.1-flash-image-preview">Nano Banana 2</option>
                      <option value="gemini-3-pro-image-preview">Nano Banana Pro Preview</option>
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Resolution
                    </p>
                    <select
                      value={nanoBananaResolution}
                      onChange={(e) => setNanoBananaResolution(e.target.value as NanoBananaResolution)}
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.8125rem' }}
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                </div>
              )}
              {memeSource === 'nano_banana_2' && (
                <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (nanoBananaSessionId) {
                        setNanoBananaSessionId(null);
                        return;
                      }
                      try {
                        const s = await createNanoBananaSession({ model: nanoBananaModel, resolution: nanoBananaResolution });
                        setNanoBananaSessionId(s.sessionId);
                      } catch (e: unknown) {
                        const err = e as { response?: { data?: { error?: string } }; message?: string };
                        setError(err?.response?.data?.error ?? err?.message ?? 'Failed to start Nano Banana session');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0',
                      border: `1px solid ${nanoBananaSessionId ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      background: nanoBananaSessionId ? 'rgba(0,229,160,0.08)' : 'transparent',
                      color: nanoBananaSessionId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Multi-turn session (keeps context across generates)"
                  >
                    {nanoBananaSessionId ? 'Reset Nano Session' : 'Start Nano Session'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prompt area (chatbox) with inline reference upload icon */}
          <div style={{ padding: '0.875rem 1.125rem', flexShrink: 0 }}>
            <label
              htmlFor="img-prompt"
              style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
            >
              Prompt
            </label>
            <div
              style={{
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
                transition: 'border-color 150ms ease',
              }}
            >
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
                  border: 'none',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  background: 'transparent',
                  color: 'var(--text)',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => (e.currentTarget.closest('div') as HTMLElement).style.borderColor = 'var(--border)'}
              />
              {supportsReferenceImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem 0.5rem', borderTop: '1px solid var(--border)' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'color 150ms ease, background 150ms ease',
                    }}
                    title="Attach reference image"
                  >
                    <Upload style={{ width: 18, height: 18 }} />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReferenceFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {referenceImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: 2 }}>
                      {referenceImages.map((r) => (
                        <div key={r.id} style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={r.previewUrl} alt="Ref" style={{ width: 32, height: 32, borderRadius: '6px', objectFit: 'cover', display: 'block' }} />
                          <button
                            type="button"
                            onClick={() => removeReferenceImage(r.id)}
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                            aria-label="Remove reference"
                          >
                            <X style={{ width: 10, height: 10 }} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={clearReferenceImages}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          borderRadius: '8px',
                          padding: '0 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        title="Clear all references"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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

          {/* History (per-wallet) */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.125rem', marginTop: 'auto', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                History
              </p>
              {history.length > 0 && (
                <button type="button" onClick={clearHistory} aria-label="Clear history" style={{ display: 'inline-flex', padding: '0.2rem', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>
            {!address ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Connect wallet to see history.</p>
            ) : history.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No images yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '180px', overflowY: 'auto' }}>
                {history.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const resolved = resolveImageStudioFileUrl(item.url);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.5rem',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`,
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(0,229,160,0.06)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '5px', overflow: 'hidden', background: 'var(--bg)' }}>
                        <img src={resolved} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.prompt || 'Image'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
            {/* Prompt (chatbox) with inline attach icon */}
            <div style={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                rows={2}
                style={{ width: '100%', border: 'none', padding: '0.625rem', fontSize: '0.875rem', background: 'transparent', color: 'var(--text)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
              {supportsReferenceImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem 0.5rem', borderTop: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Attach reference image">
                    <Upload style={{ width: 16, height: 16 }} />
                    <input type="file" accept="image/*" multiple onChange={handleReferenceFile} style={{ display: 'none' }} />
                  </label>
                  {referenceImages.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: 2 }}>
                      {referenceImages.map((r) => (
                        <div key={r.id} style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={r.previewUrl} alt="Ref" style={{ width: 28, height: 28, borderRadius: '6px', objectFit: 'cover', display: 'block' }} />
                          <button type="button" onClick={() => removeReferenceImage(r.id)} style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} aria-label="Remove reference">
                            <X style={{ width: 8, height: 8 }} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={clearReferenceImages} style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '6px', padding: '0 6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                  <button
                    type="button"
                    onClick={() => downloadFromUrl(resolvedGeneratedUrl, 'image-studio.png')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: '7px',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Download style={{ width: 13, height: 13 }} />
                    Download
                  </button>
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
                    <button
                      type="button"
                      onClick={() => downloadFromUrl(r.url, `memelord-${i}.png`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <Download style={{ width: 11, height: 11 }} />
                      Download
                    </button>
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
                      <button
                        type="button"
                        onClick={() => downloadFromUrl(resolved, `${r.patternId}.png`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <Download style={{ width: 11, height: 11 }} /> Download
                      </button>
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
