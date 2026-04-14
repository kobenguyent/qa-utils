import { describe, it, expect } from 'vitest';
import { generateSql, SQL_OPERATIONS } from '../lib/tools.js';

describe('generateSql', () => {
  describe('SELECT', () => {
    it('generates a basic SELECT *', () => {
      expect(generateSql({ operation: 'SELECT', tableName: 'users' })).toBe(
        'SELECT * FROM users;',
      );
    });

    it('selects specific columns', () => {
      expect(
        generateSql({ operation: 'SELECT', tableName: 'users', columns: ['id', 'name'] }),
      ).toBe('SELECT id, name FROM users;');
    });

    it('adds a WHERE clause', () => {
      expect(
        generateSql({ operation: 'SELECT', tableName: 'users', whereClause: 'age > 18' }),
      ).toBe('SELECT * FROM users WHERE age > 18;');
    });

    it('adds ORDER BY and LIMIT', () => {
      expect(
        generateSql({
          operation: 'SELECT',
          tableName: 'orders',
          orderBy: 'created_at',
          limit: 10,
        }),
      ).toBe('SELECT * FROM orders ORDER BY created_at LIMIT 10;');
    });
  });

  describe('INSERT', () => {
    it('generates an INSERT statement', () => {
      const sql = generateSql({
        operation: 'INSERT',
        tableName: 'users',
        columns: ['id', 'name'],
        values: ['1', 'Alice'],
      });
      expect(sql).toBe("INSERT INTO users (id, name) VALUES ('1', 'Alice');");
    });

    it('escapes single quotes in values', () => {
      const sql = generateSql({
        operation: 'INSERT',
        tableName: 'notes',
        columns: ['text'],
        values: ["it's fine"],
      });
      expect(sql).toContain("it''s fine");
    });
  });

  describe('UPDATE', () => {
    it('generates an UPDATE statement', () => {
      const sql = generateSql({
        operation: 'UPDATE',
        tableName: 'users',
        columns: ['name'],
        values: ['Bob'],
        whereClause: 'id = 1',
      });
      expect(sql).toBe("UPDATE users SET name = 'Bob' WHERE id = 1;");
    });

    it('returns an error comment when columns/values are missing', () => {
      const sql = generateSql({ operation: 'UPDATE', tableName: 'users' });
      expect(sql).toContain('-- Error');
    });
  });

  describe('DELETE', () => {
    it('generates a DELETE with WHERE', () => {
      expect(
        generateSql({ operation: 'DELETE', tableName: 'users', whereClause: 'id = 5' }),
      ).toBe('DELETE FROM users WHERE id = 5;');
    });

    it('generates a DELETE all (no WHERE)', () => {
      expect(generateSql({ operation: 'DELETE', tableName: 'users' })).toBe(
        'DELETE FROM users;',
      );
    });
  });

  describe('CREATE_TABLE', () => {
    it('generates a CREATE TABLE with default columns', () => {
      const sql = generateSql({ operation: 'CREATE_TABLE', tableName: 'items' });
      expect(sql).toContain('CREATE TABLE items');
      expect(sql).toContain('id INTEGER PRIMARY KEY');
    });

    it('generates a CREATE TABLE with custom columns', () => {
      const sql = generateSql({
        operation: 'CREATE_TABLE',
        tableName: 'products',
        columns: ['name', 'price'],
      });
      expect(sql).toContain('name TEXT');
      expect(sql).toContain('price TEXT');
    });
  });

  it('exports all expected operation names', () => {
    expect(SQL_OPERATIONS).toEqual(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE_TABLE']);
  });
});
