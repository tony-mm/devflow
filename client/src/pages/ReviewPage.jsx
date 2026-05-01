import React, { useEffect, useMemo, useState } from 'react';
import FileTree from '../components/FileTree.jsx';
import IssueCard from '../components/IssueCard.jsx';
import ScoreGauge from '../components/ScoreGauge.jsx';
import DiffViewer from '../components/DiffViewer.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function buildDiffSummary(review) {
  const lines = [`Summary: ${review.summary}`, '', 'Files:'];
  review.files.forEach((file) => {
    lines.push(`- ${file.path} (${file.issues.length} issues)`);
  });
  return lines.join('\n');
}

function ReviewPage({ review, onBack }) {
  const [selectedPath, setSelectedPath] = useState(review.files[0]?.path || '');
  const [fixDiff, setFixDiff] = useState(null);
  const [fixStatus, setFixStatus] = useState('idle');
  const [prDescription, setPrDescription] = useState(review.prDescription || '');
  const [showPrModal, setShowPrModal] = useState(false);

  const selectedFile = useMemo(
    () => review.files.find((file) => file.path === selectedPath) || review.files[0],
    [review.files, selectedPath]
  );

  useEffect(() => {
    setSelectedPath(review.files[0]?.path || '');
    setFixDiff(null);
    setFixStatus('idle');
    setPrDescription(review.prDescription || '');
  }, [review]);

  const handleAutoFix = async (issue, filePath) => {
    setFixStatus('running');
    setFixDiff(null);
    try {
      const res = await fetch(`${API_BASE}/api/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          targetPath: review.targetPath,
          issue,
        }),
      });
      const data = await res.json();
      setFixDiff(data.diff);
      setFixStatus('ready');
    } catch (error) {
      setFixStatus('error');
    }
  };

  const handleCopyFix = async () => {
    if (!fixDiff?.after) return;
    await navigator.clipboard.writeText(fixDiff.after);
  };

  const handleGeneratePr = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pr-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff: buildDiffSummary(review) }),
      });
      const data = await res.json();
      setPrDescription(data.description);
      setShowPrModal(true);
    } catch (error) {
      setShowPrModal(true);
    }
  };

  const handleCopyPr = async () => {
    if (!prDescription) return;
    await navigator.clipboard.writeText(prDescription);
  };

  return (
    <div className="review-page">
      <div className="review-top">
        <button className="ghost" type="button" onClick={onBack}>
          Back to Dashboard
        </button>
        <div className="review-top__meta">
          <span>{review.targetPath}</span>
          <span>{new Date(review.timestamp).toLocaleString()}</span>
        </div>
      </div>

      <div className="review-header">
        <div>
          <h2>Review Results</h2>
          <p>{review.summary}</p>
        </div>
        <ScoreGauge score={review.score} />
      </div>

      <div className="review-layout">
        <FileTree
          files={review.files}
          selectedPath={selectedFile?.path}
          onSelect={setSelectedPath}
        />

        <div className="review-issues">
          <div className="review-issues__header">
            <h3>{selectedFile?.path || 'Select a file'}</h3>
            <button className="primary" type="button" onClick={handleGeneratePr}>
              Generate PR Description
            </button>
          </div>
          {selectedFile?.issues?.length ? (
            <div className="issue-grid">
              {selectedFile.issues.map((issue, index) => (
                <IssueCard
                  key={`${selectedFile.path}-${index}`}
                  issue={issue}
                  filePath={selectedFile.path}
                  onAutoFix={handleAutoFix}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">No issues in this file.</div>
          )}

          <div className="fix-panel">
            {fixStatus === 'running' && (
              <div className="loading">Generating fix suggestion...</div>
            )}
            {fixStatus === 'error' && (
              <div className="error">Failed to generate fix. Try again.</div>
            )}
            <DiffViewer diff={fixDiff} onCopy={handleCopyFix} />
          </div>
        </div>
      </div>

      {showPrModal && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3>PR Description</h3>
              <button className="ghost" type="button" onClick={() => setShowPrModal(false)}>
                Close
              </button>
            </div>
            <textarea readOnly value={prDescription} />
            <button className="primary" type="button" onClick={handleCopyPr}>
              Copy PR Description
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewPage;
