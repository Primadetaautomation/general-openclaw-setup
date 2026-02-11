import React, { useEffect, useState } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { EnvVarInput } from '../components/EnvVarInput';
import { StepNavigation } from '../components/StepNavigation';
import { fetchSchema } from '../lib/api';

const AI_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'TOGETHER_API_KEY',
  'XAI_API_KEY',
  'AI_GATEWAY_API_KEY',
];

export function AiProviders() {
  const { state } = useWizard();
  const [vars, setVars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.deployTarget) return;
    fetchSchema(state.deployTarget).then((schema: any[]) => {
      // Combine ai_providers and ai_gateway categories
      const aiVars = schema
        .filter((c: any) => c.id === 'ai_providers' || c.id === 'ai_gateway')
        .flatMap((c: any) => c.vars);
      setVars(aiVars);
      setLoading(false);
    });
  }, [state.deployTarget]);

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const hasAtLeastOneProvider = AI_KEYS.some((k) => state.envVars[k]?.trim());

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Providers</h2>
      <p className="text-gray-600 mb-4">
        Configure at least one AI provider. Anthropic (Claude) is recommended.
      </p>

      {!hasAtLeastOneProvider && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-6">
          At least one AI provider API key is required.
        </p>
      )}

      <div className="space-y-2">
        {vars.map((v: any) => (
          <EnvVarInput
            key={v.key}
            varKey={v.key}
            type={v.type}
            required={false}
            description={v.description}
            hint={v.hint}
            options={v.options}
            defaultValue={v.default}
            generate={v.generate}
          />
        ))}
      </div>

      <StepNavigation canProceed={hasAtLeastOneProvider} />
    </div>
  );
}
