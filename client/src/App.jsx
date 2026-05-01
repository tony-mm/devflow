import React, { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import { useReview } from './hooks/useReview.js';

function App() {
  const { reviews, status, logs, startReview } = useReview();
  const [selectedReview, setSelectedReview] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">DF</span>
          <div>
            <h1>DevFlow AI</h1>
            <p>Automated code review and PR intelligence</p>
          </div>
        </div>
        <div className="header-status">
          <span className={`status-pill status-pill--${status}`}>
            {status === 'running' ? 'Running' : status === 'error' ? 'Error' : 'Ready'}
          </span>
        </div>
      </header>

      <main className="main">
        {selectedReview ? (
          <ReviewPage review={selectedReview} onBack={() => setSelectedReview(null)} />
        ) : (
          <Dashboard
            reviews={reviews}
            status={status}
            logs={logs}
            onStartReview={startReview}
            onSelectReview={setSelectedReview}
          />
        )}
      </main>
    </div>
  );
}

export default App;