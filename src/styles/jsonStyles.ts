export const jsonStyles = {
  dualView: {
    display: "flex",
  },
  jsonViewer: {
    borderLeft: "1px dashed #e9ecef",
    lineHeight: 1.25,
    width: "50%",
    margin: 10,
    color: "#1e293b", // readable default text
  },
  jsonEditor: {
    width: "50%",
    fontSize: 18,
    fontFamily: "Lucida Console, monospace",
    lineHeight: 1.25,
    color: "#1e293b",
  },
  root: {
    fontSize: 18,
    fontFamily: "Lucida Console, monospace",
    lineHeight: 1.25,
    color: "#1e293b",
    /*color: "#3E3D32"*/
  },
  label: {
    color: "#0d6efd", // primary blue for labels/properties
    marginTop: 3,
  },
  value: {
    marginLeft: 10,
    color: "#1e293b",
  },
  row: {
    display: "flex",
  },
  withChildrenLabel: {
    color: "#0d6efd",
  },
  select: {
    borderRadius: 3,
    borderColor: "#ced4da",
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  input: {
    borderRadius: 3,
    border: "1px solid #ced4da",
    padding: 6,
    fontFamily: "Lucida Console, monospace",
    fontSize: 14,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    width: "200%",
  },
  addButton: {
    cursor: "pointer",
    color: "#198754", // success green
    marginLeft: 15,
    fontSize: 12,
  },
  removeButton: {
    cursor: "pointer",
    color: "#d63384", // accessible magenta
    marginLeft: 15,
    fontSize: 12,
  },
  saveButton: {
    cursor: "pointer",
    color: "#0d6efd", // primary
    marginLeft: 15,
    fontSize: 12,
  },
  builtin: {
    color: "#6c757d", // muted
    fontSize: 12,
  },
  text: {
    color: "#1e293b", // black-ish text
    fontSize: 12,
  },
  number: {
    color: "#6f42c1", // purple with good contrast
    fontSize: 12,
  },
  property: {
    color: "#0d6efd", // blue for property names
    fontSize: 12,
  },
  collapseIcon: {
    cursor: "pointer",
    fontSize: 10,
    color: "#0d6efd",
  },
};