import React from 'react';

function ReviewCard({ review, onSelect, index }) {
  return (
    <button
      className="review-card"
      type="button"
      style={{ '--delay': `${index * 80}ms` }}
      onClick={() => onSelect(review)}
    >
      <div className="review-card__header">
        <h3>{review.summary}</h3>
        <span className="review-score">{review.score}</span>
      </div>
      <div className="review-card__meta">
        <span>{new Date(review.timestamp).toLocaleString()}</span>
        <span className="review-path">{review.targetPath}</span>
      </div>
      <div className="review-card__footer">
        <span>{review.files.length} files analyzed</span>
        <span className="review-link">View details</span>
      </div>
    </button>
  );
}

export default ReviewCard;
