import React, { useState } from "react";
import { DebuggerSession } from "../types.js";
import { ChecksDisplay } from "./ChecksDisplay.js";

interface TabbedDetailsViewProps {
  session: DebuggerSession;
}

type TabId = "summary" | "request" | "response" | "raw";

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: "summary", label: "Rezumat", icon: "" },
  { id: "request", label: "Verificări Cerere", icon: "" },
  { id: "response", label: "Verificări Răspuns", icon: "" },
  { id: "raw", label: "Date Complete (JSON)", icon: "" },
];

export const TabbedDetailsView: React.FC<TabbedDetailsViewProps> = ({
  session,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("summary");

  const handleTabSwitch = (tab: TabId) => {
    setActiveTab(tab);
  };

  const requestErrors = session.requestValidation.errors || [];
  const responseErrors = session.responseValidation.errors || [];
  const requestChecks = session.requestValidation.checks || [];
  const responseChecks = session.responseValidation.checks || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "summary" && (
          <SummaryTab
            requestValidation={session.requestValidation}
            responseValidation={session.responseValidation}
            onTabSwitch={handleTabSwitch}
          />
        )}
        {activeTab === "request" && (
          <div>
            {requestChecks.length > 0 ? (
              <ChecksDisplay
                checks={requestChecks}
                title="Verificări Detaliate ale Cererii"
              />
            ) : (
              <EmptyState message="Nu există verificări disponibile pentru cerere" />
            )}
          </div>
        )}
        {activeTab === "response" && (
          <div>
            {responseChecks.length > 0 ? (
              <ChecksDisplay
                checks={responseChecks}
                title="Verificări Detaliate ale Răspunsului"
              />
            ) : (
              <EmptyState message="Nu există verificări disponibile pentru răspuns" />
            )}
          </div>
        )}
        {activeTab === "raw" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                Date Complete ale Sesiunii
              </h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(session, null, 2)
                  );
                }}
                className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
              >
                Copiază JSON
              </button>
            </div>
            <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryTab: React.FC<{
  requestValidation: any;
  responseValidation: any;
  onTabSwitch: (tab: TabId) => void;
}> = ({ requestValidation, responseValidation, onTabSwitch }) => {
  const requestSummary = requestValidation.summary;
  const responseSummary = responseValidation.summary;

  return (
    <div className="space-y-4">
      {/* Clickable Check Counts */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onTabSwitch("request")}
          className="text-left p-6 rounded-lg border-2 border-[#e6e1db] hover:border-[#5E7C99] hover:bg-[#EAF1F6] transition cursor-pointer"
        >
          <div className="text-sm text-[#5b5b5b] mb-2">Verificări Cerere (Request)</div>
          <div className="text-3xl font-bold text-[#111111]">
            {requestSummary?.passedChecks || 0}/{requestSummary?.totalChecks || 0}
          </div>
          <div className="text-sm text-[#5b5b5b] mt-2">Apasă pentru detalii complete →</div>
        </button>

        <button
          onClick={() => onTabSwitch("response")}
          className="text-left p-6 rounded-lg border-2 border-[#e6e1db] hover:border-[#4F6F63] hover:bg-[#E9F0EA] transition cursor-pointer"
        >
          <div className="text-sm text-[#5b5b5b] mb-2">Verificări Răspuns (Response)</div>
          <div className="text-3xl font-bold text-[#111111]">
            {responseSummary?.passedChecks || 0}/{responseSummary?.totalChecks || 0}
          </div>
          <div className="text-sm text-[#5b5b5b] mt-2">Apasă pentru detalii complete →</div>
        </button>
      </div>

      {/* Error Summary (if any) */}
      {(requestValidation.errors?.length > 0 || responseValidation.errors?.length > 0) && (
        <div className="bg-[#fef2f2] rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-[#111111] mb-2">Probleme Identificate</h4>
          <div className="space-y-2 text-sm">
            {requestValidation.errors?.length > 0 && (
              <div className="text-[#5b5b5b]">
                Cerere (Request): {requestValidation.errors.length} problemă(e)
              </div>
            )}
            {responseValidation.errors?.length > 0 && (
              <div className="text-[#5b5b5b]">
                Răspuns (Response): {responseValidation.errors.length} problemă(e)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-sm">{message}</p>
    </div>
  );
};
