'use client';

import React, { useState, useEffect } from 'react';
import { useEvmWallet } from './WalletProvider';
import { useVoiceCompanion } from './VoiceCompanion';
import { VoiceVisualization } from './VoiceVisualization';
import { VisualizationMode } from './VisualizationToggle';
import { ConversationTranscript } from './ConversationTranscript';
import { TextChatDrawer } from './TextChatDrawer';
import { SettingsDrawer } from './SettingsDrawer';
import { WalletButton } from './WalletButton';
import {
  Mic,
  Square,
  Loader2,
  Radio,
  MessageCircle,
  Settings,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { VoiceOption } from './VoiceSelectorDropdown';
import { ModelOption } from './ModelSelectorDropdown';

export const CompanionInterface: React.FC = () => {
  const { isConnected: walletConnected, address } = useEvmWallet();
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('character');
  const [isTextChatOpen, setIsTextChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Ara');
  const [selectedModel, setSelectedModel] = useState<ModelOption>('grok-4-1-fast-non-reasoning');
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Handle drawer query params from mobile nav
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const drawer = params.get('drawer');
    if (drawer === 'chat') setIsTextChatOpen(true);
    if (drawer === 'settings') setIsSettingsOpen(true);
  }, []);

  // Persist preferences
  useEffect(() => {
    const savedMode = localStorage.getItem('visualizationMode') as VisualizationMode;
    if (savedMode === 'character' || savedMode === 'waves') setVisualizationMode(savedMode);
    const savedVoice = localStorage.getItem('selectedVoice') as VoiceOption;
    if (savedVoice && ['Ara', 'Rex', 'Sal', 'Eve', 'Leo'].includes(savedVoice)) setSelectedVoice(savedVoice);
    const savedModel = localStorage.getItem('selectedModel') as ModelOption;
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  useEffect(() => { localStorage.setItem('visualizationMode', visualizationMode); }, [visualizationMode]);
  useEffect(() => { localStorage.setItem('selectedVoice', selectedVoice); }, [selectedVoice]);
  useEffect(() => { localStorage.setItem('selectedModel', selectedModel); }, [selectedModel]);

  const {
    state,
    transcripts,
    startSession,
    closeSession,
    startListening,
    stopListening,
    isConnected,
    audioLevel,
    frequencyData,
  } = useVoiceCompanion({
    voice: selectedVoice,
    model: selectedModel,
    onStateChange: (newState) => {
      if (newState === 'listening') { setIsListening(true); setErrorMessage(null); }
      else if (newState === 'idle') { setIsListening(false); setErrorMessage(null); }
      else if (newState === 'error') setIsListening(false);
    },
    onTranscript: () => {},
    onError: (error) => {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const handleVoiceToggle = async () => {
    if (!walletConnected || !address) return;
    if (!isConnected) {
      setErrorMessage(null);
      try { await startSession(); } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to start voice session');
      }
    } else if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasTranscript = transcripts.length > 0;

  // ── Mic button label/icon
  const micLabel = (() => {
    if (state === 'connecting') return { icon: <Loader2 className="animate-spin" style={{ width: 22, height: 22 }} />, text: 'Connecting' };
    if (isListening) return { icon: <Square style={{ width: 20, height: 20 }} />, text: 'Stop' };
    if (state === 'processing') return { icon: <Loader2 className="animate-spin" style={{ width: 22, height: 22 }} />, text: 'Processing' };
    if (state === 'speaking') return { icon: <Radio className="animate-pulse" style={{ width: 20, height: 20 }} />, text: 'Speaking' };
    if (state === 'error') return { icon: <Mic style={{ width: 20, height: 20 }} />, text: 'Try again' };
    if (isConnected) return { icon: <Mic style={{ width: 20, height: 20 }} />, text: 'Talk' };
    return { icon: <Mic style={{ width: 20, height: 20 }} />, text: 'Start' };
  })();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
        minHeight: 0,
      }}
    >
      {/* ── Full-canvas orb stage ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '2rem 1.5rem 0',
        }}
      >
        {/* Ambient glow behind orb */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background:
              state === 'speaking'
                ? 'radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 70%)'
                : state === 'listening'
                ? 'radial-gradient(circle, rgba(0,200,255,0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(0,229,160,0.05) 0%, transparent 70%)',
            transition: 'background 800ms ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Orb */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <VoiceVisualization
            mode={visualizationMode}
            state={state}
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            characterImageUrl="/companioni.jpg"
          />
        </div>

        {/* State label */}
        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color:
              state === 'error'
                ? 'var(--color-error)'
                : state === 'idle'
                ? 'var(--text-secondary)'
                : 'var(--accent-primary)',
            transition: 'color 400ms ease',
          }}
        >
          {state === 'idle' && (walletConnected ? 'Ready' : 'Connect wallet to begin')}
          {state === 'connecting' && 'Connecting...'}
          {state === 'listening' && 'Listening'}
          {state === 'processing' && 'Thinking...'}
          {state === 'speaking' && 'Speaking'}
          {state === 'error' && 'Something went wrong'}
        </p>

        {/* Error toast */}
        {errorMessage && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.625rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: '13px',
              color: '#f87171',
              maxWidth: '360px',
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Transcript pull-up tab — only visible once conversation started */}
        {hasTranscript && (
          <button
            type="button"
            onClick={() => setTranscriptOpen((v) => !v)}
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            {transcriptOpen ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronUp style={{ width: 13, height: 13 }} />}
            {transcriptOpen ? 'Hide transcript' : `Transcript (${transcripts.length})`}
          </button>
        )}
      </div>

      {/* ── Transcript slide-up panel ─────────────────────────────── */}
      {transcriptOpen && hasTranscript && (
        <div
          style={{
            height: '260px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ConversationTranscript transcripts={transcripts} />
        </div>
      )}

      {/* ── Floating control bar ──────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border-opacity-10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'rgba(2,6,23,0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Settings */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
        >
          <Settings style={{ width: 17, height: 17 }} />
        </button>

        {/* Primary mic / action button */}
        {walletConnected && address ? (
          <>
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={state === 'connecting' || state === 'error'}
              aria-label={micLabel.text}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                border: 'none',
                background:
                  isListening
                    ? 'rgba(239,68,68,0.9)'
                    : state === 'speaking' || state === 'processing'
                    ? 'rgba(0,229,160,0.15)'
                    : 'var(--accent-primary)',
                color: isListening || (state !== 'speaking' && state !== 'processing') ? '#020617' : 'var(--accent-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                cursor: state === 'connecting' ? 'wait' : 'pointer',
                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                boxShadow:
                  isListening
                    ? '0 0 0 6px rgba(239,68,68,0.2)'
                    : '0 0 0 1px rgba(0,229,160,0.2), 0 4px 20px rgba(0,229,160,0.25)',
                flexShrink: 0,
                opacity: state === 'error' ? 0.5 : 1,
              }}
            >
              {micLabel.icon}
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                {micLabel.text}
              </span>
            </button>

            {/* Text chat toggle */}
            <button
              type="button"
              onClick={() => setIsTextChatOpen(true)}
              aria-label="Text chat"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <MessageCircle style={{ width: 17, height: 17 }} />
            </button>
          </>
        ) : (
          <>
            {/* Wallet connect prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <WalletButton />
              <button
                type="button"
                onClick={() => setIsTextChatOpen(true)}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                <MessageCircle style={{ width: 13, height: 13 }} />
                Try text chat instead
              </button>
            </div>
            {/* Placeholder right icon to keep symmetry */}
            <div style={{ width: 44, height: 44, flexShrink: 0 }} />
          </>
        )}
      </div>

      {/* ── Drawers ───────────────────────────────────────────────── */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        visualizationMode={visualizationMode}
        onVisualizationModeChange={setVisualizationMode}
        isSessionActive={isConnected}
      />
      <TextChatDrawer isOpen={isTextChatOpen} onClose={() => setIsTextChatOpen(false)} />
    </div>
  );
};
