export interface SqlGeneratorOptions {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE_TABLE' | 'ALTER_TABLE';
  tableName: string;
  columns?: string;
  values?: string;
  whereClause?: string;
  orderBy?: string;
  limit?: string;
  joinTable?: string;
  joinType?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  joinCondition?: string;
}

export const generateSqlCommand = (options: SqlGeneratorOptions): string => {
  const { 
    operation, 
    tableName, 
    columns = '', 
    values = '', 
    whereClause = '', 
    orderBy = '', 
    limit = '', 
    joinTable = '', 
    joinType = 'INNER', 
    joinCondition = '' 
  } = options;

  if (!tableName.trim()) {
    return '-- Error: Table name is required';
  }

  const cols = columns.split(',').map(c => c.trim()).filter(c => c);
  let sql = '';

  switch (operation) {
    case 'SELECT':
      sql = `SELECT ${cols.length ? cols.join(', ') : '*'}\nFROM ${tableName}`;
      if (joinTable && joinCondition) {
        sql += `\n${joinType} JOIN ${joinTable} ON ${joinCondition}`;
      }
      if (whereClause) sql += `\nWHERE ${whereClause}`;
      if (orderBy) sql += `\nORDER BY ${orderBy}`;
      if (limit) sql += `\nLIMIT ${limit}`;
      break;

    case 'INSERT': {
      if (!cols.length || !values.trim()) {
        return '-- Error: Columns and values are required';
      }
      const vals = values.split(',').map(v => v.trim());
      sql = `INSERT INTO ${tableName} (${cols.join(', ')})\nVALUES (${vals.join(', ')})`;
      break;
    }

    case 'UPDATE': {
      if (!cols.length || !values.trim()) {
        return '-- Error: Columns and values are required';
      }
      const updateVals = values.split(',').map(v => v.trim());
      const setPairs = cols.map((col, i) => `${col} = ${updateVals[i] || '?'}`);
      sql = `UPDATE ${tableName}\nSET ${setPairs.join(', ')}`;
      if (whereClause) sql += `\nWHERE ${whereClause}`;
      break;
    }

    case 'DELETE':
      sql = `DELETE FROM ${tableName}`;
      if (whereClause) sql += `\nWHERE ${whereClause}`;
      break;

    case 'CREATE_TABLE':
      if (!cols.length) {
        return '-- Error: Columns are required (format: column_name TYPE)';
      }
      sql = `CREATE TABLE ${tableName} (\n  ${cols.join(',\n  ')}\n)`;
      break;

    case 'ALTER_TABLE':
      if (!cols.length) {
        return '-- Error: Column definition is required';
      }
      sql = `ALTER TABLE ${tableName}\nADD COLUMN ${cols[0]}`;
      break;
  }

  return sql + ';';
};
