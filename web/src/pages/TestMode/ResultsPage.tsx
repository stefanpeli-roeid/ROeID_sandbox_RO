import React from "react";
import { TabbedDetailsView } from "../../components/TabbedDetailsView.js";
import { WalletResponseInspector } from "../../components/WalletResponseInspector.js";
import { DebuggerSession } from "../../types.js";
import { logger } from "../../../../src/utils/Logger.js";

interface ResultsPageProps {
  session: DebuggerSession;
  onStartOver: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ session, onStartOver }) => {
  const requestSummary = session.requestValidation?.summary;
  const responseSummary = session.responseValidation?.summary;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Start Over */}
      <div className="flex items-center justify-between">
        <button
          onClick={onStartOver}
          className="text-sm font-bold text-slate-700 hover:text-blue-700 bg-white border border-slate-300 hover:border-blue-400 px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          ← Testează Altă Cerere (Start Over)
        </button>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          Pasul 3 din 3: Rezultate & Diagnoză
        </span>
      </div>

      {/*/!* Simple Check Counts *!/*/}
      {/*{session.requestValidation && session.responseValidation ? (*/}
      {/*  <div className="card">*/}
      {/*    <div className="grid grid-cols-2 gap-6">*/}
      {/*      <div>*/}
      {/*        <div className="text-sm text-[#5b5b5b] mb-2">Request</div>*/}
      {/*        <div className="text-3xl font-bold text-[#111111]">*/}
      {/*          {requestSummary?.passedChecks || 0}/{requestSummary?.totalChecks || 0}*/}
      {/*        </div>*/}
      {/*        <div className="text-sm text-[#5b5b5b] mt-1">checks passed</div>*/}
      {/*      </div>*/}
      {/*      <div>*/}
      {/*        <div className="text-sm text-[#5b5b5b] mb-2">Response</div>*/}
      {/*        <div className="text-3xl font-bold text-[#111111]">*/}
      {/*          {responseSummary?.passedChecks || 0}/{responseSummary?.totalChecks || 0}*/}
      {/*        </div>*/}
      {/*        <div className="text-sm text-[#5b5b5b] mt-1">checks passed</div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*) : (*/}
      {/*  <div className="status-badge status-badge--warning">*/}
      {/*    ⚠️ Validation data incomplete. Some components may not render correctly.*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* Tabbed Technical Details */}
      {(() => {
        try {
          return (
            <div>
              <h2 className="section-header">
                Prezentare Generală Rezultate
              </h2>
              <TabbedDetailsView session={session} />
            </div>
          );
        } catch (error) {
          logger.error("Error rendering TabbedDetailsView", error instanceof Error ? error : new Error(String(error)));
          return (
            <div className="status-badge status-badge--error">
              Eroare la afișarea detaliilor tehnice: {String(error)}
            </div>
          );
        }
      })()}

      {/* Wallet Response Inspector */}
      {session.simulatedResponse && (
        <div>
          <h2 className="section-header">
            Răspuns Portofel Simulat (Wallet Response)
          </h2>
          <WalletResponseInspector response={session.simulatedResponse} />
        </div>
      )}
    </div>
  );
};
