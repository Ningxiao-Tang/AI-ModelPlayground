'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  running: 'Streaming…',
  completed: 'Complete',
  error: 'Error'
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#475569',
  running: '#38bdf8',
  completed: '#4ade80',
  error: '#f87171'
};

export interface ModelColumnProps {
  modelId: string;
  modelName: string;
  status: string;
  chunks: string[];
  error?: string;
}

export function ModelColumn({ modelName, status, chunks, error }: ModelColumnProps): JSX.Element {
  const displayStatus = STATUS_LABELS[status] ?? status;
  const statusColor = STATUS_COLORS[status] ?? '#6366f1';
  const content = chunks.join('\n');

  return (
    <article
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        borderRadius: '16px',
        padding: '1.25rem',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{modelName}</h2>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: statusColor,
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
            border: `1px solid ${statusColor}`
          }}
        >
          {displayStatus}
        </span>
      </header>
      <section
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.45)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}
      >
        {error ? (
          <p style={{ color: '#f87171', margin: 0 }}>{error}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Awaiting response…*'}</ReactMarkdown>
        )}
      </section>
    </article>
  );
}
