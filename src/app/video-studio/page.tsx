'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Clock, ImageUp, Loader2, Sparkles, Trash2, Video } from 'lucide-react';
import {
  resolveImageStudioFileUrl,
  createVideoJob,
  getVideoJob,
  uploadVideoReferenceImage,
} from '@/lib/api';
import { useStudioHistory } from '@/hooks/useStudioHistory';
import { useEvmWallet } from '@/components/WalletProvider';

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'kling' | 'veo'>('veo');
  const [fastMode, setFastMode] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [durationSeconds, setDurationSeconds] = useState<number>(8);
  const [style, setStyle] = useState<
    '' | 'cinematic' | 'studio_ghibli' | 'anime_cinematic' | 'hyperreal_gritty'
  >('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [uploadingRef, setUploadingRef] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'queued' | 'running' | 'succeeded' | 'failed' | null>(null);
  const [jobStartedAt, setJobStartedAt] = useState<number | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultProvider, setResultProvider] = useState<'kling' | 'veo' | null>(null);

  const { address } = useEvmWallet();
  const { history, selectedItem, addItem, selectItem, clearHistory } = useStudioHistory({
    studio: 'video',
    walletAddress: address ?? null,
  });

  useEffect(() => {
    if (selectedItem?.url) {
      setResultUrl(selectedItem.url);
      setResultProvider((selectedItem.format as 'kling' | 'veo') || null);
      if (selectedItem.prompt) setPrompt(selectedItem.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    const pollEveryMs = 2000;
    const uiWaitCapMs = 5 * 60 * 1000;
    const startedAt = jobStartedAt ?? Date.now();
    if (!jobStartedAt) setJobStartedAt(startedAt);

    const tick = async () => {
      if (cancelled) return;
      // Stop polling after 5 minutes to avoid “blocking forever” UX.
      if (Date.now() - startedAt > uiWaitCapMs) {
        setLoading(false);
        setError('This is taking longer than 5 minutes. The job may still finish—try again later or regenerate.');
        return;
      }

      try {
        const s = await getVideoJob(jobId);
        if (cancelled) return;
        setJobStatus(s.status);
        if (s.status === 'succeeded' && s.resultUrl) {
          setResultUrl(s.resultUrl);
          setResultProvider((s.providerUsed as 'kling' | 'veo') || (s.provider as 'kling' | 'veo'));
          addItem({
            url: s.resultUrl,
            format: (s.providerUsed || s.provider) as string,
            prompt: prompt.trim().slice(0, 180),
          });
          setLoading(false);
          return;
        }
        if (s.status === 'failed') {
          setLoading(false);
          setError(s.errorMessage || 'Video job failed');
          return;
        }
      } catch {
        // keep polling; transient errors happen during dev/restarts
      }

      if (!cancelled) setTimeout(tick, pollEveryMs);
    };

    setTimeout(tick, 300);
    return () => {
      cancelled = true;
    };
  }, [jobId, jobStartedAt]);

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setResultProvider(null);
    setJobId(null);
    setJobStatus(null);
    setJobStartedAt(null);
    try {
      const res = await createVideoJob({
        prompt: text,
        provider: provider === 'kling' ? 'kling' : 'veo',
        fastMode,
        durationSeconds,
        aspectRatio,
        referenceUrl: referenceUrl.trim() || undefined,
        style: style || undefined,
      });
      setJobId(res.jobId);
      setJobStatus(res.status);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to generate video');
      setLoading(false);
    } finally {
      // loading ends when job finishes or UI wait cap triggers
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <Video style={{ width: 18, height: 18, color: 'var(--accent-primary)' }} />
          <div>
            <h1 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, letterSpacing: '-0.02em' }}>Video Studio</h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Generate a single clip from a prompt (optionally with a reference image).
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: 'var(--space-6)',
            alignItems: 'start',
          }}
        >
          {/* Left: editor */}
          <div
            style={{
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-5)',
            }}
          >
            <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Prompt
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the scene, action, camera, lighting, and mood..."
                rows={7}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '10px 44px 10px 12px',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text)',
                  lineHeight: 1.5,
                }}
              />
              <label
                title="Attach reference image"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'rgba(2,6,23,0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingRef ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={uploadingRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploadingRef(true);
                    setError(null);
                    try {
                      const uploaded = await uploadVideoReferenceImage(file);
                      setReferenceUrl(uploaded.url);
                    } catch (err: unknown) {
                      const ex = err as { response?: { data?: { error?: string } }; message?: string };
                      setError(ex?.response?.data?.error ?? ex?.message ?? 'Failed to upload reference image');
                    } finally {
                      setUploadingRef(false);
                    }
                  }}
                />
                {uploadingRef ? (
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ImageUp style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                )}
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'kling' | 'veo')}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    padding: '10px 12px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="kling">Kling 3</option>
                  <option value="veo">Veo 3.1</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Aspect ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '1:1' | '16:9' | '9:16')}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    padding: '10px 12px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Speed / quality
              </label>
              <select
                value={fastMode ? 'fast' : 'quality'}
                onChange={(e) => setFastMode(e.target.value === 'fast')}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '10px 12px',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text)',
                }}
              >
                <option value="fast">Fast (recommended)</option>
                <option value="quality">Quality</option>
              </select>
              <p style={{ marginTop: 6, fontSize: '11px', color: 'var(--text-secondary)' }}>
                Fast mode uses Veo 3.1 Fast when provider is Veo, and Kling std mode when provider is Kling.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Duration
                </label>
                <select
                  value={String(durationSeconds)}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    padding: '10px 12px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="4">4s</option>
                  <option value="6">6s</option>
                  <option value="8">8s</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Reference image (optional)
                </label>
                <input
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://... or /api/image-studio/file/..."
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    padding: '10px 12px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                />
                <p style={{ marginTop: 8, fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Tip: use the attach icon in the prompt to upload a reference image.
                  {' '}
                  {provider === 'kling' ? 'Kling needs external URLs.' : 'Veo can use uploaded or internal URLs.'}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Video style
              </label>
              <select
                value={style}
                onChange={(e) =>
                  setStyle(
                    (e.target.value as '' | 'cinematic' | 'studio_ghibli' | 'anime_cinematic' | 'hyperreal_gritty') || ''
                  )
                }
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '10px 12px',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text)',
                }}
              >
                <option value="">Default</option>
                <option value="cinematic">Cinematic</option>
                <option value="studio_ghibli">Studio Ghibli</option>
                <option value="anime_cinematic">Anime cinematic</option>
                <option value="hyperreal_gritty">Hyperreal gritty</option>
              </select>
              {provider === 'veo' && referenceUrl.trim() && durationSeconds !== 8 && (
                <p style={{ marginTop: 6, fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Veo reference images typically require 8s. If generation fails, try 8s.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-5)' }}>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--accent-primary)',
                  color: '#020617',
                  padding: '10px 14px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: !canGenerate ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Sparkles style={{ width: 16, height: 16 }} />
                )}
                Generate
              </button>
              {error && <span style={{ color: '#f97373', fontSize: 'var(--font-xs)' }}>{error}</span>}
            </div>
          </div>

          {/* Right: preview */}
          <aside
            style={{
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Output
              </p>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  title="Clear history"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 style={{ width: 12, height: 12 }} />
                  Clear
                </button>
              )}
            </div>

            {resultUrl ? (
              <>
                <div
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                  }}
                >
                  <video
                    src={resolveImageStudioFileUrl(resultUrl)}
                    controls
                    playsInline
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </div>
                <div style={{ marginTop: 10, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  Provider: <span style={{ color: 'var(--text)' }}>{resultProvider || provider}</span>
                </div>
                <a
                  href={resolveImageStudioFileUrl(resultUrl)}
                  download
                  style={{
                    display: 'inline-flex',
                    marginTop: 12,
                    textDecoration: 'none',
                    borderRadius: 999,
                    border: '1px solid rgba(0,229,160,0.3)',
                    background: 'rgba(0,229,160,0.08)',
                    color: 'var(--accent-primary)',
                    padding: '6px 10px',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 700,
                  }}
                >
                  Download mp4
                </a>
              </>
            ) : (
              <div
                style={{
                  borderRadius: 12,
                  border: '1px dashed var(--border)',
                  padding: 'var(--space-5)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-xs)',
                  textAlign: 'center',
                }}
              >
                Your generated clip will show up here.
              </div>
            )}

            {/* History */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Clock style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  History
                </p>
              </div>
              {history.length === 0 ? (
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  No history yet. Generate a clip to save it here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflow: 'auto' }}>
                  {history.map((h) => {
                    const active = selectedItem?.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => selectItem(h.id)}
                        style={{
                          textAlign: 'left',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: active ? 'rgba(0,229,160,0.08)' : 'var(--bg-tertiary)',
                          padding: '10px 12px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text)' }}>
                          {(h.prompt || 'Video clip').slice(0, 80)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

 