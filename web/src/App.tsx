import React, { useState } from "react";
import { TestMode } from "./pages/TestMode/TestMode.js";
import { EditorMode } from "./pages/EditorMode/EditorMode.js";
import { VerifierMode } from "./pages/VerifierMode/VerifierMode.js";
import "./index.css";

type AppMode = 'test' | 'editor' | 'verifier';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('test');
  const [resetKey, setResetKey] = useState(0);

  const handleLogoClick = () => {
    // Reset by incrementing the key, which forces TestMode and EditorMode to remount
    setResetKey(prev => prev + 1);
    // Go back to test mode
    setMode('test');
  };

  return (
    <div className="min-h-screen app-content">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-2.5 sticky top-0 z-30">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="flex flex-row items-center justify-between gap-6 flex-nowrap whitespace-nowrap">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 text-left hover:opacity-95 transition-opacity cursor-pointer shrink-0"
              title="Acasă - Reset"
            >
              {/* Logo Icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-sm shadow-blue-600/30 shrink-0">
                E
              </div>

              {/* Brand Title & Role */}
              <div className="flex flex-col justify-center">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  ERICA
                </span>
                <span className="text-[11px] font-semibold text-slate-500 tracking-normal mt-0.5 leading-none">
                  EUDI Wallet Debugger
                </span>
              </div>

              {/* Elegant Vertical Divider */}
              <div className="hidden md:block h-7 w-px bg-slate-200 mx-1.5 shrink-0" aria-hidden="true" />

              {/* Clear Informative Badges */}
              <div className="hidden sm:flex items-center gap-2.5">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  OpenID4VP
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="text-sm">🇷🇴</span>
                  <span>Profil PID România</span>
                </span>
              </div>
            </button>

            {/* Mode Toggle Navigation Buttons */}
            <nav className="nav-mode-container" aria-label="Moduri aplicație">
              <button
                onClick={() => setMode('test')}
                className={`nav-mode-btn nav-mode-btn--test ${mode === 'test' ? 'active' : ''}`}
              >
                <span>Cereri de Test</span>
              </button>

              <button
                onClick={() => setMode('editor')}
                className={`nav-mode-btn nav-mode-btn--editor ${mode === 'editor' ? 'active' : ''}`}
              >
                <span>Editor Cereri</span>
              </button>

              <button
                onClick={() => setMode('verifier')}
                className={`nav-mode-btn nav-mode-btn--verifier ${mode === 'verifier' ? 'active' : ''}`}
              >
                <span>Verificator</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {mode === 'test' && <TestMode key={resetKey} />}
        {mode === 'editor' && <EditorMode key={resetKey} />}
        {mode === 'verifier' && <VerifierMode key={resetKey} />}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            ERICA – Analizor și Verificator de Conformitate EUDI Wallet • OpenID4VP • EUDI Wallet ARF •{" "}
            <a
              href="https://openid.net/specs/openid-4-verifiable-presentations-1_0.html"
              className="text-blue-600 hover:text-purple-600 transition-colors font-medium"
            >
              Specificație Tehnică
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
