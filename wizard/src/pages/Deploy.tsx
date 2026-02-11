import React, { useEffect, useRef, useState } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { startDeploy, generateFiles } from '../lib/api';

export function Deploy() {
  const { state, dispatch } = useWizard();
  const [currentStep, setCurrentStep] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleDeploy = () => {
    if (!state.deployTarget) return;

    setStatus('deploying');
    setLogs([]);
    setErrorMsg('');

    startDeploy(
      state.envVars,
      state.deployTarget,
      state.outputDir,
      (msg) => setLogs((prev) => [...prev, msg]),
      (step) => {
        setCurrentStep(step);
        setLogs((prev) => [...prev, `--- ${step} ---`]);
      },
      (msg) => {
        setStatus('success');
        setSuccessMsg(msg);
      },
      (msg) => {
        setStatus('error');
        setErrorMsg(msg);
      }
    );
  };

  const handleGenerateOnly = async () => {
    if (!state.deployTarget) return;

    setStatus('deploying');
    setLogs(['Generating files...']);

    try {
      const result = await generateFiles(
        state.envVars,
        state.deployTarget,
        state.outputDir,
        state.browserEnabled
      );

      if (result.success) {
        setStatus('success');
        setSuccessMsg(
          `Files generated in ${result.outputDir}:\n${result.files.join(', ')}`
        );
        setLogs((prev) => [
          ...prev,
          ...result.files.map((f: string) => `Created: ${f}`),
          'Done!',
        ]);
      } else {
        setStatus('error');
        setErrorMsg(result.error);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Deploy</h2>
      <p className="text-gray-600 mb-6">
        {state.deployTarget === 'cloudflare'
          ? 'Deploy your Moltbot to Cloudflare Workers'
          : 'Generate Docker deployment files'}
      </p>

      {status === 'idle' && (
        <div className="space-y-3">
          <button
            onClick={handleGenerateOnly}
            className="w-full px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Generate Files Only
          </button>
          <button
            onClick={handleDeploy}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Generate & Deploy Now
          </button>
          <p className="text-xs text-gray-400 text-center">
            "Generate Files Only" creates the config files without deploying
          </p>
        </div>
      )}

      {/* Deploy logs */}
      {logs.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
          {currentStep && status === 'deploying' && (
            <div className="text-brand-400 text-sm mb-2 font-medium">{currentStep}</div>
          )}
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-green-800 font-medium mb-2">Success!</h3>
          <p className="text-sm text-green-700 whitespace-pre-wrap">{successMsg}</p>

          {state.deployTarget === 'docker' && (
            <div className="mt-4 bg-green-100 rounded-lg p-3">
              <p className="text-xs text-green-800 font-medium mb-1">Next steps:</p>
              <pre className="text-xs text-green-700 font-mono">
{`cd ${state.outputDir}
docker compose up -d
docker compose logs -f`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
