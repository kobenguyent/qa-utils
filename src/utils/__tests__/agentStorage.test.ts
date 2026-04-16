import { describe, it, expect, beforeEach } from 'vitest';
import { getProfiles, saveProfile, deleteProfile, createProfile, getRuns, saveRun, createRun, type AgentProfile, type AgentRun } from '../agentStorage';

// We need to mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const PROFILE_BASE: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Test Agent',
  description: 'A test agent',
  provider: 'ollama',
  endpoint: 'http://localhost:11434',
  model: 'llama2',
  maxIterations: 10,
  temperature: 0.3,
};

describe('agentStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getProfiles', () => {
    it('returns empty array when nothing stored', () => {
      expect(getProfiles()).toEqual([]);
    });

    it('returns [] when localStorage has invalid JSON', () => {
      localStorage.setItem('agentManager_profiles', 'invalid-json{');
      expect(getProfiles()).toEqual([]);
    });
  });

  describe('createProfile', () => {
    it('creates a profile with id, createdAt, updatedAt', () => {
      const profile = createProfile(PROFILE_BASE);
      expect(profile.id).toBeTruthy();
      expect(profile.name).toBe('Test Agent');
      expect(profile.createdAt).toBeTypeOf('number');
      expect(profile.updatedAt).toBeTypeOf('number');
    });

    it('stores the profile in localStorage', () => {
      createProfile(PROFILE_BASE);
      expect(getProfiles()).toHaveLength(1);
    });

    it('can create multiple profiles', () => {
      createProfile(PROFILE_BASE);
      createProfile({ ...PROFILE_BASE, name: 'Second Agent' });
      expect(getProfiles()).toHaveLength(2);
    });
  });

  describe('saveProfile', () => {
    it('updates an existing profile', () => {
      const profile = createProfile(PROFILE_BASE);
      saveProfile({ ...profile, name: 'Updated Name' });
      const profiles = getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('Updated Name');
    });

    it('adds a new profile when id does not exist', () => {
      createProfile(PROFILE_BASE);
      saveProfile({ ...PROFILE_BASE, id: 'new-id', name: 'Another', createdAt: Date.now(), updatedAt: Date.now() });
      expect(getProfiles()).toHaveLength(2);
    });
  });

  describe('deleteProfile', () => {
    it('removes a profile by id', () => {
      const p1 = createProfile(PROFILE_BASE);
      const p2 = createProfile({ ...PROFILE_BASE, name: 'Second' });
      deleteProfile(p1.id);
      const profiles = getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(p2.id);
    });

    it('does nothing when id not found', () => {
      createProfile(PROFILE_BASE);
      deleteProfile('nonexistent-id');
      expect(getProfiles()).toHaveLength(1);
    });

    it('also removes runs for the deleted profile', () => {
      const profile = createProfile(PROFILE_BASE);
      createRun({ profileId: profile.id, task: 'test', result: 'success', answer: 'ok', iterationCount: 1, timestamp: Date.now() });
      deleteProfile(profile.id);
      expect(getRuns(profile.id)).toEqual([]);
    });
  });

  describe('getRuns / saveRun / createRun', () => {
    it('returns empty array when no runs', () => {
      expect(getRuns('unknown-id')).toEqual([]);
    });

    it('saves and retrieves runs', () => {
      const profile = createProfile(PROFILE_BASE);
      createRun({ profileId: profile.id, task: 'test task', result: 'success', answer: 'done', iterationCount: 3, timestamp: Date.now() });
      const runs = getRuns(profile.id);
      expect(runs).toHaveLength(1);
      expect(runs[0].task).toBe('test task');
      expect(runs[0].result).toBe('success');
    });

    it('stores runs newest first (prepend)', () => {
      const profile = createProfile(PROFILE_BASE);
      createRun({ profileId: profile.id, task: 'first', result: 'success', answer: 'a', iterationCount: 1, timestamp: 1000 });
      createRun({ profileId: profile.id, task: 'second', result: 'success', answer: 'b', iterationCount: 1, timestamp: 2000 });
      const runs = getRuns(profile.id);
      expect(runs[0].task).toBe('second');
      expect(runs[1].task).toBe('first');
    });

    it('limits stored runs to 10', () => {
      const profile = createProfile(PROFILE_BASE);
      for (let i = 0; i < 15; i++) {
        createRun({ profileId: profile.id, task: `task ${i}`, result: 'success', answer: '', iterationCount: 1, timestamp: i });
      }
      expect(getRuns(profile.id)).toHaveLength(10);
    });

    it('saveRun with explicit run object', () => {
      const run: AgentRun = { id: 'run-1', profileId: 'profile-1', task: 'x', result: 'error', answer: '', iterationCount: 0, timestamp: Date.now() };
      saveRun(run);
      const runs = getRuns('profile-1');
      expect(runs[0].id).toBe('run-1');
    });
  });
});
