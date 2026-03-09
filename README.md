# Likable - AI Trading Companion Platform

Likable is a Web3-native **AI trading companion** platform where users pay for AI services using a BNB Smart Chain (BSC) BEP-20 token. It features dynamic USD-based pricing and MetaMask wallet support.

## 🌟 Features

- **Voice-First Companion**: Primary interface is a voice AI companion with real-time WebSocket audio streaming
- **Dual Visualization Modes**: Toggle between animated character avatar or responsive audio waveform visualization
- **Token-Gated AI Services**: Pay for chat and voice AI using BSC BEP-20 tokens
- **Dynamic Pricing**: USD-based pricing that converts to tokens (CoinGecko or fallback)
- **MetaMask Wallet Support**: Connect via MetaMask on BNB Smart Chain
- **Real-Time Balance**: Live token balance and usage tracking
- **Text Chat (Secondary)**: Text chat available as a slide-out drawer for convenience
- **Transparent Economics**: Public burn stats and treasury visibility

- **Pricing**:
  - Chat: $0.02 per request (text-based)
  - Voice: $0.10 per 3-minute session (Grok Voice Agent)
  - Dynamic conversion based on market price

- **Burn Mechanism**:
  - 50% of usage tokens burned
  - 50% to treasury
  - Batch settlement for efficiency

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MongoDB
- MetaMask wallet (configured for BNB Smart Chain)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo>
cd "Likable-frontend"
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
pnpm install
```

3. **Configure environment variables**

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed1.binance.org
NEXT_PUBLIC_BSC_CHAIN_ID=56
```

Backend: set `BSC_RPC_URL`, `TOKEN_CONTRACT_ADDRESS`, `TREASURY_WALLET_ADDRESS`. See `memelab-backend/.env.example`.

4. **Run the application**

```bash
# Frontend
cd frontend
pnpm dev
```

Visit `http://localhost:3000`

## 🏗️ Architecture

### Frontend
- **Next.js 16** with App Router
- **ethers + MetaMask** for BSC wallet connections
- **Tailwind CSS** for styling
- **WebSocket** for real-time voice streaming
- **React Hooks** for state management

### UI Design Philosophy

- **Voice-First**: Voice interaction is the primary and default interface
- **Companion Experience**: Intimate, personal, always-available companion feel
- **Text as Add-On**: Text chat available but secondary (drawer/sidebar)
- **Professional Design**: Clean, modern, polished UI with attention to detail
- **Minimal Distractions**: Focus on the conversation, not UI chrome

## 🔑 Key Components

### Main Interface Components

- **`CompanionInterface.tsx`** - Main voice-first interface component
  - Central voice visualization (character or waves)
  - Voice control button
  - Real-time conversation transcript
  - Header with token balance and controls

- **`VoiceCompanion.tsx`** - Custom hook for voice WebSocket management
  - WebSocket connection handling
  - Audio streaming (send/receive)
  - Real-time transcript tracking
  - Audio level detection for visualization
  - Session lifecycle management

- **`VoiceVisualization.tsx`** - Container component with toggle
  - Switches between character and wave modes
  - Smooth transitions
  - State-based animations

### Visualization Components

- **`CharacterAvatar.tsx`** - Animated character visualization
  - State-based expressions (idle, listening, processing, speaking, error)
  - Placeholder image support (replaceable)
  - Smooth animations and transitions
  - Visual feedback indicators

- **`AudioWaveform.tsx`** - Responsive audio wave visualization
  - Real-time waveform that reacts to audio levels
  - State-based patterns (idle, listening, processing, speaking, error)
  - Smooth animations and color gradients

- **`VisualizationToggle.tsx`** - Toggle button for switching modes
  - Character/Waves mode switcher
  - Preference saved to localStorage

### Supporting Components

- **`ConversationTranscript.tsx`** - Real-time transcript display
  - Scrollable conversation history
  - User/assistant message distinction
  - Timestamp display

- **`TextChatDrawer.tsx`** - Secondary text chat interface
  - Slide-out drawer design
  - Conversation history
  - Message input with send button
  - Can be completely hidden

- **`TokenBalance.tsx`** - Minimal header balance display
  - Compact design for header integration
  - Real-time balance updates
  - USD value conversion

