import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function useReview() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/api/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const stream = new EventSource(`${API_BASE}/api/stream`);

    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'log') {
          setLogs((prev) => [...prev, payload]);
        }
      } catch (error) {
        setLogs((prev) => [
          ...prev,
          { message: 'Invalid stream payload', timestamp: new Date().toISOString() },
        ]);
      }
    };

    stream.onerror = () => {
      setLogs((prev) => [
        ...prev,
        { message: 'Stream disconnected', timestamp: new Date().toISOString() },
      ]);
      stream.close();
    };

    return () => stream.close();
  }, []);

  const startReview = useCallback(async (targetPath) => {
    setStatus('running');
    setLogs([]);
    try {
      const res = await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPath }),
      });
      const data = await res.json();
      setReviews((prev) => [data, ...prev].slice(0, 10));
      setStatus('idle');
    } catch (error) {
      setStatus('error');
    }
  }, []);

  return {
    reviews,
    status,
    logs,
    startReview,
  };
}

export { useReview };
