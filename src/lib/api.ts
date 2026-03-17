import axios from 'axios';

/**
 * Normalizes the API URL to always end with /api (without duplication)
 * @param url - The API URL from environment variable or default
 * @returns Normalized URL ending with /api
 */
function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  // Remove trailing slashes
  let normalized = envUrl.replace(/\/+$/, '');
  // Ensure it ends with /api (add if missing, don't duplicate)
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized;
}

const API_URL = getApiBaseUrl();

// Export the normalized API URL for use in other components
export const getApiUrl = () => API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple auth token helpers (localStorage-based)
const AUTH_TOKEN_KEY = 'likable_auth_token';

export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } else {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Attach Authorization header automatically when token is present
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Voice Session APIs
export interface VoiceSessionConfig {
  walletAddress: string;
  userId?: string;
  voice?: 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';
  model?: string;
  systemInstructions?: string;
  temperature?: number;
}

export interface VoiceSessionResponse {
  sessionId: string;
  message: string;
  wsUrl: string;
  maxDuration: number;
  estimatedCost: number;
}

export const createVoiceSession = async (config: VoiceSessionConfig): Promise<VoiceSessionResponse> => {
  try {
    const response = await api.post('/voice/session', config);
    return response.data;
  } catch (error: any) {
    // Network error: backend unreachable (not running, wrong URL, or CORS)
    const isNetworkError =
      !error.response &&
      (error.message === 'Network Error' || error.code === 'ERR_NETWORK');
    if (isNetworkError) {
      const hint = typeof window !== 'undefined'
        ? 'Cannot reach the API. The service may be unavailable or slow to wake (e.g. Render). Check NEXT_PUBLIC_API_URL and try again.'
        : 'Backend unreachable (network error).';
      throw Object.assign(new Error(hint), { code: 'NETWORK_ERROR', original: error });
    }
    // Re-throw with more context for better error handling
    if (error.response) {
      throw {
        ...error,
        response: {
          ...error.response,
          data: {
            ...error.response.data,
            error: error.response.data?.error || error.response.data?.message || 'Voice service error',
            message: error.response.data?.message || error.response.data?.error,
          },
        },
      };
    }
    throw error;
  }
};

export const getVoiceSession = async (sessionId: string) => {
  const response = await api.get(`/voice/session/${sessionId}`);
  return response.data;
};

export const closeVoiceSession = async (sessionId: string, walletAddress?: string) => {
  const config: any = {};
  if (walletAddress) {
    config.data = { walletAddress };
  }
  const response = await api.delete(`/voice/session/${sessionId}`, config);
  return response.data;
};

export const getVoiceCost = async () => {
  const response = await api.get('/voice/cost');
  return response.data;
};

// Chat APIs
export interface ChatMessageRequest {
  message: string;
  walletAddress: string;
  userTier?: 'free' | 'paid';
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
}

export interface ChatMessageResponse {
  reply: string;
  memeUrl?: string;
  memeFormat?: string;
  tokenInfo: {
    cost: number;
    costUsd: number;
    remainingBalance: number;
    llmUsage?: {
      inputTokens: number;
      outputTokens: number;
      model: string;
      provider: string;
      intent?: string;
    };
  };
  modelInfo?: {
    selectedModel: string;
    provider: string;
    intent?: string;
  };
}

export const sendChatMessage = async (request: ChatMessageRequest): Promise<ChatMessageResponse> => {
  const response = await api.post('/chat/message', request);
  return response.data;
};

export const getChatCost = async (userTier: 'free' | 'paid' = 'free') => {
  const response = await api.get('/chat/cost', { params: { userTier } });
  return response.data;
};

// Token APIs
export const getTokenBalance = async (walletAddress: string) => {
  const response = await api.get(`/token/balance/${walletAddress}`);
  return response.data;
};

/** Balance response includes credit info (USD, min required, canAccess) */
export interface TokenBalanceData {
  walletAddress: string;
  currentBalance: number;
  depositedAmount: number;
  consumedAmount: number;
  lastUpdated: string;
  balanceUsd?: number;
  minDepositUsd?: number;
  canAccess?: boolean;
}

export const getTokenPrice = async () => {
  const response = await api.get('/token/price');
  return response.data;
};

export const getTokenStats = async () => {
  const response = await api.get('/token/stats');
  return response.data;
};

/** Search BNB Chain tokens via DexScreener (Explorer). */
export const searchTokens = async (query: string) => {
  const response = await api.get('/token/search', { params: { query } });
  return response.data;
};

/** Usage history for a wallet (for dashboard / tokens-used UI). */
export const getUsageHistory = async (walletAddress: string, limit = 50) => {
  const response = await api.get(`/token/usage-history/${walletAddress}`, { params: { limit } });
  return response.data;
};

/** Token config for building deposit transfer. BSC: tokenMint = contract address, treasuryWallet = recipient. */
export interface TokenConfig {
  treasuryWallet: string;
  /** BSC: treasury wallet address. Solana: treasury ATA (deprecated) */
  treasuryAta?: string;
  /** BSC: BEP-20 contract address. Solana: token mint address */
  tokenMint: string;
  tokenDecimals: number;
  /** Token program ID (Solana only, deprecated) */
  tokenProgram?: string;
}
export const getTokenConfig = async (): Promise<TokenConfig> => {
  const response = await api.get<TokenConfig>('/token/config');
  return response.data;
};

/** Record a token deposit after on-chain transfer. Requires verified txHash. */
export interface RecordDepositRequest {
  walletAddress: string;
  amount: number;
  txHash: string;
}
export const recordDeposit = async (payload: RecordDepositRequest) => {
  const response = await api.post('/token/deposit', payload);
  return response.data;
};

/** Record a deposit after user paid to treasury. Amount is read from chain if omitted. */
export interface RecordDepositPayRequest {
  walletAddress: string;
  txHash: string;
  amount?: number;
}
export const recordDepositPay = async (payload: RecordDepositPayRequest) => {
  const response = await api.post('/token/deposit/pay', payload);
  return response.data;
};

/** Scan wallet ATA for recent incoming token transfers; verify and credit new ones. */
export interface ScanDepositsResponse {
  credited: Array<{ txHash: string; amount: number }>;
  alreadyProcessed: number;
}
export const scanDeposits = async (walletAddress: string): Promise<ScanDepositsResponse> => {
  const response = await api.post<ScanDepositsResponse>('/token/deposit/scan', { walletAddress });
  return response.data;
};

// Legacy function for backward compatibility (deprecated)
export const sendMessage = async (message: string, walletAddress: string) => {
  return sendChatMessage({ message, walletAddress });
};

// Meme Studio APIs (backend: same base URL as voice/chat/token)
export interface MemeTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  format: string;
  layout: Record<string, unknown>;
  defaultTopText?: string;
  defaultBottomText?: string;
  referenceUrl?: string;
  style?: string;
}