- **`WalletButton.tsx`** - Wallet connection button
- **`WalletProvider.tsx`** - Solana wallet adapter setup

## 🎨 UI Features

### Voice Visualization Modes

**Character Mode:**
- Animated character avatar in the center
- Character expressions change based on state
- Subtle animations (breathing, blinking, gestures)
- Placeholder image that can be replaced with custom character
- More personal, companion-like feel

**Waves Mode:**
- Dynamic waveform visualization that responds to voice input/output
- Smooth wave animations that react to audio levels
- Color gradients that pulse with voice activity
- Modern, abstract aesthetic
- More technical, futuristic feel

**Toggle Control:**
- Settings button/icon in header or near voice visualization
- Smooth transition animation when switching modes
- User preference saved to localStorage
- Default to Character mode (more companion-like)

### Voice States

1. **Idle**: 
   - Character: Subtle breathing animation, ready to interact
   - Waves: Gentle pulsing, low amplitude

2. **Listening**: 
   - Character: Leaning forward, attentive pose, microphone indicator
   - Waves: Pulses inward, active visualization

3. **Processing**: 
   - Character: Thinking pose, gentle animation
   - Waves: Processing pattern, mid-level activity

4. **Speaking**: 
   - Character: Speaking animation, mouth movement
   - Waves: Pulses outward, high amplitude, reactive to audio

5. **Error**: 
   - Character: Error expression, red tint
   - Waves: Red pulse, error pattern

## 📊 API Integration

### Voice API (Primary)

**Create Voice Session:**
```typescript
POST /api/voice/session
{
  "walletAddress": "string",
  "userId": "string (optional)",
  "voice": "Ara" | "Rex" | "Sal" | "Eve" | "Leo",
  "model": "string (optional)",
  "systemInstructions": "string (optional)",
  "temperature": "number (optional)"
}
```

**Response:**
```json
{
  "sessionId": "grok-voice-1234567890-abc123",
  "message": "Voice session created. Connect via WebSocket",
  "wsUrl": "/api/voice/ws/grok-voice-1234567890-abc123",
  "maxDuration": 180,
  "estimatedCost": 0.10
}
```

**WebSocket Connection:**
- Connect to: `ws://your-domain/api/voice/ws/:sessionId`
- Send audio: `{"type": "audio", "data": "base64-encoded-audio"}`
- Send text: `{"type": "text", "text": "your text"}`
- Receive audio: `{"type": "audio", "data": "base64-encoded-audio"}`
- Receive transcript: `{"type": "transcript", "text": "transcribed text"}`
- Receive response done: `{"type": "response_done"}`

**Get Voice Cost:**
```typescript
GET /api/voice/cost
```

### Chat API (Secondary)

**Send Chat Message:**
```typescript
POST /api/chat/message
{
  "message": "string",
  "walletAddress": "string",
  "userTier": "free" | "paid",
  "conversationHistory": [{"role": "user" | "assistant", "content": "string"}],
  "userId": "string (optional)"
}
```

**Get Chat Cost:**
```typescript
GET /api/chat/cost?userTier=free|paid
```

### Token API

**Get Token Balance:**
```typescript
GET /api/token/balance/:walletAddress
```

**Get Token Price:**
```typescript
GET /api/token/price
```

## 🎯 Usage Flow

### Voice Companion Flow

1. **Connect Wallet**: User connects Solana wallet
2. **Start Voice Session**: Click "Connect Voice" button
3. **Grant Microphone Permission**: Browser requests microphone access
4. **Session Created**: Backend creates Grok Voice Agent session
5. **WebSocket Connected**: Real-time bidirectional audio streaming
6. **Start Talking**: Click "Start Talking" to begin recording
7. **Real-Time Processing**: 
   - Audio sent to backend via WebSocket
   - Grok Voice Agent processes (STT, LLM, TTS)
   - Audio response streamed back
   - Transcripts displayed in real-time
8. **Stop Listening**: Click "Stop Listening" when done
9. **Session Ends**: Tokens deducted, session closed

### Text Chat Flow (Secondary)

