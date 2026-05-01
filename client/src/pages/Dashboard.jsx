import React, { useState } from 'react';
import ReviewCard from '../components/ReviewCard.jsx';
import StreamingLog from '../components/StreamingLog.jsx';

function Dashboard({ reviews, status, logs, onStartReview, onSelectReview }) {
  const [targetPath, setTargetPath] = useState('./client/src');

  const handleSubmit = () => {
    onStartReview(targetPath);
  };

  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">Automated Review Control</p>
          <h2>DevFlow AI orchestrates code health in real time.</h2>
          <p className="hero-body">
            Point the agent at any folder and stream live diagnostics, fixes, and
            PR-ready summaries.
          </p>
        </div>
        <div className="hero-panel">
          <label className="path-label" htmlFor="targetPath">
            Target Path
          </label>
          <div className="path-input">
            <input
              id="targetPath"
              value={targetPath}
              onChange={(event) => setTargetPath(event.target.value)}
              placeholder="./client/src"
            />
            <button type="button" onClick={handleSubmit} disabled={status === 'running'}>
              {status === 'running' ? 'Analyzing...' : 'Run Review'}
            </button>
          </div>
          <p className="path-hint">Default points to the project UI folder.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-reviews">
          <div className="section-title">
            <h3>Recent Reviews</h3>
            <span className="section-subtitle">Click a card for details</span>
          </div>
          <div className="review-list">
            {status === 'running' && reviews.length === 0 ? (
              <div className="review-skeletons">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="review-skeleton" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-state">
                No reviews yet. Start a scan to populate insights.
              </div>
            ) : (
              reviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  index={index}
                  onSelect={onSelectReview}
                />
              ))
            )}
          </div>
        </div>

        <div className="dashboard-stream">
          <StreamingLog logs={logs} />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
