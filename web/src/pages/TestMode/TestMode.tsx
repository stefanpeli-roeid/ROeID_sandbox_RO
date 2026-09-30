import React, { useState } from "react";
import { LandingPage } from "./LandingPage.js";
import { ConfigurationPage } from "./ConfigurationPage.js";
import { ResultsPage } from "./ResultsPage.js";
import { useUrlValidation } from "../../hooks/useUrlValidation.js";
import { useTestExecution } from "../../hooks/useTestExecution.js";
import { DebuggerSession, Profile, SimulationMode, PIDTemplate } from "../../types.js";

type TestStep = 'input' | 'configure' | 'results';

export const TestMode: React.FC = () => {
  const [step, setStep] = useState<TestStep>('input');
  const [requestUrl, setRequestUrl] = useState('');
  const [parsedRequest, setParsedRequest] = useState<any>(null);
  const [session, setSession] = useState<DebuggerSession | null>(null);

  // Configuration options
  const [simulationMode, setSimulationMode] = useState<SimulationMode>(SimulationMode.VALID);
  const [pidTemplate, setPidTemplate] = useState<PIDTemplate>(PIDTemplate.NORMAL);
  const [preferredFormat, setPreferredFormat] = useState<'dc+sd-jwt' | 'mso_mdoc'>('dc+sd-jwt');
  const [profile, setProfile] = useState<Profile>(Profile.PID_PRESENTATION);

  const { validateUrl, isValidating, error, setError } = useUrlValidation();
  const { executeTest, isLoading } = useTestExecution();

  const handleNext = async () => {
    const result = await validateUrl(requestUrl);
    if (result.success) {
      setParsedRequest(result.request);
      setStep('configure');
    }
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  const handleTest = async () => {
    const result = await executeTest(
      parsedRequest,
      profile,
      simulationMode,
      pidTemplate,
      preferredFormat
    );

    if (result.success && result.session) {
      setSession(result.session);
      setStep('results');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setRequestUrl('');
    setParsedRequest(null);
    setSession(null);
    setError(null);
  };

  return (
    <>
      {step === 'input' && (
        <LandingPage
          requestUrl={requestUrl}
          setRequestUrl={setRequestUrl}
          onNext={handleNext}
          isValidating={isValidating}
          error={error}
        />
      )}

      {step === 'configure' && (
        <ConfigurationPage
          parsedRequest={parsedRequest}
          simulationMode={simulationMode}
          setSimulationMode={setSimulationMode}
          pidTemplate={pidTemplate}
          setPidTemplate={setPidTemplate}
          preferredFormat={preferredFormat}
          setPreferredFormat={setPreferredFormat}
          profile={profile}
          setProfile={setProfile}
          onBack={handleBack}
          onTest={handleTest}
          isLoading={isLoading}
        />
      )}

      {step === 'results' && session && (
        <ResultsPage session={session} onStartOver={handleStartOver} />
      )}
    </>
  );
};
