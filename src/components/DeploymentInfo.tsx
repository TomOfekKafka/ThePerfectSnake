import { useEffect, useState } from 'react';
import './DeploymentInfo.css';

interface DeploymentMetadata {
  lastDeployment: {
    timestamp: string;
    contributor: string;
    cost: string;
    orderId: string;
  };
}

export function DeploymentInfo() {
  const [metadata, setMetadata] = useState<DeploymentMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/deployment-metadata.json')
      .then(res => {
        if (!res.ok) throw new Error('Metadata not found');
        return res.json();
      })
      .then(data => {
        setMetadata(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !metadata) {
    return null;
  }

  const { timestamp, contributor, cost } = metadata.lastDeployment;
  const date = new Date(timestamp);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="deployment-info">
      <div className="deployment-info-icon">🤖</div>
      <div className="deployment-info-text">
        <strong>Last AI Improvement:</strong> {timeAgo} by {contributor} (${cost})
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