export const getMemeTemplates = async (): Promise<MemeTemplate[]> => {
  const response = await api.get<MemeTemplate[]>('/meme/templates');
  return response.data;
};

export const getMemeStyles = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/meme/styles');
  return response.data;
};

export type VideoProvider = 'kling' | 'veo' | 'seedance';

export interface GenerateMemeRequest {
  idea: string;
  templateId?: string;
  format?: 'image' | 'gif' | 'video';
  style?: string;
  imageProvider?: 'gemini' | 'reve';
  geminiModel?: 'flash' | 'pro';
  videoProvider?: VideoProvider;
  videoDuration?: string;
  videoAspectRatio?: string;
  videoMode?: 'std' | 'pro';
  topText?: string;
  bottomText?: string;
  referenceUrl?: string;
  referenceType?: 'image' | 'gif' | 'video';
}

export interface MemeImageProvider {
  value: string;
  label: string;
}

export const getMemeProviders = async (): Promise<MemeImageProvider[]> => {
  const response = await api.get<MemeImageProvider[]>('/meme/providers');
  return response.data;
};

/** Resolve generated url for display/download: prefix /api/meme/file/ with backend origin. */
export function resolveMemeFileUrl(url: string): string {
  if (typeof url !== 'string' || !url) return url;
  if (url.startsWith('/api/meme/file/')) {
    const base = getApiUrl().replace(/\/api$/, '');
    return `${base}${url}`;
  }
  return url;
}

