import React from 'react';
import { useWizard, STEPS } from '../hooks/useWizardState';

export function WizardLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useWizard();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Moltbot Setup</h1>
          <p className="text-gray-400 text-sm mt-1">
            {state.deployTarget === 'cloudflare'
              ? 'Cloudflare Workers'
              : state.deployTarget === 'docker'
                ? 'Docker / VPS'
                : 'Choose platform'}
          </p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {STEPS.map((step, idx) => {
              const isCurrent = idx === state.currentStep;
              const isPast = idx < state.currentStep;
              const isClickable = idx <= state.currentStep;

              return (
                <li key={step.id}>
                  <button
                    onClick={() => isClickable && dispatch({ type: 'SET_STEP', step: idx })}
                    disabled={!isClickable}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isCurrent
                        ? 'bg-brand-600 text-white'
                        : isPast
                          ? 'text-gray-300 hover:bg-gray-800'
                          : 'text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCurrent
                          ? 'bg-white text-brand-600'
                          : isPast
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {isPast ? '\u2713' : step.icon}
                    </span>
                    {step.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="text-xs text-gray-500 mt-4">
          Secrets never leave your machine
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
