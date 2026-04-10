import React, { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

interface ChecklistRoomProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  roomMode: boolean;
}

/**
 * ChecklistRoom wraps a checklist Card section.
 * In Room Mode it can be marked as "visited" — collapsing the content.
 */
export const ChecklistRoom: React.FC<ChecklistRoomProps> = ({ title, icon, children, roomMode }) => {
  const [visited, setVisited] = useState(false);

  if (!roomMode) {
    return (
      <Card className="mb-3">
        <Card.Header as="h5">{icon} {title}</Card.Header>
        <Card.Body>{children}</Card.Body>
      </Card>
    );
  }

  return (
    <Card className={`mb-3 ${visited ? 'border-success' : ''}`} style={{ transition: 'all 0.3s' }}>
      <Card.Header
        className="d-flex align-items-center justify-content-between"
        style={{ cursor: visited ? 'default' : 'pointer', backgroundColor: visited ? 'var(--success-bg)' : undefined }}
      >
        <span>
          {visited ? '✅' : (icon || '🚪')}{' '}
          <strong>{title}</strong>
        </span>
        {visited ? (
          <div className="d-flex align-items-center gap-2">
            <Badge bg="success">Room visited!</Badge>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-muted"
              onClick={() => setVisited(false)}
              aria-label={`Reopen room ${title}`}
            >
              Reopen
            </Button>
          </div>
        ) : (
          <Button
            variant="success"
            size="sm"
            onClick={() => setVisited(true)}
            aria-label={`Mark ${title} room as complete`}
          >
            ✅ Mark Room Complete
          </Button>
        )}
      </Card.Header>
      {!visited && <Card.Body>{children}</Card.Body>}
    </Card>
  );
};
