import React, { useEffect, useState } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { EnvVarInput } from '../components/EnvVarInput';
import { StepNavigation } from '../components/StepNavigation';
import { fetchSchema } from '../lib/api';

interface EnvVarPageProps {
  categoryId: string;
  title: string;
  description: string;
  optional?: boolean;
}

interface SchemaVar {
  key: string;
  type: string;
  required: boolean;
  description: string;
  hint?: string;
  pattern?: string;
  default?: string;
  options?: string[];
  generate?: boolean;
  platform: string;
}

interface SchemaCategory {
  id: string;
  label: string;
  description: string;
  vars: SchemaVar[];
}

export function EnvVarPage({ categoryId, title, description, optional }: EnvVarPageProps) {
  const { state } = useWizard();
  const [vars, setVars] = useState<SchemaVar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.deployTarget) return;
    fetchSchema(state.deployTarget).then((schema: SchemaCategory[]) => {
      const category = schema.find((c: SchemaCategory) => c.id === categoryId);
      setVars(category?.vars || []);
      setLoading(false);
    });
  }, [categoryId, state.deployTarget]);

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  if (vars.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 mb-4">
          This section is not applicable for {state.deployTarget === 'cloudflare' ? 'Cloudflare' : 'Docker'} deployments.
        </p>
        <StepNavigation />
      </div>
    );
  }

  const hasRequiredEmpty = vars
    .filter((v) => v.required)
    .some((v) => !state.envVars[v.key]?.trim());

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>

      {optional && (
        <p className="text-sm text-brand-600 bg-brand-50 px-3 py-2 rounded-lg mb-6">
          All fields on this page are optional. Skip if you don't need them.
        </p>
      )}

      <div className="space-y-2">
        {vars.map((v) => (
          <EnvVarInput
            key={v.key}
            varKey={v.key}
            type={v.type}
            required={v.required}
            description={v.description}
            hint={v.hint}
            options={v.options}
            defaultValue={v.default}
            generate={v.generate}
          />
        ))}
      </div>

      <StepNavigation canProceed={optional || !hasRequiredEmpty} />
    </div>
  );
}
