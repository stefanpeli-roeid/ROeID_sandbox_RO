/**
 * Base OpenID4VP Profile
 * 
 * Implements validation for the base OpenID4VP specification.
 * This profile has minimal requirements - core OpenID4VP semantics only.
 */

import { BaseValidationProfile, ExtendedAuthorizationRequest } from "./IValidationProfile.js";
import { ValidationCheck, ValidationIssue, Severity, ValidationErrorCategory, SpecReference } from "../types/index.js";

export class BaseOpenID4VPProfile extends BaseValidationProfile {
  name = "OpenID4VP Base";

  /**
   * Base OpenID4VP syntax validation
   * Minimal profile-specific requirements - mostly relies on core validation
   *
   * Base profile is permissive - it does not enforce specific:
   * - client_id schemes (any valid format accepted)
   * - response_mode values (optional field)
   * - credential format restrictions (DCQL handles this)
   */
  validateSyntax(
    request: ExtendedAuthorizationRequest,
    checks: ValidationCheck[],
    issues: ValidationIssue[]
  ): void {
    // Base OpenID4VP has no additional syntax requirements beyond core validation
    // All profile-specific constraints are deferred to stricter profiles like PID Presentation
  }

  /**
   * Base OpenID4VP semantic validation
   * Uses DCQL query format
   */
  validateSemantics(
    request: ExtendedAuthorizationRequest,
    checks: ValidationCheck[],
    issues: ValidationIssue[]
  ): void {
    // Base profile uses DCQL format
    // No additional constraints beyond core semantic validation

    const category = "Profile";
    if (request.dcqlQuery) {
      this.addDetailedCheck(
        checks,
        "profile.base.query_format.dcql",
        "Query Format (DCQL)",
        true,
        category,
        Severity.WARNING,
        {
          subcategory: "Base OpenID4VP",
          field: "dcql_query",
          expectedValue: "dcql_query",
          actualValue: "dcql_query present",
          details: "Base profile supports DCQL format",
        }
      );
    } else {
      this.addDetailedCheck(
        checks,
        "profile.base.query_format.missing",
        "Query Format Missing",
        false,
        category,
        Severity.ERROR,
        {
          subcategory: "Base OpenID4VP",
          field: "dcql_query",
          expectedValue: "dcql_query",
          actualValue: "missing",
          details: "dcql_query is required",
        }
      );
    }
  }
}
