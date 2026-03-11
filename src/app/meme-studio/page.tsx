'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Upload,
  X,
  Sparkles,
  Sliders,
  Grid2X2,
} from 'lucide-react';
import type { MemeFormat } from '@/lib/meme-templates';
import { MEME_STYLES } from '@/lib/meme-templates';
import {
  getMemeTemplates,
  getMemeStyles,
  getMemeProviders,
  generateMeme,
  resolveMemeFileUrl,
  type MemeTemplate,
  type MemeImageProvider,
} from '@/lib/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function wrapStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const words = text.split(' ');
  let line = '';
  const lineHeight = ctx.measureText('M').actualBoundingBoxAscent * 1.2;
  let currentY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + (line ? ' ' : '') + words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.strokeText(line, x, currentY);
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.strokeText(line, x, currentY);
    ctx.fillText(line, x, currentY);
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </p>
  );
}

function InlineField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.875rem',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.875rem',
  outline: 'none',
  cursor: 'pointer',
};

// ── main component ─────────────────────────────────────────────────────────────

export default function MemeStudioPage() {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [idea, setIdea] = useState('');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [styles, setStyles] = useState<string[]>([]);
  const [style, setStyle] = useState<string>('Classic');
  const [format, setFormat] = useState<MemeFormat>('image');
  const [imageProvider, setImageProvider] = useState<'gemini' | 'reve'>('gemini');
  const [geminiModel, setGeminiModel] = useState<'flash' | 'pro'>('flash');
  const [providers, setProviders] = useState<MemeImageProvider[]>([]);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceType, setReferenceType] = useState<'image' | 'gif' | 'video' | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedFormat, setGeneratedFormat] = useState<string>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayFontSize, setOverlayFontSize] = useState(32);
  const [overlayColor, setOverlayColor] = useState('#ffffff');
  const [leftPanel, setLeftPanel] = useState<'templates' | 'settings'>('settings');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = new URLSearchParams(window.location.search).get('token');
    if (token && !idea) setIdea(`Create meme about ${token}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { getMemeTemplates().then(setTemplates).catch(() => setTemplates([])); }, []);
  useEffect(() => { getMemeStyles().then(setStyles).catch(() => setStyles(Array.from(MEME_STYLES))); }, []);
  useEffect(() => { getMemeProviders().then(setProviders).catch(() => setProviders([])); }, []);

  const handleReferenceFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/')
      ? file.type === 'image/gif' ? 'gif' : 'image'
      : file.type.startsWith('video/') ? 'video' : null;
    if (!type) return;
    setReferenceFile(file);
    setReferenceUrl('');
    const reader = new FileReader();
    reader.onload = () => setReferencePreview(reader.result as string);
    reader.readAsDataURL(file);
    setReferenceType(type);
  }, []);

  const clearReference = useCallback(() => {
    setReferenceFile(null);
    setReferencePreview(null);
    setReferenceUrl('');
    setReferenceType(null);
  }, []);

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = overlayColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(2, w / 256);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(12, (overlayFontSize / 100) * Math.min(w, h));
    ctx.font = `bold ${fontSize}px sans-serif`;
    if (topText.trim()) wrapStroke(ctx, topText, w / 2, h * 0.12, w * 0.9);
    if (bottomText.trim()) wrapStroke(ctx, bottomText, w / 2, h * 0.88, w * 0.9);
  }, [topText, bottomText, overlayFontSize, overlayColor]);

  useEffect(() => {
    if (generatedUrl && generatedFormat === 'image') drawOverlay();
  }, [generatedUrl, generatedFormat, drawOverlay]);

  const generate = useCallback(async () => {
    if (!idea.trim()) { setError('Enter a meme idea or caption.'); return; }
    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    try {
      const body = {
        idea: idea.trim(),
        templateId: selectedTemplateId,
        format,
        style,
        imageProvider,
        geminiModel,
        topText: topText.trim(),
        bottomText: bottomText.trim(),
        ...(referenceUrl.trim() && {
          referenceUrl: referenceUrl.trim(),
          referenceType: referenceType || ('image' as const),
        }),
      };
      const data = await generateMeme(body);
      if (data.url) { setGeneratedUrl(data.url); setGeneratedFormat(data.format || 'image'); }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [idea, selectedTemplateId, format, style, imageProvider, geminiModel, topText, bottomText, referenceUrl, referenceType]);

  const useTemplate = useCallback((t: MemeTemplate) => {
    setSelectedTemplateId(t.id);
    if (t.defaultTopText !== undefined) setTopText(t.defaultTopText);
    if (t.defaultBottomText !== undefined) setBottomText(t.defaultBottomText);
    if (t.style) setStyle(t.style);
    if (t.referenceUrl) {
      setReferenceUrl(t.referenceUrl);
      setReferenceType('image');
      setReferenceFile(null);
      setReferencePreview(t.referenceUrl);
    }
    setLeftPanel('settings');
  }, []);

  const resolvedUrl = generatedUrl ? resolveMemeFileUrl(generatedUrl) : null;

  const download = useCallback(() => {
    if (!resolvedUrl) return;
    if (generatedFormat === 'video') {
      const a = document.createElement('a');
      a.download = `memeclaw-meme-${Date.now()}.mp4`;
      a.href = resolvedUrl;
      a.click();
      return;
    }
    if (generatedFormat === 'gif') {
      const a = document.createElement('a');
      a.download = `memeclaw-meme-${Date.now()}.gif`;
      a.href = resolvedUrl;
      a.click();
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const a = document.createElement('a');
      a.download = `memeclaw-meme-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
  }, [resolvedUrl, generatedFormat]);

  const hasOutput = Boolean(resolvedUrl);

  return (
    <AppLayout>
      {/* ── Two-panel layout ── */}
      <div
        style={{
          display: 'flex',
          height: 'calc(100dvh - 64px)',
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT: controls ── */}
        <aside
          className="hidden md:flex"
          style={{
            width: '320px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '1.25rem 1.125rem 1rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '0.375rem', fontFamily: 'var(--font-mono)' }}>
              AI Meme Lab
            </p>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Meme Studio
            </h1>
          </div>

          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {([
              { id: 'settings', label: 'Editor', icon: <Sliders style={{ width: 14, height: 14 }} /> },
              { id: 'templates', label: 'Templates', icon: <Grid2X2 style={{ width: 14, height: 14 }} /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLeftPanel(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.4375rem 0',
                  borderRadius: '8px',
                  border: `1px solid ${leftPanel === tab.id ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                  background: leftPanel === tab.id ? 'rgba(0,229,160,0.07)' : 'transparent',
                  color: leftPanel === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── SETTINGS panel ── */}
          {leftPanel === 'settings' && (
            <div style={{ padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '1.125rem', flex: 1 }}>
              {/* Idea */}
              <div>
                <SectionLabel>Meme idea</SectionLabel>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Crypto trader checking portfolio at 3am..."
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'none',
                    lineHeight: 1.55,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Text overlays */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <InlineField label="Top text">
                  <input type="text" placeholder="Optional" value={topText} onChange={(e) => setTopText(e.target.value)} style={inputStyle} />
                </InlineField>
                <InlineField label="Bottom text">
                  <input type="text" placeholder="Optional" value={bottomText} onChange={(e) => setBottomText(e.target.value)} style={inputStyle} />
                </InlineField>
              </div>

              {/* Style + format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <InlineField label="Style">
                  <select value={style} onChange={(e) => setStyle(e.target.value)} style={selectStyle}>
                    {(styles.length ? styles : MEME_STYLES).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </InlineField>
                <InlineField label="Format">
                  <select value={format} onChange={(e) => setFormat(e.target.value as MemeFormat)} style={selectStyle}>
                    <option value="image">Image</option>
                    <option value="gif">GIF</option>
                    <option value="video">Video</option>
                  </select>
                </InlineField>
              </div>

              {/* Provider options (image only) */}
              {format === 'image' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <InlineField label="Provider">
                    <select value={imageProvider} onChange={(e) => setImageProvider(e.target.value as 'gemini' | 'reve')} style={selectStyle}>
                      {(providers.length
                        ? providers
                        : [{ value: 'gemini', label: 'Gemini' }, { value: 'reve', label: 'Reve AI' }]
                      ).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </InlineField>
                  {imageProvider === 'gemini' && (
                    <InlineField label="Model">
                      <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value as 'flash' | 'pro')} style={selectStyle}>
                        <option value="flash">Flash 2.5</option>
                        <option value="pro">Pro</option>
                      </select>
                    </InlineField>
                  )}
                </div>
              )}

              {/* Reference */}
              <div>
                <SectionLabel>Reference (optional)</SectionLabel>
                <div
                  style={{
                    padding: '0.875rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.375rem 0.625rem',
                        border: '1px solid var(--border)',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg)',
                        flexShrink: 0,
                      }}
                    >
                      <Upload style={{ width: 13, height: 13 }} />
                      Upload
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleReferenceFile} />
                    </label>
                    <input
                      type="url"
                      placeholder="or paste URL..."
                      value={referenceUrl}
                      onChange={(e) => {
                        setReferenceUrl(e.target.value);
                        if (e.target.value) { setReferencePreview(e.target.value); setReferenceFile(null); }
                        else setReferencePreview(null);
                      }}
                      style={{ ...inputStyle, flex: 1, padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                    />
                    {(referencePreview || referenceFile) && (
                      <button type="button" onClick={clearReference} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px', flexShrink: 0 }} aria-label="Clear reference">
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                  {referencePreview && (
                    <img src={referencePreview} alt="Reference preview" style={{ maxWidth: '100%', maxHeight: '90px', borderRadius: '7px', objectFit: 'contain', border: '1px solid var(--border)' }} />
                  )}
                </div>
              </div>

              {/* Text overlay controls (shown only when image is ready) */}
              {hasOutput && generatedFormat === 'image' && (
                <div>
                  <SectionLabel>Text overlay</SectionLabel>
                  <div
                    style={{
                      padding: '0.875rem',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: '34px' }}>Size</span>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={overlayFontSize}
                        onChange={(e) => setOverlayFontSize(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                      />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: '28px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{overlayFontSize}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: '34px' }}>Color</span>
                      <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} style={{ width: 32, height: 32, borderRadius: '6px', cursor: 'pointer', border: 'none', padding: 0 }} />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{overlayColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ padding: '0.625rem 0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}

              {/* Generate */}
              <button
                type="button"
                onClick={generate}
                disabled={loading || !idea.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.6875rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading || !idea.trim() ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                  color: loading || !idea.trim() ? 'var(--text-secondary)' : '#020617',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: loading || !idea.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {loading
                  ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Generating...</>
                  : <><Sparkles style={{ width: 15, height: 15 }} /> Generate Meme</>
                }
              </button>
            </div>
          )}

          {/* ── TEMPLATES panel ── */}
          {leftPanel === 'templates' && (
            <div style={{ padding: '1rem 1.125rem', flex: 1, overflowY: 'auto' }}>
              <SectionLabel>Choose a template</SectionLabel>
              {templates.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No templates loaded.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => useTemplate(t)}
                      aria-label={`Use template ${t.name}`}
                      style={{
                        padding: 0,
                        background: 'transparent',
                        border: `2px solid ${selectedTemplateId === t.id ? 'var(--accent-primary)' : 'var(--border)'}`,
                        borderRadius: '9px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'border-color 150ms ease',
                      }}
                      onMouseEnter={(e) => { if (selectedTemplateId !== t.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; }}
                      onMouseLeave={(e) => { if (selectedTemplateId !== t.id) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ aspectRatio: '1', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{t.name[0]}</span>
                        )}
                      </div>
                      <div style={{ padding: '0.3rem 0.375rem', background: 'var(--bg)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {t.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── RIGHT: canvas / output ── */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: 'var(--bg)',
          }}
        >
          {/* Mobile top bar */}
          <div
            className="md:hidden"
            style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.625rem', flexShrink: 0 }}
          >
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your meme idea..."
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <button
              type="button"
              onClick={generate}
              disabled={loading || !idea.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.625rem',
                borderRadius: '8px', border: 'none',
                background: 'var(--accent-primary)', color: '#020617',
                fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                opacity: loading || !idea.trim() ? 0.5 : 1,
              }}
            >
              {loading ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : <Sparkles style={{ width: 14, height: 14 }} />}
              Generate
            </button>
            {error && <p style={{ fontSize: '0.8125rem', color: '#fca5a5' }}>{error}</p>}
          </div>

          {/* Canvas / preview area */}
          {!hasOutput && !loading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                gap: '1rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 24, height: 24, color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.3rem' }}>Your meme will appear here</p>
                <p style={{ fontSize: '0.8125rem', opacity: 0.6 }}>Configure options on the left, then click Generate.</p>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 style={{ width: 32, height: 32, color: 'var(--accent-primary)' }} className="animate-spin" />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generating your crypto meme...</p>
              </div>
            </div>
          )}

          {hasOutput && !loading && resolvedUrl && (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Output header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Generated meme &bull; {generatedFormat}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={download}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', border: '1px solid rgba(0,229,160,0.3)', borderRadius: '7px', background: 'rgba(0,229,160,0.08)', color: 'var(--accent-primary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Download style={{ width: 13, height: 13 }} />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={generate}
                    disabled={loading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', border: '1px solid var(--border)', borderRadius: '7px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <RefreshCw style={{ width: 13, height: 13 }} />
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Media output */}
              <div
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  display: 'inline-block',
                  maxWidth: '560px',
                  position: 'relative',
                }}
              >
                {generatedFormat === 'video' && (
                  <video src={resolvedUrl} controls loop playsInline style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                )}
                {generatedFormat === 'gif' && (
                  <img src={resolvedUrl} alt="Generated meme GIF" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                )}
                {generatedFormat === 'image' && (
                  <>
                    <img
                      ref={imgRef}
                      src={resolvedUrl}
                      alt="Generated meme"
                      crossOrigin="anonymous"
                      onLoad={drawOverlay}
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
