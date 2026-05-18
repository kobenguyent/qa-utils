import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { navigationConfig, NavGroup } from '../config/navigationConfig';

const categories: NavGroup[] = ['Converters', 'Generators', 'API', 'Tools', 'Learn', 'Palace'];

export const ExploreTools: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<NavGroup | 'All'>('All');

  const tools = useMemo(() => {
    return navigationConfig.filter((item) => {
      if (item.path === '#/') return false; // skip Home
      const matchesCategory =
        activeCategory === 'All' || item.navGroups.includes(activeCategory as NavGroup);
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof tools>();
    for (const tool of tools) {
      const cat = tool.category;
      const existing = map.get(cat);
      if (existing) {
        existing.push(tool);
      } else {
        map.set(cat, [tool]);
      }
    }
    return map;
  }, [tools]);

  return (
    <div className="explore-root">
      <Container>
        <div className="explore-header">
          <h1 className="explore-title">Explore Tools</h1>
          <p className="explore-subtitle">
            {navigationConfig.length - 1} tools to boost your QA workflow
          </p>
        </div>

        <div className="explore-filters">
          <div className="explore-pills">
            <button
              type="button"
              className={`explore-pill ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`explore-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <Form.Control
            type="text"
            placeholder="Filter tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="explore-search"
            aria-label="Filter tools"
          />
        </div>

        {tools.length === 0 && (
          <p className="explore-empty">No tools match your search.</p>
        )}

        {[...grouped.entries()].map(([category, items]) => (
          <div key={category} className="explore-group">
            <h2 className="explore-group-title">{category}</h2>
            <Row className="g-3">
              {items.map((item) => (
                <Col key={item.path} xs={12} sm={6} md={4} lg={3}>
                  <a href={item.path} className="explore-card">
                    <span className="explore-card-icon">{item.icon}</span>
                    <span className="explore-card-name">{item.title}</span>
                    <span className="explore-card-desc">{item.description}</span>
                  </a>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Container>
    </div>
  );
};

export default ExploreTools;