export interface GenerateMemeResponse {
  url: string;
  format: string;
}

export const generateMeme = async (body: GenerateMemeRequest): Promise<GenerateMemeResponse> => {
  const response = await api.post<GenerateMemeResponse>('/meme/generate', body);
  return response.data;
};

// Image Studio API
export interface MemePattern {
  id: string;
  name: string;
  description: string;
  remixPrompt: string;
  aspectRatio?: string;
}

export interface GetImageStudioPatternsParams {
  page?: number;
  limit?: number;
  format?: string;
  theme?: string;
  category?: string;
  q?: string;
}

export interface GetImageStudioPatternsResponse {
  patterns: MemePattern[];
  total: number;
  page: number;
  limit: number;
}

export const getImageStudioPatterns = async (
  params?: GetImageStudioPatternsParams
): Promise<GetImageStudioPatternsResponse> => {
  const response = await api.get<GetImageStudioPatternsResponse>('/image-studio/patterns', {
    params: params ? {
      page: params.page,
      limit: params.limit,
      format: params.format,
      theme: params.theme,
      category: params.category,
      q: params.q,
    } : undefined,
  });
  return response.data;
};

export const getImageStudioFormats = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/image-studio/patterns/formats');
  return response.data;
};

export const getImageStudioThemes = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/image-studio/patterns/themes');
  return response.data;
};

export type ImageStudioProvider = 'nano_banana_2' | 'reve_ai';
export type NanoBananaModel = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview';
export type NanoBananaResolution = '1K' | '2K' | '4K';

export interface GenerateImageStudioParams {
  prompt: string;
  aspectRatio?: string;
  mode?: 'avatar' | 'logo' | 'meme';
  provider?: ImageStudioProvider;
  /** Optional reference images (base64) for providers that support it. */
  referenceImages?: Array<{ base64: string; mimeType?: string }>;
  /** Nano Banana-only: choose image model variant. */
  nanoBananaModel?: NanoBananaModel;
  /** Nano Banana-only: output resolution. */
  nanoBananaResolution?: NanoBananaResolution;
}

export interface GenerateImageStudioResponse {
  url: string;
  filename: string;
}

export const generateImageStudioImage = async (
  params: GenerateImageStudioParams
): Promise<GenerateImageStudioResponse> => {
  const response = await api.post<GenerateImageStudioResponse>('/image-studio/generate', params);
  return response.data;
};

// --- Nano Banana sessions (Image Studio only) ---

export interface NanoBananaSessionCreateResponse {
  sessionId: string;
  sessionJsonUrl: string;
  model: NanoBananaModel;
  resolution?: NanoBananaResolution;
}

export const createNanoBananaSession = async (payload: {
  model?: NanoBananaModel;
  resolution?: NanoBananaResolution;
}): Promise<NanoBananaSessionCreateResponse> => {
  const response = await api.post<NanoBananaSessionCreateResponse>('/image-studio/nano-banana/session/create', payload);
  return response.data;
};

export const sendNanoBananaSessionMessage = async (payload: {
  sessionId: string;
  prompt: string;
  mode?: 'avatar' | 'logo' | 'meme';
  aspectRatio?: string;
  referenceImages?: Array<{ base64: string; mimeType?: string }>;
}): Promise<GenerateImageStudioResponse & { sessionId: string }> => {
  const response = await api.post<GenerateImageStudioResponse & { sessionId: string }>(
    '/image-studio/nano-banana/session/send',
    payload
  );
  return response.data;
};

export interface RemixImageStudioParams {
  referenceImageBase64: string;
  patternId?: string;
  customPrompt?: string;
  aspectRatio?: string;
}

