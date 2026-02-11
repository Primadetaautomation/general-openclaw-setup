import React, { useState } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { generateToken } from '../lib/api';

interface EnvVarInputProps {
  varKey: string;
  type: string;
  required: boolean;
  description: string;
  hint?: string;
  options?: string[];
  defaultValue?: string;
  generate?: boolean;
}

export function EnvVarInput({
  varKey,
  type,
  required,
  description,
  hint,
  options,
  defaultValue,
  generate,
}: EnvVarInputProps) {
  const { state, dispatch } = useWizard();
  const value = state.envVars[varKey] || '';
  const [showSecret, setShowSecret] = useState(false);

  const isSecret = type === 'token' || type === 'api_key';

  const handleChange = (newValue: string) => {
    dispatch({ type: 'SET_VAR', key: varKey, value: newValue });
  };

  const handleGenerate = async () => {
    const token = await generateToken();
    dispatch({ type: 'SET_VAR', key: varKey, value: token });
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {varKey}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>

      <div className="flex gap-2">
        {type === 'enum' && options ? (
          <select
            value={value || defaultValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">-- Select --</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : type === 'boolean' ? (
          <select
            value={value || defaultValue || 'false'}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        ) : (
          <div className="flex-1 relative">
            <input
              type={isSecret && !showSecret ? 'password' : 'text'}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={hint || `Enter ${varKey}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
            />
            {isSecret && value && (
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showSecret ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        )}

        {generate && (
          <button
            type="button"
            onClick={handleGenerate}
            className="px-3 py-2 bg-brand-100 text-brand-700 rounded-lg text-sm hover:bg-brand-200 transition-colors whitespace-nowrap"
          >
            Generate
          </button>
        )}
      </div>
    </div>
  );
}
