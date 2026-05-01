import React from 'react';

const LABELS = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

function StatusBadge({ severity = 'info' }) {
  const label = LABELS[severity] || 'Info';
  return (
    <span className={`status-badge status-badge--${severity}`}>
      {label}
    </span>
  );
}

export default StatusBadge;
