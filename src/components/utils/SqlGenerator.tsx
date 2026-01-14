import { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import { generateSqlCommand } from '../../utils/sqlGenerator';

type SqlOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE_TABLE' | 'ALTER_TABLE';
type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

export const SqlGenerator = () => {
  const [operation, setOperation] = useState<SqlOperation>('SELECT');
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState('');
  const [whereClause, setWhereClause] = useState('');
  const [values, setValues] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [limit, setLimit] = useState('');
  const [joinTable, setJoinTable] = useState('');
  const [joinType, setJoinType] = useState<JoinType>('INNER');
  const [joinCondition, setJoinCondition] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');

  const handleGenerate = () => {
    const sql = generateSqlCommand({
      operation,
      tableName,
      columns,
      values,
      whereClause,
      orderBy,
      limit,
      joinTable,
      joinType,
      joinCondition
    });
    setGeneratedSql(sql);
  };

  return (
    <Container>
      <div className="text-center mb-4">
        <h1>SQL Command Generator</h1>
        <p className="text-muted">Generate SQL commands with a visual interface</p>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">Operation</Form.Label>
          <Col sm="10">
            <Form.Select value={operation} onChange={(e) => setOperation(e.target.value as SqlOperation)}>
              <option value="SELECT">SELECT</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="CREATE_TABLE">CREATE TABLE</option>
              <option value="ALTER_TABLE">ALTER TABLE</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">Table Name</Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="users"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
          </Col>
        </Form.Group>

        {(operation === 'SELECT' || operation === 'INSERT' || operation === 'UPDATE' || operation === 'CREATE_TABLE' || operation === 'ALTER_TABLE') && (
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm="2">
              {operation === 'CREATE_TABLE' ? 'Columns (with types)' : 'Columns'}
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                placeholder={operation === 'CREATE_TABLE' ? 'id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100)' : 'id, name, email'}
                value={columns}
                onChange={(e) => setColumns(e.target.value)}
              />
              <Form.Text className="text-muted">
                {operation === 'CREATE_TABLE' ? 'Comma-separated with data types' : 'Comma-separated column names'}
              </Form.Text>
            </Col>
          </Form.Group>
        )}

        {operation === 'SELECT' && (
          <>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="2">JOIN Type</Form.Label>
              <Col sm="10">
                <Form.Select value={joinType} onChange={(e) => setJoinType(e.target.value as JoinType)}>
                  <option value="INNER">INNER JOIN</option>
                  <option value="LEFT">LEFT JOIN</option>
                  <option value="RIGHT">RIGHT JOIN</option>
                  <option value="FULL">FULL JOIN</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="2">JOIN Table</Form.Label>
              <Col sm="10">
                <Form.Control
                  type="text"
                  placeholder="orders"
                  value={joinTable}
                  onChange={(e) => setJoinTable(e.target.value)}
                />
                <Form.Text className="text-muted">Optional: Table to join with</Form.Text>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="2">JOIN Condition</Form.Label>
              <Col sm="10">
                <Form.Control
                  type="text"
                  placeholder="users.id = orders.user_id"
                  value={joinCondition}
                  onChange={(e) => setJoinCondition(e.target.value)}
                />
                <Form.Text className="text-muted">Required if JOIN table is specified</Form.Text>
              </Col>
            </Form.Group>
          </>
        )}

        {(operation === 'INSERT' || operation === 'UPDATE') && (
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm="2">Values</Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                placeholder="'John', 'john@example.com'"
                value={values}
                onChange={(e) => setValues(e.target.value)}
              />
              <Form.Text className="text-muted">Comma-separated values (use quotes for strings)</Form.Text>
            </Col>
          </Form.Group>
        )}

        {(operation === 'SELECT' || operation === 'UPDATE' || operation === 'DELETE') && (
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm="2">WHERE Clause</Form.Label>
            <Col sm="10">
              <Form.Control
                type="text"
                placeholder="id = 1"
                value={whereClause}
                onChange={(e) => setWhereClause(e.target.value)}
              />
              <Form.Text className="text-muted">Optional condition (without WHERE keyword)</Form.Text>
            </Col>
          </Form.Group>
        )}

        {operation === 'SELECT' && (
          <>
            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="2">ORDER BY</Form.Label>
              <Col sm="10">
                <Form.Control
                  type="text"
                  placeholder="created_at DESC"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
              <Form.Label column sm="2">LIMIT</Form.Label>
              <Col sm="10">
                <Form.Control
                  type="text"
                  placeholder="10"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </Col>
            </Form.Group>
          </>
        )}

        <div className="mb-3">
          <Button onClick={handleGenerate} className="me-2">Generate SQL</Button>
          <Button variant="secondary" onClick={() => {
            setTableName('');
            setColumns('');
            setWhereClause('');
            setValues('');
            setOrderBy('');
            setLimit('');
            setJoinTable('');
            setJoinCondition('');
            setGeneratedSql('');
          }}>Clear All</Button>
        </div>

        {generatedSql && (
          <Alert variant={generatedSql.startsWith('--') ? 'danger' : 'success'}>
            <div className="d-flex justify-content-between align-items-start">
              <div style={{ flex: 1 }}>
                <strong>Generated SQL:</strong>
                <pre className="mt-2 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{generatedSql}</pre>
              </div>
              {!generatedSql.startsWith('--') && (
                <CopyWithToast text={generatedSql} />
              )}
            </div>
          </Alert>
        )}
      </Form>
    </Container>
  );
};
