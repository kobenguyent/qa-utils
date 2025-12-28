export const jsonStyles = {
  dualView: {
    display: "flex",
  },
  jsonViewer: {
    borderLeft: "1px dashed var(--border-color)",
    lineHeight: 1.25,
    width: "50%",
    margin: 10,
    color: "var(--text)", // theme-aware text
  },
  jsonEditor: {
    width: "50%",
    fontSize: 18,
    fontFamily: "Lucida Console, monospace",
    lineHeight: 1.25,
    color: "var(--text)",
  },
  root: {
    fontSize: 18,
    fontFamily: "Lucida Console, monospace",
    lineHeight: 1.25,
    color: "var(--text)",
    /*color: "#3E3D32"*/
  },
  label: {
    color: "var(--primary)", // primary blue for labels/properties
    marginTop: 3,
  },
  value: {
    marginLeft: 10,
    color: "var(--text)",
  },
  row: {
    display: "flex",
  },
  withChildrenLabel: {
    color: "var(--primary)",
  },
  select: {
    borderRadius: 3,
    borderColor: "var(--border-color)",
    backgroundColor: "var(--input-bg)",
    color: "var(--text)",
  },
  input: {
    borderRadius: 3,
    border: "1px solid var(--border-color)",
    padding: 6,
    fontFamily: "Lucida Console, monospace",
    fontSize: 14,
    backgroundColor: "var(--input-bg)",
    color: "var(--text)",
    width: "200%",
  },
  addButton: {
    cursor: "pointer",
    color: "var(--success)", // success green
    marginLeft: 15,
    fontSize: 12,
  },
  removeButton: {
    cursor: "pointer",
    color: "var(--danger)", // use danger for remove
    marginLeft: 15,
    fontSize: 12,
  },
  saveButton: {
    cursor: "pointer",
    color: "var(--primary)", // primary
    marginLeft: 15,
    fontSize: 12,
  },
  builtin: {
    color: "var(--muted)", // muted
    fontSize: 12,
  },
  text: {
    color: "var(--text)", // theme-aware text
    fontSize: 12,
  },
  number: {
    color: "var(--primary)", // use primary for numbers
    fontSize: 12,
  },
  property: {
    color: "var(--primary)", // blue for property names
    fontSize: 12,
  },
  collapseIcon: {
    cursor: "pointer",
    fontSize: 10,
    color: "var(--primary)",
  },
};