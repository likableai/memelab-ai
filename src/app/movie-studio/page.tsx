'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Plus, Play, RefreshCw, Loader2, Film, ThumbsUp, ThumbsDown, ImageUp } from 'lucide-react';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  uploadProjectAvatarImage,
  uploadProjectStyleBoardImage,
  createProjectScene,
  generateSceneVideo,
  getProjectScene,
  getProjectSuggestions,
  updateSceneFeedback,
  resolveImageStudioFileUrl,
  type Project,
  type Scene,
  type StorySuggestion,
} from '@/lib/api';

export default function MovieStudioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [sceneStart, setSceneStart] = useState('');
  const [sceneMiddle, setSceneMiddle] = useState('');
  const [sceneEnd, setSceneEnd] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sceneProviderOverride, setSceneProviderOverride] = useState<'' | 'kling' | 'veo'>('');
  const [sceneReferenceImageUrl, setSceneReferenceImageUrl] = useState('');
  const [sceneReferenceImageUrls, setSceneReferenceImageUrls] = useState<string[]>([]);
  const [sceneKlingRoute, setSceneKlingRoute] = useState<'image2video' | 'text2video' | 'multi-image2video' | 'omni-video'>(
    'image2video'
  );
  const [sceneKlingMultiShot, setSceneKlingMultiShot] = useState(false);
  const [sceneKlingShotType, setSceneKlingShotType] = useState<'customize' | 'intelligence'>('customize');
  const [sceneKlingShots, setSceneKlingShots] = useState<Array<{ index: number; prompt: string; duration: number }>>([
    { index: 1, prompt: '', duration: 2 },
    { index: 2, prompt: '', duration: 3 },
  ]);
  const [sceneUploadingRef, setSceneUploadingRef] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sceneLoadingId, setSceneLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StorySuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [projectAvatarRef, setProjectAvatarRef] = useState('');
  const [projectStyleBoardRef, setProjectStyleBoardRef] = useState('');
  const [projectDefaultProvider, setProjectDefaultProvider] = useState<'' | 'kling' | 'veo'>('');
  const [projectStylePreset, setProjectStylePreset] = useState<Project['stylePreset']>(undefined);
  const [projectMemeFlavor, setProjectMemeFlavor] = useState<boolean>(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const styleBoardFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const list = await getProjects();
      setProjects(list);
      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0]._id);
      }
    } catch {
      setProjects([]);
    }
  }, [selectedProjectId]);

  const loadProjectScenes = useCallback(async (projectId: string) => {
    try {
      const project = await getProjectById(projectId);
      setSelectedProjectId(project._id);
      setSelectedProject(project);
      setProjectAvatarRef(project.referenceAvatarImageUrl || '');
      setProjectStyleBoardRef(project.referenceStyleBoardUrl || '');
      setProjectDefaultProvider(project.defaultVideoProvider || '');
      setProjectStylePreset(project.stylePreset);
      setProjectMemeFlavor(Boolean(project.memeFlavor));
      const sceneIds: string[] = project.sceneIds || [];
      if (sceneIds.length === 0) {
        setScenes([]);
        return;
      }
      const fetched: Scene[] = [];
      for (const id of sceneIds) {
        const s = await getProjectScene(project._id, id);
        fetched.push(s);
      }
      setScenes(fetched);
    } catch {
      setScenes([]);
      setSelectedProject(null);
    }
  }, []);

  const loadSuggestions = useCallback(async (projectId: string) => {
    setSuggestionsLoading(true);
    try {
      const items = await getProjectSuggestions(projectId);
      setSuggestions(items);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectScenes(selectedProjectId);
      loadSuggestions(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectScenes, loadSuggestions]);

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const project = await createProject({ title: newProjectTitle.trim() });
      setNewProjectTitle('');
      await loadProjects();
      setSelectedProjectId(project._id);
      setSelectedProject(project);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScene = async () => {
    const start = sceneStart.trim();
    const middle = sceneMiddle.trim();
    const end = sceneEnd.trim();
    if (!selectedProjectId || (!start && !middle && !end)) return;
    const combinedPrompt = [
      start ? `At the start of this 8 seconds: ${start}` : '',
      middle ? `Main action: ${middle}` : '',
      end ? `By the end: ${end}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    setLoading(true);
    setError(null);
    try {
      const klingMultiPrompt =
        (sceneProviderOverride || (projectDefaultProvider || 'kling')) === 'kling' && sceneKlingMultiShot
          ? sceneKlingShots
              .slice(0, 6)
              .map((s, i) => ({
                index: i + 1,
                prompt: (s.prompt || '').trim(),
                duration: String(Math.max(1, Math.min(15, Math.floor(s.duration || 1)))),
              }))
              .filter((s) => s.prompt.length > 0)
          : undefined;

      const scene = await createProjectScene(selectedProjectId, {
        prompt: combinedPrompt,
        summary: combinedPrompt.slice(0, 220),
        referenceImageUrl: sceneReferenceImageUrl || undefined,
        referenceImageUrls: sceneReferenceImageUrls.length ? sceneReferenceImageUrls : undefined,
        videoProviderOverride: sceneProviderOverride || undefined,
        klingRoute:
          (sceneProviderOverride || (projectDefaultProvider || 'kling')) === 'kling' ? sceneKlingRoute : undefined,
        klingMultiShot:
          (sceneProviderOverride || (projectDefaultProvider || 'kling')) === 'kling' ? sceneKlingMultiShot : undefined,
        klingShotType:
          (sceneProviderOverride || (projectDefaultProvider || 'kling')) === 'kling' && sceneKlingMultiShot
            ? sceneKlingShotType
            : undefined,
        klingMultiPrompt:
          (sceneProviderOverride || (projectDefaultProvider || 'kling')) === 'kling' && sceneKlingMultiShot
            ? (klingMultiPrompt as any)
            : undefined,
      });
      setSceneStart('');
      setSceneMiddle('');
      setSceneEnd('');
      setSceneProviderOverride('');
      setSceneReferenceImageUrl('');
      setSceneReferenceImageUrls([]);
      setSceneKlingRoute('image2video');
      setSceneKlingMultiShot(false);
      setSceneKlingShotType('customize');
      setSceneKlingShots([
        { index: 1, prompt: '', duration: 2 },
        { index: 2, prompt: '', duration: 3 },
      ]);
      setScenes((prev) => [...prev, scene]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to add scene');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScene = async (scene: Scene) => {
    if (!selectedProjectId) return;
    setSceneLoadingId(scene._id);
    setError(null);
    try {
      const res = await generateSceneVideo(selectedProjectId, scene._id, {
        // Let backend resolve provider from scene override / project default.
      });
      setScenes((prev) =>
        prev.map((s) => (s._id === scene._id ? { ...s, renderUrl: res.url, status: 'rendered' } : s))
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to generate scene video');
    } finally {
      setSceneLoadingId(null);
    }
  };

  return (
    <AppLayout>
      <div
        style={{
          display: 'flex',
          height: 'calc(100dvh - 64px)',
        }}
      >
        {/* Sidebar: projects */}
        <aside
          style={{
            width: '280px',
            borderRight: '1px solid var(--border)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Film style={{ width: 18, height: 18 }} />
            <h1 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>Movie Studio</h1>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-xs)',
                marginBottom: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              New project
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Project title"
                style={{
                  flex: 1,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  padding: '6px 10px',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text)',
                }}
              />
              <button
                onClick={handleCreateProject}
                disabled={loading || !newProjectTitle.trim()}
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '6px 10px',
                  fontSize: 'var(--font-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: loading || !newProjectTitle.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Plus style={{ width: 14, height: 14 }} />
                )}
              </button>
            </div>
          </div>
          {selectedProject && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500 }}>Project context</span>
              </div>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !selectedProjectId) return;
                  try {
                    const updated = await uploadProjectAvatarImage(selectedProjectId, file);
                    setSelectedProject(updated);
                    setProjectAvatarRef(updated.referenceAvatarImageUrl || '');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <input
                ref={styleBoardFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !selectedProjectId) return;
                  try {
                    const updated = await uploadProjectStyleBoardImage(selectedProjectId, file);
                    setSelectedProject(updated);
                    setProjectStyleBoardRef(updated.referenceStyleBoardUrl || '');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-2xs)',
                  marginBottom: 2,
                  color: 'var(--text-secondary)',
                }}
              >
                Project avatar reference (URL)
              </label>
              <input
                value={projectAvatarRef}
                onChange={(e) => setProjectAvatarRef(e.target.value)}
                placeholder="https://..."
                style={{
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '4px 8px',
                  fontSize: 'var(--font-2xs)',
                  color: 'var(--text)',
                  marginBottom: 4,
                }}
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  fontSize: 'var(--font-2xs)',
                  marginBottom: 4,
                  cursor: 'pointer',
                }}
              >
                Upload image from device
              </button>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-2xs)',
                  marginBottom: 2,
                  color: 'var(--text-secondary)',
                }}
              >
                Brand / style board reference (URL)
              </label>
              <input
                value={projectStyleBoardRef}
                onChange={(e) => setProjectStyleBoardRef(e.target.value)}
                placeholder="https://..."
                style={{
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '4px 8px',
                  fontSize: 'var(--font-2xs)',
                  color: 'var(--text)',
                  marginBottom: 4,
                }}
              />
              <button
                type="button"
                onClick={() => styleBoardFileInputRef.current?.click()}
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  fontSize: 'var(--font-2xs)',
                  marginBottom: 4,
                  cursor: 'pointer',
                }}
              >
                Upload image from device
              </button>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-2xs)',
                  marginBottom: 2,
                  color: 'var(--text-secondary)',
                }}
              >
                Default video model
              </label>
              <select
                value={projectDefaultProvider}
                onChange={(e) =>
                  setProjectDefaultProvider(e.target.value === '' ? '' : (e.target.value as 'kling' | 'veo'))
                }
                style={{
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '4px 8px',
                  fontSize: 'var(--font-2xs)',
                  color: 'var(--text)',
                  marginBottom: 6,
                }}
              >
                <option value="">Auto (per scene / Kling default)</option>
                <option value="kling">Kling 3</option>
                <option value="veo">Veo 3</option>
              </select>

              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-2xs)',
                  marginBottom: 2,
                  color: 'var(--text-secondary)',
                }}
              >
                Style preset
              </label>
              <select
                value={projectStylePreset || ''}
                onChange={(e) =>
                  setProjectStylePreset((e.target.value || undefined) as Project['stylePreset'])
                }
                style={{
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '4px 8px',
                  fontSize: 'var(--font-2xs)',
                  color: 'var(--text)',
                  marginBottom: 6,
                }}
              >
                <option value="">Default cinematic</option>
                <option value="ghibli_handdrawn">Studio Ghibli (hand-drawn)</option>
                <option value="anime_cinematic">Anime cinematic</option>
                <option value="hyperreal_gritty">Hyperreal gritty</option>
                <option value="stylized_statue">Stylized statue</option>
              </select>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 'var(--font-2xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                <input
                  type="checkbox"
                  checked={projectMemeFlavor}
                  onChange={(e) => setProjectMemeFlavor(e.target.checked)}
                />
                Meme flavor (keep it punchy)
              </label>
              <button
                onClick={async () => {
                  if (!selectedProjectId) return;
                  try {
                    const updated = await updateProject(selectedProjectId, {
                      referenceAvatarImageUrl: projectAvatarRef || undefined,
                      referenceStyleBoardUrl: projectStyleBoardRef || undefined,
                      defaultVideoProvider: projectDefaultProvider || undefined,
                      stylePreset: projectStylePreset || undefined,
                      memeFlavor: projectMemeFlavor,
                    });
                    setSelectedProject(updated);
                  } catch {
                    // Silent fail; main flow still works.
                  }
                }}
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  padding: '4px 10px',
                  fontSize: 'var(--font-2xs)',
                  cursor: selectedProjectId ? 'pointer' : 'not-allowed',
                }}
              >
                Save project context
              </button>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {projects.map((p) => {
              const active = p._id === selectedProjectId;
              return (
                <button
                  key={p._id}
                  onClick={() => setSelectedProjectId(p._id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    marginBottom: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: active ? 'rgba(0,229,160,0.08)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    {p.sceneIds?.length ?? 0} scenes
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main: scenes & editor */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ marginBottom: 'var(--space-2)', display: 'grid', gap: 'var(--space-2)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-xs)',
                    marginBottom: 4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Start (first couple seconds)
                </label>
                <input
                  value={sceneStart}
                  onChange={(e) => setSceneStart(e.target.value)}
                  placeholder="Where are we? Who is on screen?"
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    padding: '6px 10px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-xs)',
                    marginBottom: 4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Main action
                </label>
                <input
                  value={sceneMiddle}
                  onChange={(e) => setSceneMiddle(e.target.value)}
                  placeholder="What is the main beat or movement?"
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    padding: '6px 10px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-xs)',
                    marginBottom: 4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Ending
                </label>
                <input
                  value={sceneEnd}
                  onChange={(e) => setSceneEnd(e.target.value)}
                  placeholder="How does this 8s moment end or react?"
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    padding: '6px 10px',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                borderTop: '1px dashed var(--border)',
                paddingTop: 'var(--space-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                style={{
                  alignSelf: 'flex-start',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showAdvanced ? 'Hide advanced' : 'Show advanced'}
              </button>
              {showAdvanced && (
                <div
                  style={{
                    display: 'grid',
                    gap: 'var(--space-2)',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--font-xs)',
                        marginBottom: 4,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Model / provider
                    </label>
                    <select
                      value={sceneProviderOverride}
                      onChange={(e) =>
                        setSceneProviderOverride(e.target.value === '' ? '' : (e.target.value as 'kling' | 'veo'))
                      }
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        padding: '6px 10px',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--text)',
                      }}
                    >
                      <option value="">Project default / Kling</option>
                      <option value="kling">Kling 3</option>
                      <option value="veo">Veo 3</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--font-xs)',
                        marginBottom: 4,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Reference image URL
                    </label>
                    <input
                      value={sceneReferenceImageUrl}
                      onChange={(e) => setSceneReferenceImageUrl(e.target.value)}
                      placeholder="Optional: URL to a frame or style image"
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        padding: '6px 10px',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--text)',
                      }}
                    />
                    {sceneReferenceImageUrls.length > 0 && (
                      <p style={{ marginTop: 6, fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Attached images: <span style={{ color: 'var(--text)' }}>{sceneReferenceImageUrls.length}</span>
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <label
                        title="Attach reference image(s)"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: 'rgba(2,6,23,0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: sceneUploadingRef ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={sceneUploadingRef}
                          multiple={sceneProviderOverride === 'kling' && sceneKlingRoute === 'multi-image2video'}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = '';
                            if (!files.length) return;
                            setSceneUploadingRef(true);
                            setError(null);
                            try {
                              const uploadedUrls: string[] = [];
                              for (const f of files) {
                                const uploaded = await uploadProjectStyleBoardImage(selectedProjectId!, f);
                                // Use the stored style-board URL as a stable blob URL, but also keep per-scene list.
                                if (uploaded.referenceStyleBoardUrl) uploadedUrls.push(uploaded.referenceStyleBoardUrl);
                              }
                              const primary = uploadedUrls[0];
                              if (primary) setSceneReferenceImageUrl(primary);
                              if (uploadedUrls.length) {
                                setSceneReferenceImageUrls((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
                              }
                            } catch (err: unknown) {
                              const ex = err as { response?: { data?: { error?: string } }; message?: string };
                              setError(ex?.response?.data?.error ?? ex?.message ?? 'Failed to upload reference image');
                            } finally {
                              setSceneUploadingRef(false);
                            }
                          }}
                        />
                        {sceneUploadingRef ? (
                          <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <ImageUp style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                        )}
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Upload reference image(s) (uses project blob storage)
                      </span>
                    </div>
                  </div>

                  {(sceneProviderOverride === 'kling' || projectDefaultProvider === 'kling' || projectDefaultProvider === '') && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 'var(--font-xs)',
                          marginBottom: 4,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Kling generation route
                      </label>
                      <select
                        value={sceneKlingRoute}
                        onChange={(e) =>
                          setSceneKlingRoute(
                            e.target.value as 'image2video' | 'text2video' | 'multi-image2video' | 'omni-video'
                          )
                        }
                        style={{
                          width: '100%',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          padding: '6px 10px',
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text)',
                        }}
                      >
                        <option value="text2video">Text to Video</option>
                        <option value="image2video">Image to Video</option>
                        <option value="multi-image2video">Multi-Image to Video</option>
                        <option value="omni-video">Omni Video</option>
                      </select>
                      <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                        <input
                          type="checkbox"
                          checked={sceneKlingMultiShot}
                          onChange={(e) => setSceneKlingMultiShot(e.target.checked)}
                        />
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Enable multi-shot storyboard</span>
                      </label>
                      {sceneKlingMultiShot && (
                        <>
                          <div style={{ marginTop: 8 }}>
                            <label
                              style={{
                                display: 'block',
                                fontSize: 'var(--font-xs)',
                                marginBottom: 4,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              Storyboard type
                            </label>
                            <select
                              value={sceneKlingShotType}
                              onChange={(e) => setSceneKlingShotType(e.target.value as 'customize' | 'intelligence')}
                              style={{
                                width: '100%',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                background: 'var(--bg-secondary)',
                                padding: '6px 10px',
                                fontSize: 'var(--font-sm)',
                                color: 'var(--text)',
                              }}
                            >
                              <option value="customize">Customize</option>
                              <option value="intelligence">Intelligence</option>
                            </select>
                          </div>
                          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                            {sceneKlingShots.slice(0, 6).map((shot, idx) => (
                              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Shot {idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSceneKlingShots((prev) => {
                                        if (prev.length <= 1) return prev;
                                        const next = prev.filter((_, i) => i !== idx);
                                        return next.map((s, i) => ({ ...s, index: i + 1 }));
                                      })
                                    }
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--text-secondary)',
                                      cursor: 'pointer',
                                      fontSize: 12,
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                                <textarea
                                  value={shot.prompt}
                                  onChange={(e) =>
                                    setSceneKlingShots((prev) =>
                                      prev.map((s, i) => (i === idx ? { ...s, prompt: e.target.value } : s))
                                    )
                                  }
                                  rows={2}
                                  placeholder="Shot prompt..."
                                  style={{
                                    width: '100%',
                                    marginTop: 6,
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-secondary)',
                                    padding: '6px 10px',
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--text)',
                                  }}
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={15}
                                  value={shot.duration}
                                  onChange={(e) =>
                                    setSceneKlingShots((prev) =>
                                      prev.map((s, i) =>
                                        i === idx ? { ...s, duration: parseInt(e.target.value || '1', 10) } : s
                                      )
                                    )
                                  }
                                  style={{
                                    width: '100%',
                                    marginTop: 6,
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-secondary)',
                                    padding: '6px 10px',
                                    fontSize: 'var(--font-sm)',
                                    color: 'var(--text)',
                                  }}
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setSceneKlingShots((prev) => {
                                  if (prev.length >= 6) return prev;
                                  const next = [...prev, { index: prev.length + 1, prompt: '', duration: 1 }];
                                  return next.map((s, i) => ({ ...s, index: i + 1 }));
                                })
                              }
                              style={{
                                alignSelf: 'flex-start',
                                borderRadius: 999,
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text)',
                                padding: '6px 10px',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              + Add shot
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                onClick={handleAddScene}
                disabled={loading || (!sceneStart.trim() && !sceneMiddle.trim() && !sceneEnd.trim()) || !selectedProjectId}
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--accent-primary)',
                  color: '#020617',
                  padding: '0 16px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor:
                    loading || (!sceneStart.trim() && !sceneMiddle.trim() && !sceneEnd.trim()) || !selectedProjectId
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {loading ? (
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Plus style={{ width: 16, height: 16 }} />
                )}
                Add scene
              </button>
            </div>
            {error && <p style={{ color: '#f97373', fontSize: 'var(--font-xs)', marginTop: 6 }}>{error}</p>}
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {/* Storyboard */}
            <section
              style={{
                flex: 1,
                padding: 'var(--space-4)',
                overflow: 'auto',
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-3)',
                }}
              >
                Scenes
              </h2>
              {scenes.length === 0 && (
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  No scenes yet. Add a prompt above to create your first 8s scene.
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  flexWrap: 'wrap',
                }}
              >
                {scenes.map((scene) => (
                  <div
                    key={scene._id}
                    style={{
                      width: 240,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      padding: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
                      {scene.title || `Scene ${scene.index != null ? scene.index + 1 : ''}`}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--text-secondary)',
                        minHeight: 40,
                      }}
                    >
                      {scene.summary || scene.script || 'No summary yet.'}
                    </div>
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: 'var(--bg-tertiary)',
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {scene.renderUrl ? (
                        <video
                          src={resolveImageStudioFileUrl(scene.renderUrl)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          controls
                        />
                      ) : (
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                          No video generated yet
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 'var(--space-1)',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <button
                        onClick={() => handleGenerateScene(scene)}
                        disabled={sceneLoadingId === scene._id}
                        style={{
                          borderRadius: 999,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-tertiary)',
                          padding: '4px 10px',
                          fontSize: 'var(--font-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: sceneLoadingId === scene._id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {sceneLoadingId === scene._id ? (
                          <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        ) : scene.renderUrl ? (
                          <RefreshCw style={{ width: 14, height: 14 }} />
                        ) : (
                          <Play style={{ width: 14, height: 14 }} />
                        )}
                        {scene.renderUrl ? 'Regenerate' : 'Generate'}
                      </button>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={async () => {
                            if (!selectedProjectId) return;
                            await updateSceneFeedback(selectedProjectId, scene._id, {
                              rating: 5,
                              flags: ['great'],
                            });
                          }}
                          style={{
                            borderRadius: 999,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            padding: 4,
                            cursor: 'pointer',
                          }}
                          title="Great scene"
                        >
                          <ThumbsUp style={{ width: 14, height: 14 }} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!selectedProjectId) return;
                            await updateSceneFeedback(selectedProjectId, scene._id, {
                              flags: ['too_small_character'],
                            });
                          }}
                          style={{
                            borderRadius: 999,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            padding: 4,
                            cursor: 'pointer',
                          }}
                          title="Character too small"
                        >
                          <ThumbsDown style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Suggestions panel */}
            <aside
              style={{
                width: 280,
                borderLeft: '1px solid var(--border)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h2 style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>Next scene ideas</h2>
                <button
                  onClick={() => selectedProjectId && loadSuggestions(selectedProjectId)}
                  disabled={!selectedProjectId || suggestionsLoading}
                  style={{
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    padding: 4,
                    cursor: !selectedProjectId || suggestionsLoading ? 'not-allowed' : 'pointer',
                  }}
                  title="Refresh suggestions"
                >
                  {suggestionsLoading ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw style={{ width: 14, height: 14 }} />
                  )}
                </button>
              </div>
              {suggestions.length === 0 && (
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  No suggestions yet. Add a scene or refresh to get ideas for what happens next.
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  overflow: 'auto',
                }}
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={`${s.title}-${idx}`}
                    onClick={() => setSceneMiddle(s.prompt)}
                    style={{
                      textAlign: 'left',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      padding: 'var(--space-2) var(--space-3)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {s.summary}
                    </div>
                    <div style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-secondary)' }}>
                      Click to use this prompt.
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}

