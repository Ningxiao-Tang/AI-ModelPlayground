'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ModelMetricsPayload } from '../lib/api';

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

const integerFormatter = new Intl.NumberFormat('en-US');
const costFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 6
});

export interface ModelColumnProps {
  modelId: string;
  modelName: string;
  status: string;
  chunks: string[];
  error?: string;
  metrics: ModelMetricsPayload;
}

export function ModelColumn({ modelName, status, chunks, error, metrics }: ModelColumnProps): JSX.Element {
  const displayStatus = STATUS_LABELS[status] ?? status;
  const statusColor = STATUS_COLORS[status] ?? '#6366f1';
  const content = chunks.join('\n');
  const durationSeconds = metrics.durationMs != null ? metrics.durationMs / 1000 : undefined;

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
      <footer
        style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          fontSize: '0.85rem',
          color: 'rgba(226, 232, 240, 0.75)'
        }}
      >
        <span>
          Tokens:{' '}
          <strong>
            {metrics.totalTokens != null ? integerFormatter.format(metrics.totalTokens) : '—'}
            {metrics.promptTokens != null || metrics.completionTokens != null
              ? ` (prompt ${
                  metrics.promptTokens != null
                    ? integerFormatter.format(metrics.promptTokens)
                    : '—'
                }, completion ${
                  metrics.completionTokens != null
                    ? integerFormatter.format(metrics.completionTokens)
                    : '—'
                })`
              : ''}
          </strong>
        </span>
        <span>
          Length:{' '}
          <strong>{integerFormatter.format(metrics.totalChars)}</strong> chars · Chunks:{' '}
          <strong>{integerFormatter.format(metrics.chunkCount)}</strong>
        </span>
        <span>
          Speed:{' '}
          <strong>
            {durationSeconds != null ? `${durationSeconds.toFixed(2)}s` : '—'}
          </strong>
        </span>
        {metrics.estimatedCostUsd != null ? (
          <span>
            Est. cost: <strong>{costFormatter.format(metrics.estimatedCostUsd)}</strong>
          </span>
        ) : null}
      </footer>
    </article>
  );
}