1. **Open Drawer**: Click message icon in header
2. **Type Message**: Enter text in input field
3. **Send**: Message sent with conversation history
4. **Receive Response**: AI response displayed
5. **Close Drawer**: Click X or outside drawer to close

## 🛠️ Development

### Component Structure

```
frontend/src/
├── components/
│   ├── CompanionInterface.tsx    [Main voice-first interface]
│   ├── VoiceCompanion.tsx         [Voice WebSocket hook]
│   ├── VoiceVisualization.tsx     [Container with toggle]
│   ├── CharacterAvatar.tsx        [Character visualization]
│   ├── AudioWaveform.tsx          [Wave visualization]
│   ├── VisualizationToggle.tsx    [Mode toggle button]
│   ├── ConversationTranscript.tsx [Real-time transcript]
│   ├── TextChatDrawer.tsx         [Secondary text chat]
│   ├── TokenBalance.tsx           [Header balance display]
│   ├── WalletButton.tsx           [Wallet connection]
│   └── WalletProvider.tsx         [Wallet adapter setup]
├── app/
│   ├── page.tsx                   [Main page - uses CompanionInterface]
│   └── layout.tsx                 [Root layout]
└── lib/
    └── api.ts                     [API client with all endpoints]
```

### Customization

**Replace Character Image:**
- Place your character image in `/public/placeholder-character.png`
- Or update the `imageUrl` prop in `CharacterAvatar.tsx`

**Styling:**
- Uses CSS variables defined in `globals.css`
- Supports light/dark mode via `data-theme` attribute
- Glassmorphism effects throughout
- Smooth animations and transitions

**Visualization Mode:**
- Default: Character mode
- Toggle saved to localStorage
- Smooth transitions between modes

## ⚠️ Important Notes

1. **Voice Service**: Requires Grok Voice Agent API key configured in backend
2. **WebSocket**: Real-time voice streaming requires WebSocket support
3. **Microphone**: Browser will request microphone permission
4. **Token Balance**: Must have sufficient tokens for voice sessions
5. **Session Duration**: Voice sessions limited to 3 minutes
6. **Placeholder Images**: Replace placeholder character image with your own

## 🎨 Recent UI Improvements

### UI Alignment Fixes (Latest Update)
- **Consistent Icon Alignment**: All icons now properly centered using flexbox (`flex items-center justify-center`)
- **Text Alignment**: Fixed text baseline alignment issues across all components
- **Button Alignment**: Voice control buttons and all interactive elements now have proper icon-text alignment
- **Header Components**: Token balance, message button, and wallet button are vertically aligned
- **Message Bubbles**: Avatar icons align with the first line of text in conversation transcripts
- **Form Elements**: Input fields and buttons are vertically aligned in all forms
- **Navigation Items**: Sidebar navigation icons and text are consistently spaced and aligned
- **Error Messages**: User-friendly error display with auto-dismiss functionality

### Error Handling Improvements
- **Voice Service Errors**: Clear error messages when voice service is not configured (503 errors)
- **MongoDB Graceful Degradation**: Application continues to function with default values when MongoDB is unavailable
- **User-Visible Errors**: Error messages displayed in UI with auto-clear functionality
- **Error Recovery**: Errors automatically clear when user retries or successfully connects

### Backend Resilience
- **MongoDB Connection Handling**: Graceful fallback to default values when database is unavailable
- **No Timeouts**: Balance requests return immediately with default values instead of 10-second timeouts
- **Error Messages**: Clear, actionable error messages for all failure scenarios

## 🔐 Security Features

- **TWAP Pricing**: Prevents flash pump/dump exploitation
- **Burn Floor/Ceiling**: Limits extreme price volatility impact
- **Rate Limiting**: Prevents infrastructure abuse
- **No Custody**: Users maintain full control of tokens
- **Transparent Settlement**: All burns are publicly verifiable
- **Wallet Verification**: All requests require wallet authentication

## 📱 Responsive Design

- **Mobile**: Full-screen voice circle, transcript below
- **Tablet**: Larger circle, optimized spacing
- **Desktop**: Optimal spacing, enhanced visual effects
- **Touch-Friendly**: All controls meet minimum touch target sizes

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Jupiter Aggregator](https://jup.ag/)
- [Raydium DEX](https://raydium.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
