import React from 'react';

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreGauge({ score = 0 }) {
  const clamped = Math.min(100, Math.max(0, score));
  const dash = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="score-gauge" aria-label={`Score ${clamped} out of 100`}>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle className="score-track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="score-progress"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dash}
        />
      </svg>
      <div className="score-label">
        <div className="score-value">{clamped}</div>
        <div className="score-caption">Review Score</div>
      </div>
    </div>
  );
}

export default ScoreGauge;
