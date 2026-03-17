'use client';

import React, { useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ImageUp, Loader2, Sparkles, Video } from 'lucide-react';
import {
  resolveImageStudioFileUrl,
  generateVideoClip,
  uploadVideoReferenceImage,
} from '@/lib/api';

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'kling' | 'veo'>('kling');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [durationSeconds, setDurationSeconds] = useState<number>(8);
  const [style, setStyle] = useState<
    '' | 'cinematic' | 'studio_ghibli' | 'anime_cinematic' | 'hyperreal_gritty'
  >('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [uploadingRef, setUploadingRef] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultProvider, setResultProvider] = useState<'kling' | 'veo' | null>(null);

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateVideoClip({
        prompt: text,
        provider,
        durationSeconds,
        aspectRatio,
        referenceUrl: referenceUrl.trim() || undefined,
        style: style || undefined,
      });
      setResultUrl(res.url);
      setResultProvider(res.provider);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to generate video');
    } finally {
      setLoading(false);
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
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
              Output
            </p>

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
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

 