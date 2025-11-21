'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  illustration?: string; // Optional emoji or icon
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Observation Planning',
    description: "ISO Tracker helps you find the best times to observe interstellar objects from your location. Let's get you started!",
    illustration: '🔭',
  },
  {
    title: 'Set Your Location',
    description: 'First, tell us where you are. You can use GPS or search for your city. Your location stays private on your device only.',
    illustration: '📍',
  },
  {
    title: 'Check Visibility',
    description: 'See if the object is currently visible from your location. Green = visible now, Red = below horizon.',
    illustration: '👁️',
  },
  {
    title: 'Plan Your Observations',
    description: 'View upcoming visibility windows showing the best times to observe. Add them to your calendar with one click!',
    illustration: '📅',
  },
  {
    title: 'Find It In the Sky',
    description: 'Use the sky map and altitude/azimuth coordinates to point your telescope at the right spot in the sky.',
    illustration: '🌌',
  },
];

const ONBOARDING_STORAGE_KEY = 'iso_tracker_observation_onboarding_complete';

interface ObservationOnboardingProps {
  onComplete?: () => void;
}

export default function ObservationOnboarding({
  onComplete,
}: ObservationOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      // Show onboarding for first-time users
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close onboarding"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Illustration */}
          {step.illustration && (
            <div className="text-center mb-6">
              <div className="text-6xl">{step.illustration}</div>
            </div>
          )}

          {/* Step Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
            {step.title}
          </h2>

          {/* Step Description */}
          <p className="text-gray-700 text-center mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          {/* Step Counter */}
          <p className="text-sm text-gray-500 text-center mb-6">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip Button */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manually trigger onboarding
 */
export function useObservationOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  };

  const hasCompletedOnboarding = () => {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  };

  return {
    resetOnboarding,
    hasCompletedOnboarding,
  };
}
