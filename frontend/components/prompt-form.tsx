'use client';

import { FormEvent, useState } from 'react';

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

type PromptFormProps = {
  availableModels: ModelOption[];
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
};

export function PromptForm({
  availableModels,
  selectedModels,
  onToggleModel,
  onSubmit,
  disabled = false
}: PromptFormProps): JSX.Element {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!prompt.trim() || selectedModels.length === 0) {
      return;
    }
    onSubmit(prompt.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%'
      }}
    >
      <textarea
        placeholder="Ask anything and compare responses…"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={4}
        disabled={disabled}
        style={{
          resize: 'vertical',
          minHeight: '120px',
          maxHeight: '260px',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: 'rgba(15, 23, 42, 0.65)',
          color: '#f1f5f9',
          fontSize: '1rem'
        }}
      />
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        {availableModels.map((model) => {
          const isActive = selectedModels.includes(model.id);
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onToggleModel(model.id)}
              disabled={disabled}
              style={{
                borderRadius: '12px',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.35)',
                padding: '0.75rem 1rem',
                background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.55)',
                color: '#e2e8f0',
                cursor: disabled ? 'not-allowed' : 'pointer',
                minWidth: '160px'
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>{model.name}</strong>
              {model.description ? (
                <span style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.65)' }}>{model.description}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '0.875rem', color: 'rgba(226, 232, 240, 0.75)' }}>
          {selectedModels.length} model{selectedModels.length === 1 ? '' : 's'} selected for comparison.
        </span>
        <button
          type="submit"
          disabled={disabled || selectedModels.length === 0}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled || selectedModels.length === 0 ? 0.6 : 1,
            transition: 'transform 0.2s ease'
          }}
        >
          Launch Comparison
        </button>
      </div>
    </form>
  );
}
