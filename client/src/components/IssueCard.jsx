import React from 'react';
import StatusBadge from './StatusBadge.jsx';

function IssueCard({ issue, filePath, onAutoFix }) {
  return (
    <div className="issue-card">
      <div className="issue-card__header">
        <StatusBadge severity={issue.severity} />
        <span className="issue-line">Line {issue.line}</span>
      </div>
      <p className="issue-message">{issue.message}</p>
      <p className="issue-suggestion">{issue.suggestion}</p>
      <button
        className="issue-fix"
        type="button"
        onClick={() => onAutoFix(issue, filePath)}
      >
        Auto Fix
      </button>
    </div>
  );
}

export default IssueCard;
