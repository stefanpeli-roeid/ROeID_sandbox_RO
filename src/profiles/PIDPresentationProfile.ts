/**
 * PID Presentation Profile
 * 
 * Implements validation for the German PID Presentation (HAIP-aligned) profile.
 * This profile enforces high-assurance identity presentation requirements.
 */

import { BaseValidationProfile, ExtendedAuthorizationRequest } from "./IValidationProfile.js";
import { ValidationCheck, ValidationIssue, Severity, ValidationErrorCategory, SpecReference } from "../types/index.js";

export class PIDPresentationProfile extends BaseValidationProfile {
  name = "PID Presentation (EUDI HAIP)";

  /**
   * PID Presentation syntax validation
   * Enforces high-assurance (HAIP) requirements for PID presentation
   *
   * This profile implements the German EUDI Wallet PID Presentation requirements
   * which are stricter than base OpenID4VP.
   *
   * Note: As of the refactoring, profile-specific checks (like response_mode and client_id format)
   * are ONLY checked here, not in the core validator. Core validator only checks universal OpenID4VP requirements.
   */
  validateSyntax(
    request: ExtendedAuthorizationRequest,
    checks: ValidationCheck[],
    issues: ValidationIssue[]
  ): void {
    const category = "Profile";

    // HAIP Requirement 0: redirect_uri is prohibited with direct_post.jwt
    // In direct_post.jwt mode, only response_uri is used
    if (request.redirectUri || (request as any).redirect_uri) {
      this.addDetailedCheck(
        checks,
        "profile.redirect_uri.prohibited",
        "redirect_uri Prohibited (PID)",
        false,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "redirect_uri",
          expectedValue: "Must not be present (use response_uri instead)",
          actualValue: request.redirectUri || (request as any).redirect_uri,
          issue: 'redirect_uri is not allowed with direct_post.jwt response mode',
          suggestedFix: 'Remove redirect_uri and use response_uri instead for direct_post.jwt',
          specReference: { spec: "OpenID4VP", section: "6.2", quotation: "direct_post.jwt uses response_uri, not redirect_uri" },
        }
      );
      issues.push({
        category: ValidationErrorCategory.PROFILE_VIOLATION,
        field: "redirect_uri",
        issue: 'redirect_uri not allowed with direct_post.jwt (use response_uri)',
        severity: Severity.ERROR,
        specReference: { spec: "OpenID4VP", section: "6.2" },
        suggestedFix: 'Remove redirect_uri and use response_uri',
      });
    } else {
      this.addDetailedCheck(
        checks,
        "profile.redirect_uri.prohibited",
        "redirect_uri Correctly Omitted (PID)",
        true,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "redirect_uri",
          expectedValue: "Not present",
          actualValue: "Not present",
          details: "redirect_uri correctly omitted (direct_post.jwt uses response_uri)",
        }
      );
    }


    // HAIP Requirement 1: response_mode must be direct_post.jwt
    if (!request.responseMode) {
      this.addDetailedCheck(
        checks,
        "profile.response_mode.direct_post_jwt",
        "Response Mode HAIP Compliance",
        false,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "response_mode",
          expectedValue: "direct_post.jwt",
          actualValue: "undefined",
          issue: 'Missing response_mode. Must be "direct_post.jwt" for PID Presentation',
          suggestedFix: 'Set response_mode to "direct_post.jwt"',
          specReference: { spec: "EUDI-ARF", quotation: "High-assurance profiles must use direct_post.jwt" },
        }
      );
      issues.push({
        category: ValidationErrorCategory.PROFILE_VIOLATION,
        field: "response_mode",
        issue: 'PID Presentation requires response_mode: "direct_post.jwt"',
        severity: Severity.ERROR,
        specReference: { spec: "EUDI-ARF" },
        suggestedFix: 'Set response_mode to "direct_post.jwt"',
      });
    } else if (request.responseMode !== "direct_post.jwt") {
      this.addDetailedCheck(
        checks,
        "profile.response_mode.direct_post_jwt",
        "Response Mode HAIP Compliance",
        false,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "response_mode",
          expectedValue: "direct_post.jwt",
          actualValue: request.responseMode,
          issue: `Invalid response_mode for PID Presentation: must be "direct_post.jwt", got: ${request.responseMode}`,
          suggestedFix: 'Change response_mode to "direct_post.jwt"',
          specReference: { spec: "EUDI-ARF", quotation: "High-assurance profiles must use direct_post.jwt" },
        }
      );
      issues.push({
        category: ValidationErrorCategory.PROFILE_VIOLATION,
        field: "response_mode",
        issue: `PID Presentation requires direct_post.jwt, got: ${request.responseMode}`,
        severity: Severity.ERROR,
        specReference: { spec: "EUDI-ARF" },
        suggestedFix: 'Change response_mode to "direct_post.jwt"',
      });
    } else {
      this.addDetailedCheck(
        checks,
        "profile.response_mode.direct_post_jwt",
        "Response Mode HAIP Compliance",
        true,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "response_mode",
          expectedValue: "direct_post.jwt",
          actualValue: request.responseMode,
          details: "response_mode is HAIP compliant",
        }
      );
    }

    // HAIP Requirement 2: client_id must use x509_hash: scheme
    if (request.clientId) {
      if (!request.clientId.startsWith("x509_hash:")) {
        this.addDetailedCheck(
          checks,
          "profile.client_id.x509_hash",
          "Client ID x509_hash Scheme (PID)",
          false,
          category,
          Severity.ERROR,
          {
            subcategory: "PID Presentation Requirements",
            field: "client_id",
            expectedValue: "x509_hash:<hash>",
            actualValue: request.clientId,
            issue: `PID Presentation requires x509_hash: scheme for client_id`,
            suggestedFix: "Use x509_hash:<certificate_hash> format",
            specReference: { spec: "EUDI-ARF", section: "3.1" },
          }
        );
        issues.push({
          category: ValidationErrorCategory.PROFILE_VIOLATION,
          field: "client_id",
          issue: "PID Presentation requires x509_hash: scheme",
          severity: Severity.ERROR,
          specReference: { spec: "EUDI-ARF" },
          suggestedFix: "Use x509_hash:<certificate_hash> format",
        });
      } else {
        this.addDetailedCheck(
          checks,
          "profile.client_id.x509_hash",
          "Client ID x509_hash Scheme (PID)",
          true,
          category,
          Severity.ERROR,
          {
            subcategory: "PID Presentation Requirements",
            field: "client_id",
            expectedValue: "x509_hash:<hash>",
            actualValue: request.clientId,
            details: "client_id uses required x509_hash scheme",
          }
        );

        // Validate that the hash after "x509_hash:" is a valid base64url-encoded SHA-256 hash
        const hashPart = request.clientId.substring("x509_hash:".length);
        const isValidBase64Url = /^[A-Za-z0-9_-]+$/.test(hashPart);
        const expectedHashLength = 43; // SHA-256 hash (32 bytes) base64url-encoded is 43 characters

        if (!isValidBase64Url) {
          this.addDetailedCheck(
            checks,
            "profile.client_id.hash_format",
            "Client ID Hash Format (PID)",
            false,
            category,
            Severity.ERROR,
            {
              subcategory: "PID Presentation Requirements",
              field: "client_id",
              expectedValue: "base64url-encoded SHA-256 hash (43 chars)",
              actualValue: hashPart,
              issue: "client_id hash contains invalid base64url characters",
              suggestedFix: "Ensure hash is base64url-encoded (only A-Z, a-z, 0-9, -, _)",
              specReference: { spec: "EUDI-ARF", section: "3.1" },
            }
          );
          issues.push({
            category: ValidationErrorCategory.PROFILE_VIOLATION,
            field: "client_id",
            issue: "client_id hash format is invalid",
            severity: Severity.ERROR,
            specReference: { spec: "EUDI-ARF" },
            suggestedFix: "Use base64url-encoded SHA-256 hash of DER certificate",
          });
        } else if (hashPart.length !== expectedHashLength) {
          this.addDetailedCheck(
            checks,
            "profile.client_id.hash_length",
            "Client ID Hash Length (PID)",
            false,
            category,
            Severity.ERROR,
            {
              subcategory: "PID Presentation Requirements",
              field: "client_id",
              expectedValue: `${expectedHashLength} characters (SHA-256 hash)`,
              actualValue: `${hashPart.length} characters`,
              issue: `client_id hash has incorrect length: expected ${expectedHashLength}, got ${hashPart.length}`,
              suggestedFix: "Use SHA-256 hash (32 bytes) of DER certificate, base64url-encoded",
              specReference: { spec: "EUDI-ARF", section: "3.1" },
            }
          );
          issues.push({
            category: ValidationErrorCategory.PROFILE_VIOLATION,
            field: "client_id",
            issue: `client_id hash length is incorrect (expected ${expectedHashLength}, got ${hashPart.length})`,
            severity: Severity.ERROR,
            specReference: { spec: "EUDI-ARF" },
            suggestedFix: "Use SHA-256 hash of DER certificate",
          });
        } else {
          this.addDetailedCheck(
            checks,
            "profile.client_id.hash_format",
            "Client ID Hash Format (PID)",
            true,
            category,
            Severity.ERROR,
            {
              subcategory: "PID Presentation Requirements",
              field: "client_id",
              expectedValue: "base64url-encoded SHA-256 hash",
              actualValue: `${hashPart.length} chars, valid base64url`,
              details: "client_id hash has correct format and length for SHA-256",
            }
          );
        }
      }
    }
  }

  /**
   * PID Presentation semantic validation
   * Enforces PID-specific credential and format requirements
   *
   * Validates PID-specific credential types (vct_values/doctype_value) and
   * known PID claims for German EUDI Wallet ecosystem.
   */
  validateSemantics(
    request: ExtendedAuthorizationRequest,
    checks: ValidationCheck[],
    issues: ValidationIssue[]
  ): void {
    const category = "Profile";

    // Known PID claims for SD-JWT format (EUDI ARF + Member States)
    const KNOWN_PID_SDJWT_CLAIMS = new Set([
      "given_name", "family_name", "birthdate", "age_over_18", "age_over_21",
      "age_over_12", "age_over_14", "age_over_16", "age_over_65",
      "age_in_years", "age_birth_year", "family_name_birth", "given_name_birth",
      "birth_place", "birth_country", "birth_state", "birth_city",
      "resident_address", "resident_country", "resident_state", "resident_city",
      "resident_postal_code", "resident_street", "resident_house_number",
      "gender", "nationality", "nationalities", "issuance_date", "expiry_date", "issuing_authority",
      "document_number", "issuing_country", "issuing_jurisdiction", "address",
      "personal_administrative_number", "administrative_number"
    ]);

    // PID-Specific Requirement 1: Validate credential types (vct_values / doctype_value)
    if (request.dcqlQuery?.credentials) {
      request.dcqlQuery.credentials.forEach((credential: any, index: number) => {
        const fieldPrefix = `dcql_query.credentials[${index}]`;

        // SD-JWT format: vctValues must be PID (note: field is camelCase after normalization)
        if (credential.format === "dc+sd-jwt" || credential.format === "sd-jwt") {
          const validPidVcts = [
            "urn:eu.europa.ec.eudi:pid:1",
            "urn:eudi:pid:de:1",
            "urn:eudi:pid:ro:1",
          ];
          const hasPidVct = credential.meta?.vctValues?.some((v: string) =>
            validPidVcts.includes(v) || v.startsWith("urn:eudi:pid:") || v.startsWith("urn:eu.europa.ec.eudi:pid:")
          );

          if (!credential.meta?.vctValues || credential.meta.vctValues.length === 0) {
            this.addDetailedCheck(
              checks,
              `profile.pid.credential.${index}.vct_values.missing`,
              `Credential ${index} VCT Values Missing`,
              false,
              category,
              Severity.ERROR,
              {
                subcategory: "PID Credential Requirements",
                field: `${fieldPrefix}.meta.vct_values`,
                expectedValue: '["urn:eu.europa.ec.eudi:pid:1"] or national PID vct',
                actualValue: "undefined or empty",
                issue: "PID credential type (vct_values) must be specified",
                suggestedFix: 'Add meta.vct_values: ["urn:eu.europa.ec.eudi:pid:1"] or ["urn:eudi:pid:ro:1"]',
                specReference: { spec: "EUDI-ARF", section: "3.2" },
              }
            );
            issues.push({
              category: ValidationErrorCategory.PROFILE_VIOLATION,
              field: `${fieldPrefix}.meta.vct_values`,
              issue: "PID credential type must be specified",
              severity: Severity.ERROR,
              specReference: { spec: "EUDI-ARF" },
              suggestedFix: 'Add meta.vct_values: ["urn:eu.europa.ec.eudi:pid:1"] or ["urn:eudi:pid:ro:1"]',
            });
          } else if (!hasPidVct) {
            this.addDetailedCheck(
              checks,
              `profile.pid.credential.${index}.vct_values.invalid`,
              `Credential ${index} VCT Values Invalid`,
              false,
              category,
              Severity.ERROR,
              {
                subcategory: "PID Credential Requirements",
                field: `${fieldPrefix}.meta.vct_values`,
                expectedValue: '"urn:eu.europa.ec.eudi:pid:1" or "urn:eudi:pid:ro:1" / "urn:eudi:pid:de:1"',
                actualValue: credential.meta.vctValues.join(", "),
                issue: 'Invalid PID credential type. Expected EUDI PID type (e.g. "urn:eu.europa.ec.eudi:pid:1", "urn:eudi:pid:ro:1", "urn:eudi:pid:de:1")',
                suggestedFix: 'Change vct_values to include a valid PID type',
                specReference: { spec: "EUDI-ARF", section: "3.2" },
              }
            );
            issues.push({
              category: ValidationErrorCategory.PROFILE_VIOLATION,
              field: `${fieldPrefix}.meta.vct_values`,
              issue: `Invalid PID credential type: ${credential.meta.vctValues.join(", ")}`,
              severity: Severity.ERROR,
              specReference: { spec: "EUDI-ARF" },
              suggestedFix: 'Use standard EUDI PID type: "urn:eu.europa.ec.eudi:pid:1" or "urn:eudi:pid:ro:1"',
            });
          } else {
            this.addDetailedCheck(
              checks,
              `profile.pid.credential.${index}.vct_values.valid`,
              `Credential ${index} VCT Values Valid`,
              true,
              category,
              Severity.ERROR,
              {
                subcategory: "PID Credential Requirements",
                field: `${fieldPrefix}.meta.vct_values`,
                expectedValue: "Standard EUDI PID vct",
                actualValue: credential.meta.vctValues.join(", "),
                details: "Credential type correctly specifies EUDI PID",
              }
            );
          }

          // Validate known PID claims for SD-JWT
          if (credential.claims && Array.isArray(credential.claims)) {
            const unknownClaims: string[] = [];
            credential.claims.forEach((claim: any) => {
              if (claim.path && claim.path.length === 1) {
                const claimName = claim.path[0];
                if (!KNOWN_PID_SDJWT_CLAIMS.has(claimName)) {
                  unknownClaims.push(claimName);
                }
              }
            });

            if (unknownClaims.length > 0) {
              this.addDetailedCheck(
                checks,
                `profile.pid.credential.${index}.unknown_claims`,
                `Credential ${index} Unknown Claims`,
                false,
                category,
                Severity.WARNING,
                {
                  subcategory: "PID Credential Requirements",
                  field: `${fieldPrefix}.claims`,
                  expectedValue: "Known PID claims",
                  actualValue: `Unknown: ${unknownClaims.join(", ")}`,
                  issue: `Unknown or custom PID claims requested: ${unknownClaims.join(", ")}`,
                  suggestedFix: "Verify these are valid PID claims or document if custom",
                }
              );
              issues.push({
                category: ValidationErrorCategory.PROFILE_VIOLATION,
                field: `${fieldPrefix}.claims`,
                issue: `Unknown PID claims: ${unknownClaims.join(", ")}`,
                severity: Severity.WARNING,
                suggestedFix: "Verify these are standard PID claims",
              });
            }
          }
        }

        // mDoc format: doctypeValue must be PID (note: field is camelCase after normalization)
        if (credential.format === "mso_mdoc") {
          if (!credential.meta?.doctypeValue) {
            this.addDetailedCheck(
              checks,
              `profile.pid.credential.${index}.doctype_value.missing`,
              `Credential ${index} Doctype Missing`,
              false,
              category,
              Severity.ERROR,
              {
                subcategory: "PID Credential Requirements",
                field: `${fieldPrefix}.meta.doctype_value`,
                expectedValue: '"eu.europa.ec.eudi.pid.1"',
                actualValue: "undefined",
                issue: "PID document type must be specified for mso_mdoc",
                suggestedFix: 'Add meta.doctype_value: "eu.europa.ec.eudi.pid.1"',
                specReference: { spec: "EUDI-ARF", section: "3.2" },
              }
            );
            issues.push({
              category: ValidationErrorCategory.PROFILE_VIOLATION,
              field: `${fieldPrefix}.meta.doctype_value`,
              issue: "PID document type must be specified",
              severity: Severity.ERROR,
              specReference: { spec: "EUDI-ARF" },
              suggestedFix: 'Add meta.doctype_value: "eu.europa.ec.eudi.pid.1"',
            });
          } else if (credential.meta.doctypeValue !== "eu.europa.ec.eudi.pid.1") {
            this.addDetailedCheck(
              checks,
              `profile.pid.credential.${index}.doctype_value.invalid`,
              `Credential ${index} Doctype Invalid`,
              false,
              category,
              Severity.ERROR,
              {
                subcategory: "PID Credential Requirements",
                field: `${fieldPrefix}.meta.doctype_value`,
                expectedValue: '"eu.europa.ec.eudi.pid.1"',
                actualValue: credential.meta.doctypeValue,
                issue: 'Invalid PID document type. Expected "eu.europa.ec.eudi.pid.1"',
                suggestedFix: 'Change doctype_value to "eu.europa.ec.eudi.pid.1"',
                specReference: { spec: "EUDI-ARF", section: "3.2" },
              }
            );
            issues.push({
              category: ValidationErrorCategory.PROFILE_VIOLATION,
              field: `${fieldPrefix}.meta.doctype_value`,
              issue: `Invalid PID document type. Expected "eu.europa.ec.eudi.pid.1", got: ${credential.meta.doctypeValue}`,
              severity: Severity.ERROR,
              specReference: { spec: "EUDI-ARF" },
            });
          } else {
            this.addDetailedCheck(
              checks,
              `profile.pid.credential.${index}.doctype_value.valid`,
              `Credential ${index} Doctype Valid`,
              true,
              category,
              Severity.ERROR,
              {
                subcategory: "PID Credential Requirements",
                field: `${fieldPrefix}.meta.doctype_value`,
                expectedValue: '"eu.europa.ec.eudi.pid.1"',
                actualValue: credential.meta.doctypeValue,
                details: "Document type correctly specifies PID mDoc format",
              }
            );
          }
        }
      });
    }

    // PID-Specific Requirement 2: verifier_info presence (identifies the RP)
    if (!request.verifierInfo) {
      this.addDetailedCheck(
        checks,
        "profile.verifier_info.presence",
        "Verifier Info Presence (PID)",
        false,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "verifier_info",
          expectedValue: "verifier_info object",
          actualValue: "undefined",
          issue: "PID Presentation requires verifier_info to relay the registration certificate",
          suggestedFix: "Add verifier_info with registration certificate",
          specReference: { spec: "EUDI-ARF", section: "3.2" },
        }
      );
      issues.push({
        category: ValidationErrorCategory.PROFILE_VIOLATION,
        field: "verifier_info",
        issue: "PID Presentation requires verifier_info",
        severity: Severity.ERROR,
        specReference: { spec: "EUDI-ARF" },
        suggestedFix: "Add verifier_info with registration certificate",
      });
    } else {
      this.addDetailedCheck(
        checks,
        "profile.verifier_info.presence",
        "Verifier Info Presence (PID)",
        true,
        category,
        Severity.ERROR,
        {
          subcategory: "PID Presentation Requirements",
          field: "verifier_info",
          expectedValue: "verifier_info object",
          actualValue: "Present",
          details: "Verifier information is present for RP identification",
        }
      );

      // Validate that verifier_info.data contains the registration certificate (JWT)
      // Note: Access Certificate is always in x5c header of the request JWT (handled separately)
      const registrationCert = request.verifierInfo.data;
      if (!registrationCert || (typeof registrationCert !== 'string' && !Array.isArray(registrationCert))) {
        this.addDetailedCheck(
          checks,
          "profile.verifier_info.registration_cert",
          "Registration Certificate in verifier_info.data",
          false,
          category,
          Severity.ERROR,
          {
            subcategory: "PID Presentation Requirements",
            field: "verifier_info.data",
            expectedValue: "Registration certificate JWT",
            actualValue: "undefined or invalid",
            issue: "verifier_info.data must contain the RP's registration certificate (JWT format)",
            suggestedFix: "Add verifier_info.data with the registration certificate JWT from the Registrar",
            specReference: { spec: "EUDI-ARF", section: "3.2" },
          }
        );
        issues.push({
          category: ValidationErrorCategory.PROFILE_VIOLATION,
          field: "verifier_info.data",
          issue: "verifier_info.data must contain registration certificate (JWT)",
          severity: Severity.ERROR,
          specReference: { spec: "EUDI-ARF" },
          suggestedFix: "Add verifier_info.data with registration certificate JWT",
        });
      } else {
        // If it's a string, check if it looks like a JWT (3 parts separated by dots)
        const isJWT = typeof registrationCert === 'string' && registrationCert.split('.').length === 3;
        if (typeof registrationCert === 'string' && !isJWT) {
          this.addDetailedCheck(
            checks,
            "profile.verifier_info.registration_cert_format",
            "Registration Certificate Format",
            false,
            category,
            Severity.WARNING,
            {
              subcategory: "PID Presentation Requirements",
              field: "verifier_info.data",
              expectedValue: "JWT format (header.payload.signature)",
              actualValue: `String with ${registrationCert.split('.').length} part(s)`,
              issue: "verifier_info.data does not appear to be a valid JWT",
              suggestedFix: "Ensure registration certificate is in JWT format",
            }
          );
        } else {
          this.addDetailedCheck(
            checks,
            "profile.verifier_info.registration_cert",
            "Registration Certificate in verifier_info.data",
            true,
            category,
            Severity.ERROR,
            {
              subcategory: "PID Presentation Requirements",
              field: "verifier_info.data",
              expectedValue: "Registration certificate JWT",
              actualValue: typeof registrationCert === 'string' ? "JWT present" : `Array with ${registrationCert.length} item(s)`,
              details: "Registration certificate is present in verifier_info.data",
            }
          );
        }
      }
    }

    // PID-Specific Requirement 3: VP formats must be specified for SD-JWT and/or mDoc
    if (request.clientMetadata?.vpFormatsSupported) {
      const formats = request.clientMetadata.vpFormatsSupported;
      const hasSDJWT = formats["dc+sd-jwt"] || formats["sd-jwt"];
      const hasMDoc = formats["mso_mdoc"] || formats["vc+sd-jwt"];

      if (!hasSDJWT && !hasMDoc) {
        this.addDetailedCheck(
          checks,
          "profile.vp_formats.sd_jwt",
          "VP Formats Support (PID)",
          false,
          category,
          Severity.ERROR,
          {
            subcategory: "PID Presentation Requirements",
            field: "client_metadata.vp_formats_supported",
            expectedValue: '"dc+sd-jwt" or "mso_mdoc"',
            actualValue: Object.keys(formats).join(", "),
            issue: "PID Presentation requires SD-JWT and/or mDoc format support",
            suggestedFix: 'Add "dc+sd-jwt" and/or "mso_mdoc" to vp_formats_supported',
            specReference: { spec: "EUDI-ARF", section: "3.2" },
          }
        );
        issues.push({
          category: ValidationErrorCategory.PROFILE_VIOLATION,
          field: "client_metadata.vp_formats_supported",
          issue: "PID Presentation requires SD-JWT and/or mDoc support",
          severity: Severity.ERROR,
          specReference: { spec: "EUDI-ARF" },
          suggestedFix: 'Add "dc+sd-jwt" and/or "mso_mdoc"',
        });
      } else {
        this.addDetailedCheck(
          checks,
          "profile.vp_formats.sd_jwt",
          "VP Formats Support (PID)",
          true,
          category,
          Severity.ERROR,
          {
            subcategory: "PID Presentation Requirements",
            field: "client_metadata.vp_formats_supported",
            expectedValue: '"dc+sd-jwt" or "mso_mdoc"',
            actualValue: (hasSDJWT ? "SD-JWT " : "") + (hasMDoc ? "mDoc" : ""),
            details: "Required PID formats are supported",
          }
        );
      }
    }

    // PID-Specific Requirement 4: Check for unexpected fields
    this.validateUnexpectedFields(request, checks, issues);

    // PID-Specific Requirement 5: aud (audience) must be present for key binding validation
    if (!request.aud) {
      this.addDetailedCheck(
        checks,
        "profile.aud.presence",
        "Audience (aud) Presence (PID)",
        false,
        category,
        Severity.WARNING,
        {
          subcategory: "PID Presentation Requirements",
          field: "aud",
          expectedValue: 'aud claim (e.g., "https://self-issued.me/v2")',
          actualValue: "undefined",
          issue: "PID Presentation recommends aud for key binding validation",
          suggestedFix: 'Add aud claim (typically "https://self-issued.me/v2" or RP identifier)',
          specReference: { spec: "EUDI-ARF", section: "4.1" },
        }
      );
    } else {
      this.addDetailedCheck(
        checks,
        "profile.aud.presence",
        "Audience (aud) Presence (PID)",
        true,
        category,
        Severity.WARNING,
        {
          subcategory: "PID Presentation Requirements",
          field: "aud",
          expectedValue: "aud claim",
          actualValue: request.aud,
          details: "Audience is present for key binding",
        }
      );
    }
  }

  /**
   * Validate that no unexpected fields are present in PID Presentation request
   */
  private validateUnexpectedFields(
    request: ExtendedAuthorizationRequest,
    checks: ValidationCheck[],
    issues: ValidationIssue[]
  ): void {
    const category = "Profile";
    const subcategory = "Unexpected Fields";

    // Define allowed fields for PID Presentation (HAIP profile)
    const allowedFields = new Set([
      // Core OpenID4VP fields
      "clientId",
      "client_id",
      "responseType",
      "response_type",
      "responseUri",
      "response_uri",
      "responseMode",
      "response_mode",
      "nonce",
      "state",

      // Query/Definition fields
      "dcqlQuery",
      "dcql_query",

      // Metadata fields
      "clientMetadata",
      "client_metadata",
      "clientMetadataUri",
      "client_metadata_uri",
      "verifierInfo",
      "verifier_info",

      // JWT standard fields (when request is a JWT)
      "iss",
      "aud",
      "exp",
      "iat",
      "nbf",
      "jti",

      // OpenID4VP optional fields
      "clientIdScheme",
      "client_id_scheme",
      "walletIssuer",
      "wallet_issuer",
    ]);

    // Get all actual fields in the request
    const actualFields = Object.keys(request);
    const unexpectedFields: string[] = [];

    for (const field of actualFields) {
      if (!allowedFields.has(field)) {
        unexpectedFields.push(field);
      }
    }

    if (unexpectedFields.length > 0) {
      this.addDetailedCheck(
        checks,
        "profile.unexpected_fields",
        "No Unexpected Fields",
        false,
        category,
        Severity.WARNING,
        {
          subcategory,
          field: "request",
          expectedValue: "Only PID Presentation-defined fields",
          actualValue: unexpectedFields.join(", "),
          issue: `Request contains unexpected fields: ${unexpectedFields.join(", ")}`,
          suggestedFix: "Remove non-standard fields or verify they are required extensions",
          specReference: {
            spec: "PID-Presentation-Guide",
            section: "3.2",
            url: "https://bmi.usercontent.opencode.de/eudi-wallet/developer-guide/PID_Presentation/#32-required-fields",
          },
        }
      );
      issues.push({
        category: ValidationErrorCategory.PROFILE_VIOLATION,
        field: "request",
        issue: `Unexpected fields in request: ${unexpectedFields.join(", ")}`,
        severity: Severity.WARNING,
        specReference: {
          spec: "PID-Presentation-Guide",
          section: "3.2",
        },
        suggestedFix: "Remove non-standard fields or document if they are required extensions",
      });
    } else {
      this.addDetailedCheck(
        checks,
        "profile.unexpected_fields",
        "No Unexpected Fields",
        true,
        category,
        Severity.WARNING,
        {
          subcategory,
          field: "request",
          expectedValue: "Only PID Presentation-defined fields",
          actualValue: "All fields are standard",
          details: "Request contains only fields defined in PID Presentation specification",
        }
      );
    }
  }
}
