/**
 * Voice-Guided Palace Walk
 * Extends the voice interface with palace navigation commands.
 */

export interface PalaceNavCommand {
  patterns: RegExp[];
  path: string;
  description: string;
}

export const PALACE_NAV_COMMANDS: PalaceNavCommand[] = [
  {
    patterns: [/coverage palace|test coverage|coverage map/i],
    path: '#/coverage-palace',
    description: 'Coverage Palace — test coverage heatmap',
  },
  {
    patterns: [/my palace|workflow palace|saved tools|pinned tools/i],
    path: '#/my-palace',
    description: 'My Palace — your personal tool collection',
  },
  {
    patterns: [/palace|tool map|qa palace/i],
    path: '#/palace',
    description: 'The QA Palace — visual tool map',
  },
  {
    patterns: [/flash ?card|spaced repetition|review cards/i],
    path: '#/flashcards',
    description: 'Flashcards — spaced repetition review',
  },
  {
    patterns: [/security|security room|security lab/i],
    path: '#/web-testing-checklist',
    description: 'Web Testing Checklist — Security Room',
  },
  {
    patterns: [/api|protocol|protocol corridor|rest client/i],
    path: '#/rest-client',
    description: 'The Protocol Corridor — REST Client',
  },
  {
    patterns: [/generator|generator lab|generator room/i],
    path: '#/uuid',
    description: 'The Generator Lab',
  },
  {
    patterns: [/ai workshop|ai tools|assistant|kobean/i],
    path: '#/kobean',
    description: 'The AI Workshop — Kobean Assistant',
  },
  {
    patterns: [/istqb|ctfl|learning|learning tower/i],
    path: '#/ctfl',
    description: 'The Learning Tower — ISTQB CTFL',
  },
  {
    patterns: [/checklist|checklist chambers|web testing/i],
    path: '#/web-testing-checklist',
    description: 'The Checklist Chambers',
  },
  {
    patterns: [/mobile testing|mobile checklist/i],
    path: '#/mobile-testing-checklist',
    description: 'Mobile Testing Checklist',
  },
  {
    patterns: [/api testing checklist/i],
    path: '#/api-testing-checklist',
    description: 'API Testing Checklist',
  },
  {
    patterns: [/home|entrance|start/i],
    path: '#/',
    description: 'Palace entrance — Home',
  },
  {
    patterns: [/agent|agent mode/i],
    path: '#/agent',
    description: 'Agent Mode',
  },
  {
    patterns: [/jwt|token|debugger/i],
    path: '#/jwtDebugger',
    description: 'JWT Debugger',
  },
  {
    patterns: [/password|password generator/i],
    path: '#/password',
    description: 'Password Generator',
  },
  {
    patterns: [/qr code|qr generator/i],
    path: '#/qr-code',
    description: 'QR Code Generator',
  },
  {
    patterns: [/kanban|task board/i],
    path: '#/kanban',
    description: 'Kanban Board',
  },
  {
    patterns: [/workflow|ci cd|pipeline/i],
    path: '#/workflow-generator',
    description: 'CI/CD Workflow Generator',
  },
  {
    patterns: [/forge|encryption|developer tools/i],
    path: '#/encryption',
    description: 'The Forge — Encryption Tool',
  },
];

/**
 * Match a transcript to a palace navigation command.
 * Returns the matched command or null.
 */
export function matchPalaceCommand(transcript: string): PalaceNavCommand | null {
  // Accept commands like "take me to X", "navigate to X", "go to X", "what's in X", "open X"
  const cleaned = transcript.toLowerCase().trim();
  for (const cmd of PALACE_NAV_COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(cleaned)) {
        return cmd;
      }
    }
  }
  return null;
}

/**
 * Check if a transcript is a palace navigation intent.
 */
export function isPalaceNavigationIntent(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  return (
    /take me to|navigate to|go to|open|show me|what'?s in|enter the|walk to/.test(lower) ||
    /take me to|navigate to|go to|open|show me|enter the|walk to/.test(lower)
  );
}
