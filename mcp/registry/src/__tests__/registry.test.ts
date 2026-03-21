import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDatabase, closeDatabase } from '../db.js';
import { registryLookup } from '../tools/lookup.js';
import { registryUpdate } from '../tools/update.js';
import { registryHistory } from '../tools/history.js';
import { registrySearch } from '../tools/search.js';
import { registryDomainSummary } from '../tools/domain-summary.js';

describe('registry', () => {
  beforeEach(async () => {
    await openDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('lookup + update', () => {
    it('returns null for non-existent entity', () => {
      const result = registryLookup('service', 'NonExistent');
      expect(result).toBeNull();
    });

    it('creates a new entity', () => {
      const result = registryUpdate('service', 'AuthService', {
        path: 'src/auth/auth.service.ts',
        purpose: 'JWT authentication',
        domain: 'api',
        dependencies: ['TokenService', 'UserRepository'],
        decisions: ['JWT over session tokens for stateless scaling'],
      }, 'TASK-001');

      expect(result.name).toBe('AuthService');
      expect(result.entity_type).toBe('service');
      expect(result.purpose).toBe('JWT authentication');
      expect(result.domain).toBe('api');
      expect(result.dependencies).toEqual(['TokenService', 'UserRepository']);
      expect(result.decisions).toEqual(['JWT over session tokens for stateless scaling']);
      expect(result.is_current).toBe(1);
      expect(result.last_task_id).toBe('TASK-001');
    });

    it('looks up a created entity', () => {
      registryUpdate('service', 'AuthService', {
        purpose: 'Authentication',
        domain: 'api',
      }, 'TASK-001');

      const found = registryLookup('service', 'AuthService');
      expect(found).not.toBeNull();
      expect(found!.purpose).toBe('Authentication');
    });
  });

  describe('SCD2 versioning', () => {
    it('creates new version on update, closes old', () => {
      registryUpdate('service', 'AuthService', {
        purpose: 'Session auth',
        domain: 'api',
      }, 'TASK-001');

      registryUpdate('service', 'AuthService', {
        purpose: 'JWT auth',
        decisions: ['Migrated from session to JWT'],
      }, 'TASK-002');

      const current = registryLookup('service', 'AuthService');
      expect(current!.purpose).toBe('JWT auth');
      expect(current!.last_task_id).toBe('TASK-002');
      expect(current!.domain).toBe('api'); // preserved from v1
    });

    it('preserves full history', () => {
      registryUpdate('service', 'AuthService', { purpose: 'v1' }, 'T1');
      registryUpdate('service', 'AuthService', { purpose: 'v2' }, 'T2');
      registryUpdate('service', 'AuthService', { purpose: 'v3' }, 'T3');

      const history = registryHistory('service', 'AuthService');
      expect(history).toHaveLength(3);
      expect(history[0].purpose).toBe('v3'); // most recent first
      expect(history[0].is_current).toBe(1);
      expect(history[1].purpose).toBe('v2');
      expect(history[1].is_current).toBe(0);
      expect(history[1].valid_to).not.toBeNull();
      expect(history[2].purpose).toBe('v1');
      expect(history[2].is_current).toBe(0);
    });
  });

  describe('search', () => {
    it('finds entities by purpose text', () => {
      registryUpdate('service', 'AuthService', { purpose: 'JWT authentication and token refresh', domain: 'api' }, 'T1');
      registryUpdate('service', 'UserService', { purpose: 'User profile management', domain: 'api' }, 'T2');
      registryUpdate('component', 'LoginForm', { purpose: 'User authentication UI', domain: 'ui' }, 'T3');

      const results = registrySearch('authentication');
      expect(results.length).toBeGreaterThanOrEqual(2);
      const names = results.map(r => r.name);
      expect(names).toContain('AuthService');
      expect(names).toContain('LoginForm');
    });

    it('filters by entity type', () => {
      registryUpdate('service', 'AuthService', { purpose: 'Auth service', domain: 'api' }, 'T1');
      registryUpdate('component', 'AuthForm', { purpose: 'Auth component', domain: 'ui' }, 'T2');

      const results = registrySearch('auth', 'service');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('AuthService');
    });
  });

  describe('domain summary', () => {
    it('lists all current entities in a domain', () => {
      registryUpdate('service', 'AuthService', { domain: 'api' }, 'T1');
      registryUpdate('endpoint', 'POST /login', { domain: 'api' }, 'T2');
      registryUpdate('component', 'LoginForm', { domain: 'ui' }, 'T3');

      const apiEntities = registryDomainSummary('api');
      expect(apiEntities).toHaveLength(2);
      expect(apiEntities.map(e => e.name).sort()).toEqual(['AuthService', 'POST /login']);

      const uiEntities = registryDomainSummary('ui');
      expect(uiEntities).toHaveLength(1);
      expect(uiEntities[0].name).toBe('LoginForm');
    });

    it('excludes old SCD2 versions', () => {
      registryUpdate('service', 'AuthService', { purpose: 'v1', domain: 'api' }, 'T1');
      registryUpdate('service', 'AuthService', { purpose: 'v2', domain: 'api' }, 'T2');

      const entities = registryDomainSummary('api');
      expect(entities).toHaveLength(1);
      expect(entities[0].purpose).toBe('v2');
    });
  });
});
