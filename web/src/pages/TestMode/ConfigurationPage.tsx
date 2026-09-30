import React from "react";
import { Profile, SimulationMode, PIDTemplate } from "../../types.js";

interface ConfigurationPageProps {
  parsedRequest: any;
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;
  pidTemplate: PIDTemplate;
  setPidTemplate: (template: PIDTemplate) => void;
  preferredFormat: 'dc+sd-jwt' | 'mso_mdoc';
  setPreferredFormat: (format: 'dc+sd-jwt' | 'mso_mdoc') => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onBack: () => void;
  onTest: () => void;
  isLoading: boolean;
}

export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({
  parsedRequest,
  simulationMode,
  setSimulationMode,
  pidTemplate,
  setPidTemplate,
  preferredFormat,
  setPreferredFormat,
  profile,
  setProfile,
  onBack,
  onTest,
  isLoading,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            ← Înapoi la URL
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Pasul 2 din 3: Configurare Wallet
          </span>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#111111] mb-2">
            Configurare Simulare Portofel
          </h2>
          <p className="text-[#5b5b5b]">
            Alegeți comportamentul portofelului simulat pentru a testa diferite scenarii de conformitate și eroare
          </p>
        </div>

        <div className="space-y-6">
          {/* Wallet Simulation Mode */}
          <div>
            <label htmlFor="simulation-mode" className="block text-base font-semibold text-[#111111] mb-3">
              Mod Simulare Portofel (Behavior)
            </label>
            <select
              id="simulation-mode"
              value={simulationMode}
              onChange={(e) => setSimulationMode(e.target.value as SimulationMode)}
              className="w-full px-4 py-3 border border-[#e6e1db] rounded-lg focus:ring-2 focus:ring-[#4F6F63] focus:border-[#4F6F63] text-sm bg-white transition"
            >
              <optgroup label="Conform Standardelor">
                <option value={SimulationMode.VALID}>✓ Portofel Valid / Conform Standardelor EUDI</option>
              </optgroup>
              <optgroup label="Valabilitate Credențial">
                <option value={SimulationMode.EXPIRED}>⏰ Credențial Expirat (Expired Credential)</option>
                <option value={SimulationMode.NOT_YET_VALID}>⏳ Credențial Încă Nevalid (Not-Yet-Valid)</option>
              </optgroup>
              <optgroup label="Probleme Semnătură Criptografică">
                <option value={SimulationMode.INVALID_SIGNATURE}>✗ Semnătură Invalidă</option>
                <option value={SimulationMode.MISSING_SIGNATURE}>⚠ Semnătură Lipsă</option>
              </optgroup>
              <optgroup label="Probleme Atribute (Claims)">
                <option value={SimulationMode.MISSING_CLAIMS}>📋 Atribute Solicitate Lipsă</option>
                <option value={SimulationMode.OVER_DISCLOSURE}>📤 Supradezvăluire de Date (Over-Disclosure)</option>
              </optgroup>
              <optgroup label="Probleme Legare Criptografică (Binding)">
                <option value={SimulationMode.WRONG_NONCE}>🔢 Nonce Incorect</option>
                <option value={SimulationMode.MISSING_HOLDER_BINDING}>🔗 Lipsă Legătură Posesor (Holder Binding)</option>
                <option value={SimulationMode.WRONG_AUDIENCE}>👥 Audiență Incorectă (Wrong Audience)</option>
              </optgroup>
            </select>
            <p className="text-xs text-[#5b5b5b] mt-2">
              Testați modul în care aplicația Relying Party gestionează răspunsurile conforme sau situațiile anormale de eroare.
            </p>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="credential-format" className="block text-sm font-medium text-[#111111] mb-2">
                Format Credențial
              </label>
              <select
                id="credential-format"
                value={preferredFormat}
                onChange={(e) => setPreferredFormat(e.target.value as 'dc+sd-jwt' | 'mso_mdoc')}
                className="w-full px-3 py-2 border border-[#e6e1db] rounded-lg focus:ring-2 focus:ring-[#4F6F63] text-sm bg-white transition"
              >
                <option value="dc+sd-jwt">SD-JWT VC</option>
                <option value="mso_mdoc">mDoc (ISO 18013-5)</option>
              </select>
            </div>

            <div>
              <label htmlFor="attribute-options" className="block text-sm font-medium text-[#111111] mb-2">
                Opțiuni Atribute Identitate
              </label>
              <select
                id="attribute-options"
                value={pidTemplate}
                onChange={(e) => setPidTemplate(e.target.value as PIDTemplate)}
                className="w-full px-3 py-2 border border-[#e6e1db] rounded-lg focus:ring-2 focus:ring-[#4F6F63] text-sm bg-white transition"
              >
                <option value={PIDTemplate.ROMANIA}>🇷🇴 România (PID RO - Ion Popescu)</option>
                <option value={PIDTemplate.NORMAL}>🇩🇪 Standard (Germania DE)</option>
                <option value={PIDTemplate.SPECIAL_CHARACTERS}>Caractere Speciale & Diacritice</option>
                <option value={PIDTemplate.INCOMPLETE_BIRTHDATE}>Dată Naștere Incompletă</option>
              </select>
            </div>

            <div>
              <label htmlFor="validation-profile" className="block text-sm font-medium text-[#111111] mb-2">
                Profil de Validare
              </label>
              <select
                id="validation-profile"
                value={profile}
                onChange={(e) => setProfile(e.target.value as Profile)}
                className="w-full px-3 py-2 border border-[#e6e1db] rounded-lg focus:ring-2 focus:ring-[#4F6F63] text-sm bg-white transition"
              >
                <option value={Profile.PID_PRESENTATION}>Prezentare PID (EUDI ARF)</option>
                <option value={Profile.BASE_OPENID4VP}>OpenID4VP de Bază</option>
              </select>
            </div>
          </div>

          {/* Test Button */}
          <div className="pt-2">
            <button
              onClick={onTest}
              disabled={!parsedRequest || isLoading}
              className="btn-primary w-full text-base py-4 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Simulare și Testare în curs...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Rulează Testul de Conformitate (Run Test)</span>
                </>
              )}
            </button>
            {!parsedRequest && (
              <div className="status-badge status-badge--warning mt-3 justify-center">
                ⚠ Vă rugăm să introduceți un URL valid de autorizare înainte de a rula testul.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
