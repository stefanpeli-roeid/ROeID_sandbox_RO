import React, { useState } from "react";

interface LandingPageProps {
  requestUrl: string;
  setRequestUrl: (url: string) => void;
  onNext: () => void;
  isValidating: boolean;
  error: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  requestUrl,
  setRequestUrl,
  onNext,
  isValidating,
  error,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#111111] mb-2">
            Testează Cererea de Prezentare
          </h2>
          <p className="text-[#5b5b5b]">
            Introduceți URL-ul de autorizare pentru analiza conformității și simularea răspunsului din portofelul electronic
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="url-input" className="block text-sm font-bold text-slate-800">
                URL de Autorizare (Authorization Request)
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                openid4vp:// sau https://
              </span>
            </div>
            <input
              id="url-input"
              type="text"
              value={requestUrl}
              onChange={(e) => setRequestUrl(e.target.value)}
              className="w-full block font-mono text-sm sm:text-base p-4 bg-white border-2 border-blue-600/80 hover:border-blue-600 focus:border-blue-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 shadow-sm hover:shadow-md focus:shadow-lg focus:shadow-blue-500/15 transition-all duration-200 outline-none text-slate-900 font-medium placeholder:text-slate-400"
              placeholder="ex. openid4vp://?client_id=...&request_uri=https://..."
            />
            <p className="text-xs text-slate-500 mt-2">
              Puteți prelua acest URL din codul QR afișat de Relying Party, din deep-link sau din redirect-ul web.
            </p>
          </div>

          {/* Quick-fill Sample buttons */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              🚀 Sau încearcă rapid o cerere demonstrativă:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRequestUrl("openid4vp://?client_id=x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE&response_uri=https://servicii.mai.gov.ro/oid4vp/response&response_mode=direct_post.jwt&nonce=nonce-ro-test-2026&response_type=vp_token")}
                className="text-xs font-semibold px-3 py-1.5 bg-white border border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-blue-800 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>🇷🇴</span> Exemplu Servicii România (MAI / IGSU)
              </button>
              <button
                type="button"
                onClick={() => setRequestUrl("openid4vp://?client_id=x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE&response_uri=https://verifier.example.com/response&response_mode=direct_post.jwt&nonce=demo-nonce-eudi-123&response_type=vp_token")}
                className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 text-slate-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span>🇪🇺</span> Exemplu Standard EUDI HAIP
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="issue-card issue-card--error">
              <div className="issue-card__icon">✗</div>
              <div className="issue-card__content">
                <div className="issue-card__title">Eroare de validare URL</div>
                <div className="issue-card__description">{error}</div>
              </div>
            </div>
          )}

          <button
            onClick={onNext}
            disabled={isValidating || !requestUrl.trim()}
            className="btn-primary w-full text-base py-3.5 shadow-md shadow-blue-600/30"
          >
            {isValidating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Validare în curs...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Continuă la Configurare</span>
                <span className="text-xl leading-none">→</span>
              </span>
            )}
          </button>

          {/* How to use ERICA button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-full text-sm text-slate-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-2 py-2 transition"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ghid: Cum funcționează ERICA?
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInfoModal(false)}>
          <div className="card max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-[#111111]">Cum funcționează ERICA</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-[#5b5b5b] hover:text-[#111111] transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 text-[#5b5b5b]">
              <div>
                <h4 className="font-semibold text-[#111111] mb-2">Pasul 1: Introduceți URL-ul de autorizare</h4>
                <p className="text-sm">Lipiți URL-ul de autorizare generat de aplicația Relying Party (Verificator). Acesta poate fi un deep link <code>openid4vp://</code> sau un URL <code>https://</code>.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#111111] mb-2">Pasul 2: Configurați simularea portofelului</h4>
                <p className="text-sm">Alegeți modul în care va reacționa portofelul simulat – ca portofel conform standardului EUDI sau generând erori deliberate pentru a testa robustețea verificatorului.</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#111111] mb-2">Pasul 3: Examinați rezultatele și recomandările</h4>
                <p className="text-sm">ERICA va valida cererea, va simula răspunsul criptografic și va afișa o analiză detaliată a conformității, însoțită de sugestii precise de remediere.</p>
              </div>
              <div className="suggestion-box mt-4">
                <div className="suggestion-box__icon">💡</div>
                <div className="suggestion-box__content">
                  <div className="suggestion-box__label">Sfat Util</div>
                  <div className="suggestion-box__text">Folosiți modul „Editor Cereri” pentru a redacta, personaliza și valida cereri OpenID4VP de la zero pe baza șabloanelor românești sau europene.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
