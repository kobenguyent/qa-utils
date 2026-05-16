# Feature Implementation Plans

> Production-ready technical specifications for new QA Utils features.

Each document in this directory represents a **complete implementation blueprint** for a single tool/feature. Plans are designed to be self-contained — any engineer should be able to pick one up and deliver the feature end-to-end.

---

## Document Structure

Every plan follows this standard structure:

| Section | Purpose |
|---------|---------|
| **Overview** | What the feature does, who it's for, and why it matters |
| **Technical Architecture** | System design, data flow, interfaces |
| **Implementation Phases** | Ordered steps with clear deliverables |
| **File Manifest** | Exact files to create/modify |
| **Dependencies** | New packages, APIs, or services required |
| **Testing Strategy** | Unit, integration, and manual test plans |
| **Acceptance Criteria** | Definition of done |
| **Rollback Plan** | How to safely revert if needed |

---

## Plans Index

| # | Feature | Status | Document |
|---|---------|--------|----------|
| 1 | File Comparator | ✅ Complete | [file-comparator.md](./file-comparator.md) |

---

## Conventions

- **One file per feature** — keeps scope manageable and reviewable
- **Status labels**: 📋 Planned → 🚧 In Progress → ✅ Complete → 🗃️ Archived
- **Naming**: lowercase kebab-case matching the route path (e.g., `file-comparator.md`)
- **Phase numbering**: sequential, each phase is independently shippable where possible
