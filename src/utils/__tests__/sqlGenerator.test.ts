import { describe, it, expect } from 'vitest';
import { generateSqlCommand } from '../sqlGenerator';

describe('SQL Generator', () => {
  describe('SELECT queries', () => {
    it('should generate basic SELECT query', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        columns: 'id, name, email'
      });
      expect(sql).toBe('SELECT id, name, email\nFROM users;');
    });

    it('should generate SELECT * when no columns specified', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users'
      });
      expect(sql).toBe('SELECT *\nFROM users;');
    });

    it('should generate SELECT with WHERE clause', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        whereClause: 'id = 1'
      });
      expect(sql).toBe('SELECT *\nFROM users\nWHERE id = 1;');
    });

    it('should generate SELECT with ORDER BY', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        orderBy: 'created_at DESC'
      });
      expect(sql).toBe('SELECT *\nFROM users\nORDER BY created_at DESC;');
    });

    it('should generate SELECT with LIMIT', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        limit: '10'
      });
      expect(sql).toBe('SELECT *\nFROM users\nLIMIT 10;');
    });

    it('should generate SELECT with all clauses', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        columns: 'id, name',
        whereClause: 'status = "active"',
        orderBy: 'name ASC',
        limit: '5'
      });
      expect(sql).toBe('SELECT id, name\nFROM users\nWHERE status = "active"\nORDER BY name ASC\nLIMIT 5;');
    });

    it('should generate SELECT with INNER JOIN', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        columns: 'users.id, users.name, orders.total',
        joinTable: 'orders',
        joinType: 'INNER',
        joinCondition: 'users.id = orders.user_id'
      });
      expect(sql).toBe('SELECT users.id, users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;');
    });

    it('should generate SELECT with LEFT JOIN', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        joinTable: 'orders',
        joinType: 'LEFT',
        joinCondition: 'users.id = orders.user_id'
      });
      expect(sql).toBe('SELECT *\nFROM users\nLEFT JOIN orders ON users.id = orders.user_id;');
    });

    it('should generate SELECT with JOIN and WHERE', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        columns: 'users.name, orders.total',
        joinTable: 'orders',
        joinCondition: 'users.id = orders.user_id',
        whereClause: 'orders.total > 100'
      });
      expect(sql).toBe('SELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id\nWHERE orders.total > 100;');
    });

    it('should ignore JOIN if condition is missing', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: 'users',
        joinTable: 'orders'
      });
      expect(sql).toBe('SELECT *\nFROM users;');
    });
  });

  describe('INSERT queries', () => {
    it('should generate INSERT query', () => {
      const sql = generateSqlCommand({
        operation: 'INSERT',
        tableName: 'users',
        columns: 'name, email',
        values: "'John', 'john@example.com'"
      });
      expect(sql).toBe("INSERT INTO users (name, email)\nVALUES ('John', 'john@example.com');");
    });

    it('should return error when columns missing', () => {
      const sql = generateSqlCommand({
        operation: 'INSERT',
        tableName: 'users',
        values: "'John'"
      });
      expect(sql).toBe('-- Error: Columns and values are required');
    });

    it('should return error when values missing', () => {
      const sql = generateSqlCommand({
        operation: 'INSERT',
        tableName: 'users',
        columns: 'name'
      });
      expect(sql).toBe('-- Error: Columns and values are required');
    });
  });

  describe('UPDATE queries', () => {
    it('should generate UPDATE query', () => {
      const sql = generateSqlCommand({
        operation: 'UPDATE',
        tableName: 'users',
        columns: 'name, email',
        values: "'John Doe', 'john@example.com'"
      });
      expect(sql).toBe("UPDATE users\nSET name = 'John Doe', email = 'john@example.com';");
    });

    it('should generate UPDATE with WHERE', () => {
      const sql = generateSqlCommand({
        operation: 'UPDATE',
        tableName: 'users',
        columns: 'status',
        values: "'inactive'",
        whereClause: 'id = 1'
      });
      expect(sql).toBe("UPDATE users\nSET status = 'inactive'\nWHERE id = 1;");
    });

    it('should return error when columns missing', () => {
      const sql = generateSqlCommand({
        operation: 'UPDATE',
        tableName: 'users',
        values: "'John'"
      });
      expect(sql).toBe('-- Error: Columns and values are required');
    });
  });

  describe('DELETE queries', () => {
    it('should generate DELETE query', () => {
      const sql = generateSqlCommand({
        operation: 'DELETE',
        tableName: 'users'
      });
      expect(sql).toBe('DELETE FROM users;');
    });

    it('should generate DELETE with WHERE', () => {
      const sql = generateSqlCommand({
        operation: 'DELETE',
        tableName: 'users',
        whereClause: 'id = 1'
      });
      expect(sql).toBe('DELETE FROM users\nWHERE id = 1;');
    });
  });

  describe('CREATE TABLE queries', () => {
    it('should generate CREATE TABLE query', () => {
      const sql = generateSqlCommand({
        operation: 'CREATE_TABLE',
        tableName: 'users',
        columns: 'id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100)'
      });
      expect(sql).toBe('CREATE TABLE users (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(100)\n);');
    });

    it('should return error when columns missing', () => {
      const sql = generateSqlCommand({
        operation: 'CREATE_TABLE',
        tableName: 'users'
      });
      expect(sql).toBe('-- Error: Columns are required (format: column_name TYPE)');
    });
  });

  describe('ALTER TABLE queries', () => {
    it('should generate ALTER TABLE query', () => {
      const sql = generateSqlCommand({
        operation: 'ALTER_TABLE',
        tableName: 'users',
        columns: 'phone VARCHAR(20)'
      });
      expect(sql).toBe('ALTER TABLE users\nADD COLUMN phone VARCHAR(20);');
    });

    it('should return error when column missing', () => {
      const sql = generateSqlCommand({
        operation: 'ALTER_TABLE',
        tableName: 'users'
      });
      expect(sql).toBe('-- Error: Column definition is required');
    });
  });

  describe('Error handling', () => {
    it('should return error when table name is missing', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: ''
      });
      expect(sql).toBe('-- Error: Table name is required');
    });

    it('should return error when table name is whitespace', () => {
      const sql = generateSqlCommand({
        operation: 'SELECT',
        tableName: '   '
      });
      expect(sql).toBe('-- Error: Table name is required');
    });
  });
});
