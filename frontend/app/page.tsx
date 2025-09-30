'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModelColumn } from '../components/model-column';
import { ModelOption, PromptForm } from '../components/prompt-form';
import { CreateSessionPayload, createSession, openSessionStream, StreamingMessage } from '../lib/api';

interface ModelState {
  id: string;
  name: string;
  status: string;
  chunks: string[];
  error?: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  //{ id: 'mock-gemini', name: 'Mock Gemini', description: 'Placeholder for Gemini responses.' },
  //{ id: 'mock-claude', name: 'Mock Claude 3', description: 'Placeholder for Claude 3 responses.' },
  { id: 'gpt-4', name:'OpenAI GPT-4', description:'OpenAI GPT-4'},
  { id: 'gpt-5', name: 'OpenAI GPT-5', description:'OpenAI GPT-5'}
];

export default function HomePage(): JSX.Element {
  const [selectedModels, setSelectedModels] = useState<string[]>(() => AVAILABLE_MODELS.map((model) => model.id));
  const [modelStates, setModelStates] = useState<ModelState[]>(() =>
    AVAILABLE_MODELS.map((model) => ({
      id: model.id,
      name: model.name,
      status: 'pending',
      chunks: [],
      error: undefined
    }))
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  const resetModelStates = useCallback((models: string[]) => {
    setModelStates(() =>
      models.map((modelId) => {
        const fallback = AVAILABLE_MODELS.find((model) => model.id === modelId);
        const name = fallback?.name ?? modelId;
        return {
          id: modelId,
          name,
          status: 'pending',
          chunks: [],
          error: undefined
        } satisfies ModelState;
      })
    );
  }, []);

  const handleToggleModel = useCallback((modelId: string) => {
    setSelectedModels((current) => {
      if (current.includes(modelId)) {
        return current.filter((id) => id !== modelId);
      }
      return [...current, modelId];
    });
  }, []);

  const handleStreamMessage = useCallback((message: StreamingMessage) => {
    setModelStates((current) => {
      switch (message.type) {
        case 'model.status':
          return current.map((model) =>
            model.id === message.modelId
              ? {
                  ...model,
                  status: message.status
                }
              : model
          );
        case 'model.chunk':
          return current.map((model) =>
            model.id === message.modelId
              ? {
                  ...model,
                  status: model.status === 'pending' ? 'running' : model.status,
                  chunks: [...model.chunks, message.content]
                }
              : model
          );
        case 'model.error':
          return current.map((model) =>
            model.id === message.modelId
              ? {
                  ...model,
                  status: 'error',
                  error: message.error
                }
              : model
          );
        case 'session.status':
          setIsRunning(message.status !== 'completed' && message.status !== 'error');
          return current;
        case 'session.error':
          setIsRunning(false);
          return current.map((model) => ({
            ...model,
            status: model.status === 'completed' ? model.status : 'error',
            error: model.error ?? 'Session failed before completion.'
          }));
        case 'session.completed':
          setIsRunning(false);
          return current.map((model) => ({
            ...model,
            status: model.status === 'error' ? model.status : 'completed'
          }));
        default:
          return current;
      }
    });
  }, []);

  const handleSubmitPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt) {
        return;
      }

      const payload: CreateSessionPayload = {
        prompt,
        modelIds: selectedModels
      };

      setIsRunning(true);
      resetModelStates(selectedModels);

      try {
        const session = await createSession(payload);
        setSessionId(session.id);

        eventSourceRef.current?.close();
        const eventSource = openSessionStream(
          session.id,
          (event) => handleStreamMessage(event),
          () => {
            setIsRunning(false);
          }
        );
        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Failed to start session', error);
        setIsRunning(false);
      }
    },
    [handleStreamMessage, resetModelStates, selectedModels]
  );

  const activeModelStates = useMemo(
    () => modelStates.filter((model) => selectedModels.includes(model.id)),
    [modelStates, selectedModels]
  );

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2.5rem',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <header style={{ textAlign: 'center', maxWidth: '720px' }}>
        <span style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: '0.9rem', letterSpacing: '0.2em' }}>
          AI MODEL PLAYGROUND
        </span>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', marginTop: '0.75rem' }}>
          Watch multiple AI models respond in real-time.
        </h1>
        <p style={{ color: 'rgba(226, 232, 240, 0.75)', fontSize: '1.05rem' }}>
          Enter a single prompt and capture simultaneous responses to evaluate tone, completeness, and accuracy side-by-side.
        </p>
      </header>

      <section
        style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '18px',
          padding: '1.5rem',
          border: '1px solid rgba(148, 163, 184, 0.25)'
        }}
      >
        <PromptForm
          availableModels={AVAILABLE_MODELS}
          selectedModels={selectedModels}
          onToggleModel={handleToggleModel}
          onSubmit={handleSubmitPrompt}
          disabled={isRunning}
        />
      </section>

      <section
        style={{
          display: 'grid',
          gap: '1.5rem',
          width: '100%',
          gridTemplateColumns: activeModelStates.length === 1 ? '1fr' : `repeat(${activeModelStates.length}, 1fr)`
        }}
      >
        {activeModelStates.map((model) => (
          <ModelColumn
            key={model.id}
            modelId={model.id}
            modelName={model.name}
            status={model.status}
            chunks={model.chunks}
            error={model.error}
          />
        ))}
      </section>

      <footer style={{ color: 'rgba(148, 163, 184, 0.75)', fontSize: '0.85rem' }}>
        Session ID: {sessionId ?? '—'}
      </footer>
    </main>
  );
}
