import React from 'react';
import { WizardProvider, useWizard } from './hooks/useWizardState';
import { WizardLayout } from './components/WizardLayout';
import { Welcome } from './pages/Welcome';
import { AiProviders } from './pages/AiProviders';
import { EnvVarPage } from './pages/EnvVarPage';
import { Review } from './pages/Review';
import { Deploy } from './pages/Deploy';

function WizardContent() {
  const { state } = useWizard();

  const pages: Record<number, React.ReactNode> = {
    0: <Welcome />,
    1: (
      <EnvVarPage
        categoryId="core"
        title="Core Settings"
        description="Essential configuration for your Moltbot instance."
      />
    ),
    2: <AiProviders />,
    3: (
      <EnvVarPage
        categoryId="auth"
        title="Authentication"
        description="Protect your Moltbot instance from unauthorized access."
      />
    ),
    4: (
      <EnvVarPage
        categoryId="chat_platforms"
        title="Chat Platforms"
        description="Connect Moltbot to Telegram, Discord, or Slack."
        optional
      />
    ),
    5: (
      <EnvVarPage
        categoryId="storage"
        title="Persistent Storage"
        description={
          state.deployTarget === 'docker'
            ? 'Docker uses local volumes by default. No configuration needed.'
            : 'Configure R2 credentials for persistent storage across deployments.'
        }
        optional
      />
    ),
    6: (
      <EnvVarPage
        categoryId="browser"
        title="Browser Rendering"
        description="Enable web browsing and screenshot capabilities for Moltbot."
        optional
      />
    ),
    7: (
      <EnvVarPage
        categoryId="integrations"
        title="Integrations"
        description="Connect to external services like RecruitFlow, LinkedIn, and more."
        optional
      />
    ),
    8: <Review />,
    9: <Deploy />,
  };

  return <WizardLayout>{pages[state.currentStep] || <Welcome />}</WizardLayout>;
}

export function App() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
