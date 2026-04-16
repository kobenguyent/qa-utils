/**
 * Agent Storage — Persistent storage for Agent Manager
 *
 * Stores named AgentProfile objects and their run history in localStorage.
 */

const PROFILES_KEY = 'agentManager_profiles';
const RUNS_KEY_PREFIX = 'agentManager_runs_';
const MAX_RUNS_PER_PROFILE = 10;

export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'google' | 'azure-openai';

export interface AgentProfile {
  id: string;
  name: string;
  description: string;
  provider: AIProvider;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  maxIterations: number;
  temperature: number;
  systemPromptOverride?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentRun {
  id: string;
  profileId: string;
  task: string;
  result: 'success' | 'error';
  answer: string;
  iterationCount: number;
  timestamp: number;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getProfiles(): AgentProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgentProfile[];
  } catch {
    return [];
  }
}

export function saveProfile(profile: AgentProfile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = { ...profile, updatedAt: Date.now() };
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  // clean up runs
  localStorage.removeItem(RUNS_KEY_PREFIX + id);
}

export function createProfile(partial: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>): AgentProfile {
  const now = Date.now();
  const profile: AgentProfile = { ...partial, id: uid(), createdAt: now, updatedAt: now };
  saveProfile(profile);
  return profile;
}

export function getRuns(profileId: string): AgentRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY_PREFIX + profileId);
    if (!raw) return [];
    return JSON.parse(raw) as AgentRun[];
  } catch {
    return [];
  }
}

export function saveRun(run: AgentRun): void {
  const runs = getRuns(run.profileId);
  runs.unshift(run);
  const trimmed = runs.slice(0, MAX_RUNS_PER_PROFILE);
  localStorage.setItem(RUNS_KEY_PREFIX + run.profileId, JSON.stringify(trimmed));
}

export function createRun(partial: Omit<AgentRun, 'id'>): AgentRun {
  const run: AgentRun = { ...partial, id: uid() };
  saveRun(run);
  return run;
}