export const remixImageStudioImage = async (
  params: RemixImageStudioParams
): Promise<GenerateImageStudioResponse> => {
  const response = await api.post<GenerateImageStudioResponse>('/image-studio/remix', params);
  return response.data;
};

export interface RemixBatchResult {
  patternId: string;
  url: string;
  filename: string;
}

export const remixImageStudioBatch = async (
  referenceImageBase64: string,
  patternIds?: string[]
): Promise<{ results: RemixBatchResult[] }> => {
  const response = await api.post<{ results: RemixBatchResult[] }>('/image-studio/remix-batch', {
    referenceImageBase64,
    patternIds,
  });
  return response.data;
};

// --- Video Studio / Projects API ---

export interface Project {
  _id: string;
  title: string;
  description?: string;
  avatarId?: string;
  logoUrl?: string;
  logoAssetId?: string;
  stylePreset?: 'anime_cinematic' | 'hyperreal_gritty' | 'stylized_statue' | 'ghibli_handdrawn';
  memeFlavor?: boolean;
  brandPalette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
  };
  storyNotes?: string;
  referenceAvatarImageUrl?: string;
  referenceStyleBoardUrl?: string;
  defaultVideoProvider?: 'kling' | 'veo';
  sceneIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Scene {
  _id: string;
  projectId: string;
  index?: number;
  title?: string;
  summary?: string;
  script?: string;
  durationSeconds: number;
  videoProvider?: 'kling' | 'veo' | 'seedance';
  referenceImageUrl?: string;
  videoProviderOverride?: 'kling' | 'veo';
  status: 'draft' | 'pending' | 'rendering' | 'rendered' | 'failed';
  renderUrl?: string;
  fileId?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const createProject = async (payload: {
  title: string;
  description?: string;
  stylePreset?: Project['stylePreset'];
  memeFlavor?: boolean;
}): Promise<Project> => {
  const response = await api.post<Project>('/projects', payload);
  return response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const updateProject = async (
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    avatarId: string;
    logoUrl: string;
    logoAssetId: string;
    brandPalette: Project['brandPalette'];
    storyNotes: string;
    referenceAvatarImageUrl: string;
    referenceStyleBoardUrl: string;
    defaultVideoProvider: 'kling' | 'veo';
    stylePreset: Project['stylePreset'];
    memeFlavor: boolean;
  }>
): Promise<Project> => {
  const response = await api.patch<Project>(`/projects/${id}`, payload);
  return response.data;
};

export const uploadProjectAvatarImage = async (
  projectId: string,
  file: File
): Promise<Project> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<Project>(`/projects/${projectId}/context-image/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadProjectStyleBoardImage = async (
  projectId: string,
  file: File
): Promise<Project> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<Project>(
    `/projects/${projectId}/context-image/style-board`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const createProjectScene = async (
  projectId: string,
  payload: {
    prompt: string;
    title?: string;
    summary?: string;
    script?: string;
    referenceImageUrl?: string;
    videoProviderOverride?: 'kling' | 'veo';
  }
): Promise<Scene> => {
  const response = await api.post<Scene>(`/projects/${projectId}/scenes`, payload);
  return response.data;
};

export const getProjectScene = async (projectId: string, sceneId: string): Promise<Scene> => {
  const response = await api.get<Scene>(`/projects/${projectId}/scenes/${sceneId}`);
  return response.data;
};

export const generateSceneVideo = async (
  projectId: string,
  sceneId: string,
  payload: { provider?: 'kling' | 'veo'; aspectRatio?: string }
): Promise<{ url: string }> => {
  const response = await api.post<{ url: string }>(
    `/projects/${projectId}/scenes/${sceneId}/generate`,
    payload
  );
  return response.data;
};

export interface StorySuggestion {
  title: string;
  prompt: string;
  summary?: string;
}

export const getProjectSuggestions = async (
  projectId: string
): Promise<StorySuggestion[]> => {
  const response = await api.get<{ suggestions: StorySuggestion[] }>(
    `/projects/${projectId}/suggestions`
  );
  return response.data.suggestions || [];
};

export const updateSceneFeedback = async (
  projectId: string,
  sceneId: string,
  payload: { rating?: number; flags?: string[] }
) => {
  const response = await api.patch(
    `/projects/${projectId}/scenes/${sceneId}/feedback`,
    payload
  );
  return response.data;
};

// --- Simple Video Studio API ---

export interface GenerateVideoClipParams {
  prompt: string;
  provider?: 'kling' | 'veo';
  durationSeconds?: number;
  aspectRatio?: string;
  referenceUrl?: string;
  style?: string;
}

export interface GenerateVideoClipResponse {
  url: string;
  provider: 'kling' | 'veo';
}

export interface CreateVideoJobParams {
  prompt: string;
  provider?: 'veo' | 'kling';
  fastMode?: boolean;
  durationSeconds?: number;
  aspectRatio?: string;
  referenceUrl?: string;
  referenceUrls?: string[];
  style?: string;
  ownerId?: string;
  klingRoute?: 'text2video' | 'image2video' | 'multi-image2video' | 'omni-video';
  klingMultiShot?: boolean;
  klingShotType?: 'customize' | 'intelligence';
  klingMultiPrompt?: Array<{ index: number; prompt: string; duration: string }>;
}

export interface CreateVideoJobResponse {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
}

export interface VideoJobStatusResponse {
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  provider: 'veo' | 'kling';
  providerUsed?: 'veo' | 'kling';
  fastMode?: boolean;
  resultUrl?: string;
  errorMessage?: string;
  ownerId?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ListVideoJobsResponse {
  jobs: Array<{
    jobId: string;
    status: 'succeeded';
    provider: 'veo' | 'kling';
    providerUsed?: 'veo' | 'kling';
    fastMode?: boolean;
    resultUrl: string;
    prompt?: string;
    createdAt?: string;
  }>;
}

export interface UploadVideoReferenceImageResponse {
  url: string;
  filename: string;
}

export const uploadVideoReferenceImage = async (
  file: File
): Promise<UploadVideoReferenceImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<UploadVideoReferenceImageResponse>('/video/reference-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const createVideoJob = async (
  payload: CreateVideoJobParams
): Promise<CreateVideoJobResponse> => {
  const response = await api.post<CreateVideoJobResponse>('/video/jobs', payload);
  return response.data;
};

export const getVideoJob = async (jobId: string): Promise<VideoJobStatusResponse> => {
  const response = await api.get<VideoJobStatusResponse>(`/video/jobs/${jobId}`);
  return response.data;
};

export const listVideoJobs = async (
  ownerId: string,
  limit = 50
): Promise<ListVideoJobsResponse> => {
  const response = await api.get<ListVideoJobsResponse>('/video/jobs', {
    params: { ownerId, limit },
  });
  return response.data;
};

export const generateVideoClip = async (
  payload: GenerateVideoClipParams
): Promise<GenerateVideoClipResponse> => {
  const response = await api.post<GenerateVideoClipResponse>('/video/generate', payload);
  return response.data;
};

// --- Memelord API ---

export interface MemelordMemeResult {
  success: boolean;
  url: string;
  expires_in: number;
  template_name?: string;
  template_id?: string;
}

export interface MemelordMemeResponse {
  success: boolean;
  prompt: string;
  total_generated: number;
  results: MemelordMemeResult[];
}

export interface MemelordVideoJob {
  job_id: string;
  template_name?: string;
  template_id?: string;
  caption?: string;
}

export interface MemelordVideoResponse {
  success: boolean;
  prompt: string;
  total_requested: number;
  jobs: MemelordVideoJob[];
  message?: string;
}

export interface MemelordMemeParams {
  prompt: string;
  count?: number;
  category?: 'trending' | 'classic';
  includeNsfw?: boolean;
}

export interface MemelordVideoParams {
  prompt: string;
  count?: number;
  category?: 'trending' | 'classic';
  template_id?: string;
}

export const createMemelordMeme = async (
  params: MemelordMemeParams
): Promise<MemelordMemeResponse> => {
  const response = await api.post<MemelordMemeResponse>('/memelord/meme', params);
  return response.data;
};

export const createMemelordVideo = async (
  params: MemelordVideoParams
): Promise<MemelordVideoResponse> => {
  const response = await api.post<MemelordVideoResponse>('/memelord/video', params);
  return response.data;
};

export interface MemeIdea {
  id: string;
  prompt: string;
  caption?: string;
  templateName?: string;
  templateId?: string;
  tags: string[];
  source: string;
  mediaType: string;
  url?: string;
  createdAt: string;
}

export interface GetMemelordIdeasParams {
  tag?: string;
  limit?: number;
  skip?: number;
  mediaType?: 'image' | 'video';
}

export interface GetMemelordIdeasResponse {
  ideas: MemeIdea[];
  total: number;
}

export const getMemelordIdeas = async (
  params?: GetMemelordIdeasParams
): Promise<GetMemelordIdeasResponse> => {
  const response = await api.get<GetMemelordIdeasResponse>('/memelord/ideas', {
    params: params ? {
      tag: params.tag,
      limit: params.limit,
      skip: params.skip,
      mediaType: params.mediaType,
    } : undefined,
  });
  return response.data;
};

// --- Supermeme.ai helpers (via backend /memelord routes) ---

export interface SupermemeImageRequest {
  text: string;
  count?: number;
  aspectRatio?: string;
  paddingColor?: string;
}

/** Quick, non-editable Supermeme images (captions baked into the image). */
export const createSupermemeImage = async (
  params: SupermemeImageRequest
): Promise<MemelordMemeResponse> => {
  const body: MemelordMemeParams & { aspectRatio?: string; paddingColor?: string } = {
    prompt: params.text,
    count: params.count,
  };
  if (params.aspectRatio) {
    (body as any).aspectRatio = params.aspectRatio;
  }
  if (params.paddingColor) {
    (body as any).paddingColor = params.paddingColor;
  }
  const response = await api.post<MemelordMemeResponse>('/memelord/meme', body);
  return response.data;
};

export interface SupermemeTextMeme {
  caption: string;
  image: string;
}

export interface SupermemeTextMemeResponse {
  memes: SupermemeTextMeme[];
  searchEmotion?: string;
  originalText: string;
  generatedCaptions?: string[];
  languageCode?: string;
}

/** Editable Supermeme memes: separate base image + caption text. */
export const generateSupermemeTextMemes = async (
  text: string
): Promise<SupermemeTextMemeResponse> => {
  const response = await api.post<SupermemeTextMemeResponse>('/memelord/text-meme', { text });
  return response.data;
};

export interface SupermemeMinimalistRequest {
  text: string;
  count?: number;
  aspectRatio?: string;
}

export interface SupermemeMinimalistResponse {
  images: string[];
}

/** Minimalist visual illustrations from text (comparisons, metaphors, etc.). */
export const generateSupermemeMinimalist = async (
  params: SupermemeMinimalistRequest
): Promise<SupermemeMinimalistResponse> => {
  const response = await api.post<SupermemeMinimalistResponse>('/memelord/minimalist', params);
  return response.data;
};

export interface SupermemeTemplateSearchResult {
  templates: string[];
}

/** Search Supermeme meme templates by query string. */
export const searchSupermemeTemplates = async (
  query: string
): Promise<SupermemeTemplateSearchResult> => {
  const response = await api.get<SupermemeTemplateSearchResult>('/memelord/templates/search', {
    params: { query },
  });
  return response.data;
};

/** Resolve image-studio file URL for display/download. */
export function resolveImageStudioFileUrl(url: string): string {
  if (typeof url !== 'string' || !url) return url;
  if (url.startsWith('/api/image-studio/file/')) {
    const base = getApiUrl().replace(/\/api$/, '');
    return `${base}${url}`;
  }
  return url;
}

export default api;
