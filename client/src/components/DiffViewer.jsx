import React from 'react';

function DiffViewer({ diff, onCopy }) {
  if (!diff) {
    return (
      <div className="diff-viewer diff-viewer--empty">
        <p>Select an issue and run Auto Fix to see a diff.</p>
      </div>
    );
  }

  return (
    <div className="diff-viewer">
      <div className="diff-viewer__header">
        <h3>Fix Preview</h3>
        <button className="diff-copy" type="button" onClick={onCopy}>
          Copy Fix
        </button>
      </div>
      <div className="diff-viewer__body">
        <div className="diff-panel">
          <div className="diff-panel__title">Before</div>
          <pre>{diff.before}</pre>
        </div>
        <div className="diff-panel">
          <div className="diff-panel__title">After</div>
          <pre>{diff.after}</pre>
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
