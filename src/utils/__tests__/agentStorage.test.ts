import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfiles, saveProfile, deleteProfile, createProfile, getRuns, saveRun, createRun,
  getPipelines, savePipeline, deletePipeline, createPipeline, getPipelineRuns, createPipelineRun,
  type AgentProfile, type AgentRun, type AgentPipeline, type PipelineRun,
} from '../agentStorage';

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
  role: 'custom',
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
      expect(profile.role).toBe('custom');
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

    it('stores specialty when provided', () => {
      const profile = createProfile({ ...PROFILE_BASE, role: 'researcher', specialty: 'Searches the web' });
      expect(profile.specialty).toBe('Searches the web');
      expect(profile.role).toBe('researcher');
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

  // ── Pipeline tests ──────────────────────────────────────────────────────────

  const PIPELINE_BASE: Omit<AgentPipeline, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Test Pipeline',
    description: 'A test pipeline',
    mode: 'sequential',
    agents: [{ profileId: 'p1', order: 0 }, { profileId: 'p2', order: 1 }],
  };

  describe('getPipelines', () => {
    it('returns empty array when nothing stored', () => {
      expect(getPipelines()).toEqual([]);
    });

    it('returns [] on invalid JSON', () => {
      localStorage.setItem('agentManager_pipelines', '{bad');
      expect(getPipelines()).toEqual([]);
    });
  });

  describe('createPipeline', () => {
    it('creates pipeline with generated id and timestamps', () => {
      const pipeline = createPipeline(PIPELINE_BASE);
      expect(pipeline.id).toBeTruthy();
      expect(pipeline.name).toBe('Test Pipeline');
      expect(pipeline.mode).toBe('sequential');
      expect(pipeline.agents).toHaveLength(2);
      expect(pipeline.createdAt).toBeTypeOf('number');
    });

    it('stores pipeline in localStorage', () => {
      createPipeline(PIPELINE_BASE);
      expect(getPipelines()).toHaveLength(1);
    });

    it('creates orchestrated pipeline with orchestratorId', () => {
      const pipeline = createPipeline({ ...PIPELINE_BASE, mode: 'orchestrated', orchestratorId: 'orch-id' });
      expect(pipeline.mode).toBe('orchestrated');
      expect(pipeline.orchestratorId).toBe('orch-id');
    });
  });

  describe('savePipeline', () => {
    it('updates existing pipeline', () => {
      const pipeline = createPipeline(PIPELINE_BASE);
      savePipeline({ ...pipeline, name: 'Updated Pipeline' });
      expect(getPipelines()[0].name).toBe('Updated Pipeline');
      expect(getPipelines()).toHaveLength(1);
    });
  });

  describe('deletePipeline', () => {
    it('removes pipeline and its run history', () => {
      const pipeline = createPipeline(PIPELINE_BASE);
      createPipelineRun({
        pipelineId: pipeline.id, task: 'complex task', result: 'success',
        summary: 'done', agentResults: [], totalDuration: 1000, timestamp: Date.now(),
      });
      deletePipeline(pipeline.id);
      expect(getPipelines()).toHaveLength(0);
      expect(getPipelineRuns(pipeline.id)).toHaveLength(0);
    });
  });

  describe('getPipelineRuns / createPipelineRun', () => {
    it('returns empty array when no runs', () => {
      expect(getPipelineRuns('unknown')).toEqual([]);
    });

    it('stores pipeline runs newest first', () => {
      const pipeline = createPipeline(PIPELINE_BASE);
      createPipelineRun({ pipelineId: pipeline.id, task: 'first', result: 'success', summary: 's1', agentResults: [], totalDuration: 100, timestamp: 1000 });
      createPipelineRun({ pipelineId: pipeline.id, task: 'second', result: 'success', summary: 's2', agentResults: [], totalDuration: 200, timestamp: 2000 });
      const runs = getPipelineRuns(pipeline.id);
      expect(runs[0].task).toBe('second');
      expect(runs[1].task).toBe('first');
    });

    it('limits stored pipeline runs to 10', () => {
      const pipeline = createPipeline(PIPELINE_BASE);
      for (let i = 0; i < 15; i++) {
        createPipelineRun({ pipelineId: pipeline.id, task: `t${i}`, result: 'success', summary: '', agentResults: [], totalDuration: 0, timestamp: i });
      }
      expect(getPipelineRuns(pipeline.id)).toHaveLength(10);
    });

    it('stores partial result status', () => {
      const pipeline = createPipeline(PIPELINE_BASE);
      const run: PipelineRun = {
        id: 'pr-1', pipelineId: pipeline.id, task: 'test', result: 'partial',
        summary: 'partial done', agentResults: [], totalDuration: 500, timestamp: Date.now(),
      };
      createPipelineRun(run);
      expect(getPipelineRuns(pipeline.id)[0].result).toBe('partial');
    });
  });
});
