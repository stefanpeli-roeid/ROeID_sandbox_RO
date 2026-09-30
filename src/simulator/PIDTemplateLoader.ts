/**
 * PID Template Loader
 * Loads and manages different PID credential templates for wallet behavior simulation
 */

import { PIDCredentialData } from "./PIDDataGenerator.js";
import { SimulationMode } from "../types/index.js";

export type PIDTemplateType = "normal" | "special-characters" | "incomplete-birthdate" | "romania";

export class PIDTemplateLoader {
  private static readonly templates: Record<PIDTemplateType, PIDCredentialData> = {
    romania: {
      id: "pid-sd-jwt",
      format: "dc+sd-jwt",
      claims: {
        given_name: "Ion",
        family_name: "Popescu",
        birthdate: "1988-05-20",
        address: {
          street_address: "Bulevardul Regina Elisabeta nr. 45, Bl. B2, Ap. 12",
          postal_code: "050013",
          locality: "Sector 5, București",
          country: "RO",
        },
        nationalities: ["RO"],
        gender: "M",
        birth_place: "București",
        birth_country: "RO",
        age_over_18: true,
        age_over_21: true,
        personal_administrative_number: "1880520410012",
        issuing_country: "RO",
        issuing_authority: "Ministerul Afacerilor Interne",
        document_number: "RX123456",
      },
      selectivelyDisclosableClaims: [
        "given_name",
        "family_name",
        "birthdate",
        "address.street_address",
        "address.postal_code",
        "address.locality",
        "address.country",
        "nationalities",
        "gender",
        "birth_place",
        "birth_country",
        "age_over_18",
        "age_over_21",
        "personal_administrative_number",
        "issuing_country",
        "issuing_authority",
        "document_number",
      ],
    },
    normal: {
      id: "pid-sd-jwt",
      format: "dc+sd-jwt",
      claims: {
        given_name: "Erika",
        family_name: "Mustermann",
        birthdate: "1985-03-15",
        address: {
          street_address: "Hauptstraße 42",
          postal_code: "10115",
          locality: "Berlin",
          country: "DE",
        },
        nationalities: ["DE"],
        gender: "F",
        birth_place: "München",
        birth_country: "DE",
        age_over_18: true,
        age_over_21: true,
      },
      selectivelyDisclosableClaims: [
        "given_name",
        "family_name",
        "birthdate",
        "address.street_address",
        "address.postal_code",
        "address.locality",
        "address.country",
        "nationalities",
        "gender",
        "birth_place",
        "birth_country",
        "age_over_18",
        "age_over_21",
      ],
    },
    "special-characters": {
      id: "pid-sd-jwt",
      format: "dc+sd-jwt",
      claims: {
        given_name: "Müñez",
        family_name: "Bjørgßöñ",
        birthdate: "1988-07-22",
        address: {
          street_address: "Strasse mit Überumlaut 99",
          postal_code: "20095",
          locality: "Köln",
          country: "DE",
        },
        nationalities: ["DE"],
        gender: "M",
        birth_place: "Düsseldorf",
        birth_country: "DE",
        age_over_18: true,
        age_over_21: true,
      },
      selectivelyDisclosableClaims: [
        "given_name",
        "family_name",
        "birthdate",
        "address.street_address",
        "address.postal_code",
        "address.locality",
        "address.country",
        "nationalities",
        "gender",
        "birth_place",
        "birth_country",
        "age_over_18",
        "age_over_21",
      ],
    },
    "incomplete-birthdate": {
      id: "pid-sd-jwt",
      format: "dc+sd-jwt",
      claims: {
        given_name: "Peter",
        family_name: "Schmidt",
        birthdate: "1994-00-00",
        address: {
          street_address: "Bahnhofstraße 15",
          postal_code: "80335",
          locality: "München",
          country: "DE",
        },
        nationalities: ["DE"],
        gender: "M",
        birth_place: "Hamburg",
        birth_country: "DE",
        age_over_18: true,
        age_over_21: true,
      },
      selectivelyDisclosableClaims: [
        "given_name",
        "family_name",
        "birthdate",
        "address.street_address",
        "address.postal_code",
        "address.locality",
        "address.country",
        "nationalities",
        "gender",
        "birth_place",
        "birth_country",
        "age_over_18",
        "age_over_21",
      ],
    },
  };

  /**
   * Load PID template by name
   */
  static loadTemplate(templateType: PIDTemplateType): PIDCredentialData {
    const template = this.templates[templateType];
    if (!template) {
      throw new Error(`Unknown PID template: ${templateType}`);
    }
    // Return a deep copy to avoid mutations
    return JSON.parse(JSON.stringify(template));
  }

  /**
   * Get template name for a given simulation mode
   * Maps simulation modes to PID templates
   */
  static getTemplateForMode(mode: SimulationMode): PIDTemplateType {
    switch (mode) {
      case SimulationMode.SPECIAL_CHARACTERS_PID:
        return "special-characters";
      case SimulationMode.INCOMPLETE_BIRTHDATE_PID:
        return "incomplete-birthdate";
      case SimulationMode.VALID:
      case SimulationMode.EXPIRED:
      case SimulationMode.NOT_YET_VALID:
      case SimulationMode.INVALID_SIGNATURE:
      case SimulationMode.MISSING_SIGNATURE:
      case SimulationMode.MISSING_CLAIMS:
      case SimulationMode.OVER_DISCLOSURE:
      case SimulationMode.MODIFIED_CLAIMS:
      case SimulationMode.WRONG_NONCE:
      case SimulationMode.MISSING_HOLDER_BINDING:
      case SimulationMode.WRONG_AUDIENCE:
      case SimulationMode.FORMAT_MISMATCH:
      case SimulationMode.MALFORMED_SD_JWT:
      case SimulationMode.WRONG_ISSUER:
      case SimulationMode.WRONG_CREDENTIAL_TYPE:
      default:
        return "normal";
    }
  }

  /**
   * List all available templates
   */
  static listTemplates(): PIDTemplateType[] {
    return Object.keys(this.templates) as PIDTemplateType[];
  }

  /**
   * Get description of a template
   */
  static getTemplateDescription(templateType: PIDTemplateType): string {
    const template = this.templates[templateType];
    return (template as any).description || "No description available";
  }
}
