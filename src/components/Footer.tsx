export const Footer = () => {
  const commitHash = __COMMIT_HASH__ ?? 'unknown'

  return (
    <footer className="text-muted text-center" style={{ marginTop: 10 }}>
      <small>
        (c) {new Date().getFullYear()} - Built by 🏀 KobeT 🏀 with ❤️ | Commit: {commitHash}
      </small>
    </footer>
  );
};
