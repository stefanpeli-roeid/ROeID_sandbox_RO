import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useVerifierSession } from "../../hooks/useVerifierSession.js";
import { ChecksDisplay } from "../../components/ChecksDisplay.js";
import { WalletResponseInspector } from "../../components/WalletResponseInspector.js";
import { CreateVerifierSessionResult, VerifierFormat, VerifierSessionData } from "../../types.js";

type VerifierStep = "setup" | "waiting" | "results";

const POLL_INTERVAL_MS = 2000;

export const VerifierMode: React.FC = () => {
  const [step, setStep] = useState<VerifierStep>("setup");
  const [format, setFormat] = useState<VerifierFormat>("dc+sd-jwt");
  const [session, setSession] = useState<CreateVerifierSessionResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<VerifierSessionData | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { createSession, pollSession, isCreating } = useVerifierSession();
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const handleCreateSession = async () => {
    setCreateError(null);
    const result = await createSession(format);

    if (!result.success || !result.session) {
      setCreateError("Failed to create verifier session. Check that the API server is reachable.");
      return;
    }

    setSession(result.session);
    setStep("waiting");

    try {
      const dataUrl = await QRCode.toDataURL(result.session.deepLink, { width: 280, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch {
      setQrDataUrl(null);
    }

    const sessionId = result.session.sessionId;
    pollTimer.current = setInterval(async () => {
      const poll = await pollSession(sessionId);
      if (!poll.success || !poll.data) return;

      setSessionData(poll.data);

      if (poll.data.status === "RECEIVED" || poll.data.status === "ERROR" || poll.data.status === "EXPIRED") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setStep("results");
      }
    }, POLL_INTERVAL_MS);
  };

  const handleStartOver = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setStep("setup");
    setSession(null);
    setQrDataUrl(null);
    setSessionData(null);
    setCreateError(null);
  };

  return (
    <>
      {step === "setup" && (
        <div className="max-w-3xl mx-auto">
          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#111111] mb-2">Verificare Live Portofel Real</h2>
              <p className="text-[#5b5b5b]">
                ERICA acționează ca Verificator (Relying Party): generează o cerere reală OpenID4VP pentru identitate electronică (PID) pe care orice Portofel EUDI o poate procesa, urmată de validarea criptografică completă a răspunsului – inclusiv verificări DeviceAuth/COSE pentru formatul mdoc.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Formatul Credențialului Solicitat</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat("dc+sd-jwt")}
                    className={`px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      format === "dc+sd-jwt"
                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span>📄 SD-JWT VC</span>
                    {format === "dc+sd-jwt" && <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.2">✓</span>}
                  </button>
                  <button
                    onClick={() => setFormat("mso_mdoc")}
                    className={`px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      format === "mso_mdoc"
                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span>📱 mDoc (ISO 18013-5)</span>
                    {format === "mso_mdoc" && <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.2">✓</span>}
                  </button>
                </div>
              </div>

              {createError && (
                <div className="issue-card issue-card--error">
                  <div className="issue-card__icon">✗</div>
                  <div className="issue-card__content">
                    <div className="issue-card__title">Eroare de conectare</div>
                    <div className="issue-card__description">{createError}</div>
                  </div>
                </div>
              )}

              <div className="suggestion-box">
                <div className="suggestion-box__icon">💡</div>
                <div className="suggestion-box__content">
                  <div className="suggestion-box__label">Scanare cu un telefon fizic</div>
                  <div className="suggestion-box__text">
                    Telefonul mobil va scana codul QR și va comunica cu acest server prin OpenID4VP. Dacă testați pe un telefon real, asigurați-vă că serverul este accesibil public.
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="btn-primary w-full text-base py-4 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Generare sesiune verificator...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>Generează Cod QR Verificator (Live Verifier)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "waiting" && session && (
        <div className="max-w-3xl mx-auto">
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-[#111111] mb-2">Scanează cu Portofelul Electronic</h2>
            <p className="text-[#5b5b5b] mb-6">
              Se așteaptă răspunsul portofelului ({format === "mso_mdoc" ? "mDoc" : "SD-JWT VC"})...
            </p>

            {qrDataUrl ? (
              <img src={qrDataUrl} alt="OpenID4VP request QR code" className="mx-auto rounded-lg border border-[#e6e1db]" />
            ) : (
              <div className="text-sm text-[#5b5b5b]">Generarea codului QR a eșuat – folosiți link-ul direct de mai jos.</div>
            )}

            <div className="mt-6 text-left">
              <label className="block text-sm font-medium text-[#111111] mb-2">Legătură Directă (Deep Link)</label>
              <div className="font-mono text-xs p-3 bg-[#f7f5f2] rounded-lg border border-[#e6e1db] break-all">
                {session.deepLink}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#5b5b5b]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#5E7C99] animate-pulse" />
              Se așteaptă răspunsul de la portofel...
            </div>

            <button onClick={handleStartOver} className="btn-secondary w-full mt-6 text-sm font-semibold">
              Anulează Sesiunea (Cancel)
            </button>
          </div>
        </div>
      )}

      {step === "results" && sessionData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleStartOver}
              className="text-sm font-bold text-slate-700 hover:text-blue-700 bg-white border border-slate-300 hover:border-blue-400 px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              ← Începe o Nouă Verificare
            </button>
            <span className="text-sm px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
              Stare: <strong className="text-slate-900">{sessionData.status}</strong>
            </span>
          </div>

          {sessionData.status === "ERROR" && (
            <div className="issue-card issue-card--error">
              <div className="issue-card__icon">✗</div>
              <div className="issue-card__content">
                <div className="issue-card__title">Verificarea a Eșuat</div>
                <div className="issue-card__description">{sessionData.error || "Eroare necunoscută"}</div>
              </div>
            </div>
          )}

          {sessionData.status === "EXPIRED" && (
            <div className="issue-card issue-card--error">
              <div className="issue-card__icon">⏱</div>
              <div className="issue-card__content">
                <div className="issue-card__title">Sesiunea a Expirat</div>
                <div className="issue-card__description">Nu s-a primit niciun răspuns de la portofel înainte de expirarea intervalului alocat.</div>
              </div>
            </div>
          )}

          {sessionData.responseValidation && (
            <div>
              <h2 className="section-header">Validare Criptografică a Răspunsului</h2>
              <ChecksDisplay checks={sessionData.responseValidation.checks || []} title="Verificări de Conformitate ale Răspunsului" />
            </div>
          )}

          {sessionData.decodedVPTokens && sessionData.decodedVPTokens.length > 0 && (
            <div>
              <h2 className="section-header">Răspuns Portofel Decodificat</h2>
              <WalletResponseInspector
                response={{
                  vp_token: sessionData.rawResponse ? JSON.parse(sessionData.rawResponse) : undefined,
                  decodedVPTokens: sessionData.decodedVPTokens,
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
