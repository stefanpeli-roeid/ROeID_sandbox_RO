import React, { useState } from "react";
import { ChecksDisplay } from "../../components/ChecksDisplay.js";
import { Profile } from "../../types.js";
import { useEditorValidation } from "../../hooks/useEditorValidation.js";
import { createPIDTemplate, createPIDRomaniaTemplate, createPIDMdocTemplate, createEAATemplate } from "../../utils/templates.js";

export const EditorMode: React.FC = () => {
  const [editorRequestJson, setEditorRequestJson] = useState('');
  const [editorProfile, setEditorProfile] = useState<Profile>(Profile.PID_PRESENTATION);
  const [jsonCopied, setJsonCopied] = useState(false);

  const { validateRequest, isValidating, validationResult, clearValidation } = useEditorValidation();

  const handleLoadTemplate = (template: 'pid' | 'pid-ro' | 'pid-mdoc' | 'eaa') => {
    if (template === 'pid') {
      setEditorRequestJson(JSON.stringify(createPIDTemplate(), null, 2));
      setEditorProfile(Profile.PID_PRESENTATION);
    } else if (template === 'pid-ro') {
      setEditorRequestJson(JSON.stringify(createPIDRomaniaTemplate(), null, 2));
      setEditorProfile(Profile.PID_PRESENTATION);
    } else if (template === 'pid-mdoc') {
      setEditorRequestJson(JSON.stringify(createPIDMdocTemplate(), null, 2));
      setEditorProfile(Profile.PID_PRESENTATION);
    } else if (template === 'eaa') {
      setEditorRequestJson(JSON.stringify(createEAATemplate(), null, 2));
      setEditorProfile(Profile.BASE_OPENID4VP);
    }
    clearValidation();
  };

  const handleValidate = () => {
    validateRequest(editorRequestJson, editorProfile);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-[#111111] mb-4">Editor Cereri de Prezentare</h2>
        <p className="text-[#5b5b5b] mb-6">
          Construiți și validați cereri de prezentare OpenID4VP conforme cu standardele europene. Alegeți un șablon demonstrativ sau introduceți propriul JSON.
        </p>

        {/* Template Selector */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-800 mb-3">
            Încarcă un Șablon Predefinit (Templates)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              onClick={() => handleLoadTemplate('pid-ro')}
              className="p-4 text-left rounded-xl border-2 border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/70 transition shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">🇷🇴 PID România</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">ACTIV</span>
                </div>
                <div className="text-xs text-slate-600">EUDI / CNP / MAI / IGSU</div>
              </div>
              <div className="text-xs text-emerald-800 font-bold mt-3 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Încarcă șablon RO <span>→</span>
              </div>
            </button>

            <button
              onClick={() => handleLoadTemplate('pid')}
              className="p-4 text-left rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 transition shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm mb-1">🇩🇪 PID Standard (SD-JWT)</div>
                <div className="text-xs text-slate-600">Format dc+sd-jwt</div>
              </div>
              <div className="text-xs text-blue-700 font-bold mt-3 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Încarcă SD-JWT <span>→</span>
              </div>
            </button>

            <button
              onClick={() => handleLoadTemplate('pid-mdoc')}
              className="p-4 text-left rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 transition shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm mb-1">📱 PID mDoc (ISO 18013-5)</div>
                <div className="text-xs text-slate-600">Format mso_mdoc</div>
              </div>
              <div className="text-xs text-blue-700 font-bold mt-3 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Încarcă mDoc <span>→</span>
              </div>
            </button>

            <button
              onClick={() => handleLoadTemplate('eaa')}
              className="p-4 text-left rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 transition shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-slate-900 text-sm mb-1">🎓 Atestat Educațional (EAA)</div>
                <div className="text-xs text-slate-600">Electronic Attribute Attestation</div>
              </div>
              <div className="text-xs text-blue-700 font-bold mt-3 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Încarcă EAA <span>→</span>
              </div>
            </button>
          </div>
        </div>

        {/* Validation Profile Selector */}
        <div className="mb-6">
          <label htmlFor="editor-profile" className="block text-sm font-medium text-[#111111] mb-2">
            Profil de Validare
          </label>
          <select
            id="editor-profile"
            value={editorProfile}
            onChange={(e) => setEditorProfile(e.target.value as Profile)}
            className="w-full px-3 py-2 border border-[#e6e1db] rounded-lg focus:ring-2 focus:ring-[#4F6F63] text-sm bg-white transition"
          >
            <option value={Profile.PID_PRESENTATION}>Prezentare PID (EUDI ARF)</option>
            <option value={Profile.BASE_OPENID4VP}>OpenID4VP de Bază</option>
          </select>
          <p className="text-xs text-[#5b5b5b] mt-1">
            Stabilește regulile de conformitate și securitate aplicate în timpul validării cererii.
          </p>
        </div>

        {/* JSON Editor */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="editor-json" className="block text-sm font-medium text-[#111111]">
              Structură JSON a Cererii
            </label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(editorRequestJson);
                setJsonCopied(true);
                setTimeout(() => setJsonCopied(false), 2000);
              }}
              disabled={!editorRequestJson.trim()}
              className="text-xs px-3 py-1.5 border border-[#e6e1db] hover:border-[#4F6F63] hover:bg-[#E9F0EA] disabled:bg-[#f7f5f2] disabled:text-[#5b5b5b] disabled:border-[#e6e1db] text-[#111111] rounded-lg transition font-medium flex items-center gap-1.5"
            >
              {jsonCopied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiat!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiază JSON
                </>
              )}
            </button>
          </div>
          <textarea
            id="editor-json"
            value={editorRequestJson}
            onChange={(e) => {
              setEditorRequestJson(e.target.value);
              clearValidation();
            }}
            className="w-full h-96 font-mono text-sm p-4 border border-[#e6e1db] rounded-lg focus:ring-2 focus:ring-[#4F6F63] focus:border-[#4F6F63] transition"
            placeholder="Lipiți sau editați structura JSON a cererii de prezentare aici..."
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleValidate}
          disabled={!editorRequestJson.trim() || isValidating}
          className="btn-primary w-full text-base py-4 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Validare sintaxă & securitate în curs...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Validează Cererea (Validate Presentation Request)</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="card">
          <h3 className="text-xl font-bold text-[#111111] mb-4">Rezultatele Validării</h3>

          {/* Status Badge */}
          <div className="mb-6">
            {validationResult.valid ? (
              <div className="status-badge status-badge--success">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cerere Conformă / Validă
              </div>
            ) : (
              <div className="status-badge status-badge--error">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cerere Neconformă / Erori Detectate
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {validationResult.summary && (
            <div className="mb-6 p-4 bg-[#f7f5f2] rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#111111]">
                    {validationResult.summary.totalChecks || 0}
                  </div>
                  <div className="text-xs text-[#5b5b5b]">Total Verificări</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.summary.passedChecks || 0}
                  </div>
                  <div className="text-xs text-[#5b5b5b]">Trecute</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {validationResult.summary.failedChecks || 0}
                  </div>
                  <div className="text-xs text-[#5b5b5b]">Eșuate</div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Checks Display */}
          {validationResult.checks && validationResult.checks.length > 0 && (
            <ChecksDisplay
              checks={validationResult.checks}
              title="Verificări Detaliate de Conformitate"
            />
          )}
        </div>
      )}
    </div>
  );
};
