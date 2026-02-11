import React from 'react';
import { useWizard, STEPS } from '../hooks/useWizardState';

interface StepNavigationProps {
  canProceed?: boolean;
  onNext?: () => void;
  nextLabel?: string;
  hideBack?: boolean;
}

export function StepNavigation({
  canProceed = true,
  onNext,
  nextLabel,
  hideBack,
}: StepNavigationProps) {
  const { state, dispatch } = useWizard();
  const isFirst = state.currentStep === 0;
  const isLast = state.currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
      {!isFirst && !hideBack ? (
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          Back
        </button>
      ) : (
        <div />
      )}

      {!isLast && (
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            canProceed
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {nextLabel || 'Continue'}
        </button>
      )}
    </div>
  );
}
