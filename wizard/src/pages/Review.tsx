import React, { useEffect, useState } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { StepNavigation } from '../components/StepNavigation';
import { validateVars } from '../lib/api';

export function Review() {
  const { state, dispatch } = useWizard();
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.deployTarget) return;
    validateVars(state.envVars, state.deployTarget).then((result) => {
      setValidation(result);
      setLoading(false);
    });
  }, [state.envVars, state.deployTarget]);

  const configuredVars = Object.entries(state.envVars).filter(([, v]) => v?.trim());

  const maskValue = (key: string, value: string) => {
    const sensitivePatterns = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
    const isSensitive = sensitivePatterns.some((p) => key.includes(p));
    if (!isSensitive) return value;
    if (value.length <= 8) return '****';
    return value.slice(0, 4) + '****' + value.slice(-4);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Configuration</h2>
      <p className="text-gray-600 mb-6">
        Review your settings before deploying to{' '}
        {state.deployTarget === 'cloudflare' ? 'Cloudflare Workers' : 'Docker'}.
      </p>

      {/* Validation results */}
      {loading ? (
        <div className="text-gray-400 mb-4">Validating...</div>
      ) : validation ? (
        <div className="mb-6">
          {validation.valid ? (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
              All required fields are configured correctly.
            </div>
          ) : (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((e: any, i: number) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm mt-3">
              <p className="font-medium mb-2">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((w: any, i: number) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Configured variables */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">
            {configuredVars.length} variables configured
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {configuredVars.map(([key, value]) => (
            <div key={key} className="px-4 py-2 flex justify-between items-center">
              <span className="text-sm font-mono text-gray-700">{key}</span>
              <span className="text-sm text-gray-400 font-mono">{maskValue(key, value)}</span>
            </div>
          ))}
          {configuredVars.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              No variables configured yet. Go back to fill in your settings.
            </div>
          )}
        </div>
      </div>

      {/* Output directory */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Output Directory</label>
        <input
          type="text"
          value={state.outputDir}
          onChange={(e) => dispatch({ type: 'SET_OUTPUT_DIR', dir: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Generated files will be saved here
        </p>
      </div>

      <StepNavigation
        canProceed={!loading && validation?.valid}
        nextLabel="Deploy"
      />
    </div>
  );
}
