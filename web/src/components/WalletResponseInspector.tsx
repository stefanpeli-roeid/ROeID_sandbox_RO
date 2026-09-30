import React, { useState } from "react";

interface DecodedJWT {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
}

interface DecodedVPToken {
  format: string;
  jwt?: DecodedJWT;
  disclosures?: string[];
  kbJwt?: DecodedJWT;
  metadata: {
    algorithm: string;
    type?: string;
    keyId?: string;
    issuer?: string;
    subject?: string;
    issuedAt?: number;
    expiresAt?: number;
    notBefore?: number;
    credentialType?: string;
    audience?: string;
    validFrom?: Date;
    validUntil?: Date;
  };
  holderBinding?: {
    nonce: string;
    audience: string;
    issuedAt: number;
    expiresAt: number;
  };
  docType?: string;
  issuerSigned?: any;
}

interface WalletResponse {
  vp_token?: string | string[] | Record<string, string | string[]>;
  vpToken?: string | string[] | Record<string, string | string[]>; // Legacy support
  presentationSubmission?: any;
  decodedVPTokens?: DecodedVPToken[];
  postResult?: {
    success: boolean;
    statusCode?: number;
    error?: string;
  };
}

interface WalletResponseInspectorProps {
  response: WalletResponse;
}

export const WalletResponseInspector: React.FC<WalletResponseInspectorProps> = ({
  response,
}) => {
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview"])
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Get VP tokens as array
  const getVPTokensArray = (): { id?: string; token: string }[] => {
    const vpToken = response.vp_token || response.vpToken; // Support both snake_case and camelCase
    if (!vpToken) return [];
    if (typeof vpToken === "string") return [{ token: vpToken }];
    if (Array.isArray(vpToken))
      return vpToken.map((token) => ({ token }));
    // Object format: { "pid-sd-jwt": ["eyJ..."], ... }
    return Object.entries(vpToken).flatMap(([id, value]) =>
      Array.isArray(value)
        ? value.map((token) => ({ id, token }))
        : [{ id, token: value }]
    );
  };

  const vpTokens = getVPTokensArray();
  const decodedTokens = response.decodedVPTokens || [];
  const currentDecoded =
    decodedTokens.length > 0 ? decodedTokens[currentTokenIndex] : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Răspuns Portofel Simulat (Wallet Response)
          </h3>
          <p className="text-sm text-gray-600">
            Afișează datele trimise de portofelul simulat. Folosiți această secțiune pentru a examina atributele dezvăluite și structura criptografică pe care verificatorul trebuie să o proceseze.
          </p>
        </div>

        {/* POST Result */}
        {response.postResult && (
          <div
            className={`border rounded-lg p-4 ${
              response.postResult.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-lg ${
                  response.postResult.success
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {response.postResult.success ? "✓" : "✗"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {response.postResult.success
                    ? "Răspunsul a fost expediat cu succes către response_uri"
                    : "Expedierea răspunsului către response_uri a eșuat"}
                </p>
                {response.postResult.statusCode && (
                  <p className="text-xs text-gray-600 mt-1">
                    Cod HTTP: {response.postResult.statusCode}
                  </p>
                )}
                {response.postResult.error && (
                  <p className="text-xs text-red-700 mt-1">
                    {response.postResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overview Section */}
        <CollapsibleSection
          id="overview"
          title="Prezentare Generală (Overview)"
          expanded={expandedSections.has("overview")}
          onToggle={() => toggleSection("overview")}
        >
          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Tokeni VP" value={`${vpTokens.length} token(i)`} />
            <InfoCard
              label="Format"
              value={currentDecoded?.format || "Necunoscut"}
            />
            {currentDecoded && (
              <>
                <InfoCard
                  label="Algoritm"
                  value={currentDecoded.metadata.algorithm}
                />
                <InfoCard
                  label="Dezvăluiri Atribute (Disclosures)"
                  value={`${currentDecoded.disclosures?.length || 0} atribute`}
                />
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Raw VP Tokens */}
        <CollapsibleSection
          id="raw-tokens"
          title="Token(i) VP în Format Brut (Raw VP Tokens)"
          expanded={expandedSections.has("raw-tokens")}
          onToggle={() => toggleSection("raw-tokens")}
        >
          <div className="space-y-3">
            {vpTokens.map(({ id, token }, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    {id || `Token ${idx + 1}`}
                  </span>
                  <button
                    onClick={() => copyToClipboard(token, idx)}
                    className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium"
                  >
                    {copiedIndex === idx ? "Copiat!" : "Copiază"}
                  </button>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto font-mono break-all whitespace-pre-wrap">
                  {token}
                </pre>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Decoded JWT Structure */}
        {decodedTokens.length > 0 && (
          <CollapsibleSection
            id="decoded"
            title="Structură JWT Decodificată"
            expanded={expandedSections.has("decoded")}
            onToggle={() => toggleSection("decoded")}
          >
            {decodedTokens.length > 1 && (
              <div className="flex items-center justify-center gap-3 mb-4 p-2 bg-gray-100 rounded">
                <button
                  onClick={() =>
                    setCurrentTokenIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentTokenIndex === 0}
                  className={`text-xs px-3 py-1 rounded transition ${
                    currentTokenIndex === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  ← Anterior
                </button>
                <span className="text-xs font-semibold text-gray-700">
                  Token {currentTokenIndex + 1} din {decodedTokens.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentTokenIndex((prev) =>
                      Math.min(decodedTokens.length - 1, prev + 1)
                    )
                  }
                  disabled={currentTokenIndex === decodedTokens.length - 1}
                  className={`text-xs px-3 py-1 rounded transition ${
                    currentTokenIndex === decodedTokens.length - 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Următor →
                </button>
              </div>
            )}

            {currentDecoded && (
              <div className="space-y-4">
                {currentDecoded.jwt && (
                  <>
                    <SubSection title="Antet JWT (Header)">
                      <CodeBlock
                        code={JSON.stringify(currentDecoded.jwt.header, null, 2)}
                      />
                    </SubSection>

                    <SubSection title="Conținut JWT (Payload)">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-xs text-blue-900">
                        ℹ️ În formatul SD-JWT, valorile efective ale atributelor dezvăluite NU se află direct în payload, ci în vectorul de amprente criptografice <code className="font-mono bg-blue-100 px-1">_sd</code>.
                      </div>
                      <CodeBlock
                        code={JSON.stringify(currentDecoded.jwt.payload, null, 2)}
                      />
                    </SubSection>
                  </>
                )}

                {currentDecoded.disclosures && (
                  <SubSection
                    title={`Dezvăluiri Criptografice (${currentDecoded.disclosures.length})`}
                  >
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2 text-xs text-yellow-900">
                      💡 Acestea reprezintă atributele reale dezvăluite de posesor, codificate base64url cu sare criptografică (salt).
                    </div>
                    <div className="space-y-2">
                      {currentDecoded.disclosures.map((disc, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded">
                        <code className="text-xs font-mono break-all">
                          {disc}
                        </code>
                      </div>
                    ))}
                  </div>
                </SubSection>
                )}

                {currentDecoded.holderBinding && (
                  <SubSection title="Legătură Posesor (Holder Binding / KB-JWT)">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Nonce:</span>
                        <p className="text-gray-900 font-mono break-all">
                          {currentDecoded.holderBinding.nonce}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Audiență (Audience):
                        </span>
                        <p className="text-gray-900 font-mono break-all">
                          {currentDecoded.holderBinding.audience}
                        </p>
                      </div>
                    </div>
                  </SubSection>
                )}
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Presentation Submission */}
        {response.presentationSubmission && (
          <CollapsibleSection
            id="presentation-submission"
            title="Prezentare Transmisă (Presentation Submission)"
            expanded={expandedSections.has("presentation-submission")}
            onToggle={() => toggleSection("presentation-submission")}
          >
            <CodeBlock
              code={JSON.stringify(response.presentationSubmission, null, 2)}
            />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};

// Helper Components

const CollapsibleSection: React.FC<{
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, expanded, onToggle, children }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span
          className={`text-gray-500 transition transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {expanded && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
};

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      {children}
    </div>
  );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  return (
    <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto max-h-64 overflow-y-auto font-mono">
      {code}
    </pre>
  );
};
