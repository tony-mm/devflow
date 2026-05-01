import React from 'react';

function StreamingLog({ logs }) {
  return (
    <div className="streaming-log">
      <div className="streaming-header">
        <span className="streaming-title">Agent Stream</span>
      </div>
      <div className="streaming-body">
        {logs.length === 0 ? (
          <p className="streaming-empty">Waiting for activity...</p>
        ) : (
          <ul>
            {logs.map((entry, index) => (
              <li key={`${entry.timestamp}-${index}`}>
                <span className="log-time">{entry.timestamp}</span>
                <span className="log-message">{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default StreamingLog;
