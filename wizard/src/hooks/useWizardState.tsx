import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

export type DeployTarget = 'cloudflare' | 'docker' | null;
export type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

export interface WizardState {
  deployTarget: DeployTarget;
  currentStep: number;
  envVars: Record<string, string>;
  browserEnabled: boolean;
  outputDir: string;
  deployStatus: DeployStatus;
  deployLogs: string[];
  validation: Record<string, { valid: boolean; message?: string }>;
}

type Action =
  | { type: 'SET_DEPLOY_TARGET'; target: DeployTarget }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_VAR'; key: string; value: string }
  | { type: 'SET_VARS'; vars: Record<string, string> }
  | { type: 'SET_BROWSER_ENABLED'; enabled: boolean }
  | { type: 'SET_OUTPUT_DIR'; dir: string }
  | { type: 'SET_DEPLOY_STATUS'; status: DeployStatus }
  | { type: 'ADD_DEPLOY_LOG'; log: string }
  | { type: 'CLEAR_DEPLOY_LOGS' }
  | { type: 'SET_VALIDATION'; key: string; valid: boolean; message?: string };

export const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: '1' },
  { id: 'core', label: 'Core Settings', icon: '2' },
  { id: 'ai', label: 'AI Providers', icon: '3' },
  { id: 'auth', label: 'Authentication', icon: '4' },
  { id: 'chat', label: 'Chat Platforms', icon: '5' },
  { id: 'storage', label: 'Storage', icon: '6' },
  { id: 'browser', label: 'Browser', icon: '7' },
  { id: 'integrations', label: 'Integrations', icon: '8' },
  { id: 'review', label: 'Review', icon: '9' },
  { id: 'deploy', label: 'Deploy', icon: '10' },
] as const;

const initialState: WizardState = {
  deployTarget: null,
  currentStep: 0,
  envVars: {},
  browserEnabled: false,
  outputDir: '~/moltbot-deploy',
  deployStatus: 'idle',
  deployLogs: [],
  validation: {},
};

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_DEPLOY_TARGET':
      return { ...state, deployTarget: action.target };
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, STEPS.length - 1) };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case 'SET_VAR':
      return { ...state, envVars: { ...state.envVars, [action.key]: action.value } };
    case 'SET_VARS':
      return { ...state, envVars: { ...state.envVars, ...action.vars } };
    case 'SET_BROWSER_ENABLED':
      return { ...state, browserEnabled: action.enabled };
    case 'SET_OUTPUT_DIR':
      return { ...state, outputDir: action.dir };
    case 'SET_DEPLOY_STATUS':
      return { ...state, deployStatus: action.status };
    case 'ADD_DEPLOY_LOG':
      return { ...state, deployLogs: [...state.deployLogs, action.log] };
    case 'CLEAR_DEPLOY_LOGS':
      return { ...state, deployLogs: [] };
    case 'SET_VALIDATION':
      return {
        ...state,
        validation: {
          ...state.validation,
          [action.key]: { valid: action.valid, message: action.message },
        },
      };
    default:
      return state;
  }
}

const WizardContext = createContext<{
  state: WizardState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be inside WizardProvider');
  return ctx;
}
