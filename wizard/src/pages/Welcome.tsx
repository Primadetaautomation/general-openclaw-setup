import React from 'react';
import { useWizard } from '../hooks/useWizardState';
import { StepNavigation } from '../components/StepNavigation';

export function Welcome() {
  const { state, dispatch } = useWizard();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Deploy Moltbot</h2>
      <p className="text-gray-600 mb-8">
        Set up your own Moltbot AI assistant in minutes. Choose your deployment platform to get started.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => dispatch({ type: 'SET_DEPLOY_TARGET', target: 'cloudflare' })}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            state.deployTarget === 'cloudflare'
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-3">&#9729;</div>
          <h3 className="font-semibold text-gray-900">Cloudflare Workers</h3>
          <p className="text-sm text-gray-500 mt-1">
            Deploy to Cloudflare's edge network. Requires a Workers Paid plan.
          </p>
          <ul className="text-xs text-gray-400 mt-3 space-y-1">
            <li>Global edge network</li>
            <li>R2 storage included</li>
            <li>Cloudflare Access auth</li>
            <li>AI Gateway support</li>
          </ul>
        </button>

        <button
          onClick={() => dispatch({ type: 'SET_DEPLOY_TARGET', target: 'docker' })}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            state.deployTarget === 'docker'
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl mb-3">&#128230;</div>
          <h3 className="font-semibold text-gray-900">Docker / VPS</h3>
          <p className="text-sm text-gray-500 mt-1">
            Run on any server with Docker. Works on Linux, macOS, and Windows.
          </p>
          <ul className="text-xs text-gray-400 mt-3 space-y-1">
            <li>Any VPS or server</li>
            <li>Local volume storage</li>
            <li>Caddy auto-HTTPS</li>
            <li>Basic auth or OAuth</li>
          </ul>
        </button>
      </div>

      <StepNavigation canProceed={state.deployTarget !== null} />
    </div>
  );
}
