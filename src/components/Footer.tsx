import React from 'react';

export const Footer: React.FC = () => {
  const commitHash = __COMMIT_HASH__ ?? 'unknown'
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-light border-top mt-auto py-3">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6">
            <small className="text-muted">
              © {currentYear} QA Utils - Built with ❤️ for the testing community
            </small>
          </div>
          <div className="col-md-6 text-md-end">
            <small className="text-muted">
              Built by 🏀 KobeT 🏀 | Commit: {commitHash}
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
};
