/**
 * Event Router
 * 
 * Determines the type of event based on decoded parameters
 * and routes to the appropriate handler.
 */

import { DecodedParamsMap, EventType } from "./types.ts";

const DEPOSIT_EVENT_FIELDS = ["commitment", "leafIndex"];
const ACTION_EXECUTED_FIELDS = ["nullifierHash", "changeCommitment", "changeIndex"];

/**
 * Determines the event type based on decoded parameters.
 * 
 * @param decoded - The decoded parameters from the webhook
 * @returns The detected event type: 'Deposit', 'ActionExecuted', or 'Unknown'
 */
export function determineEventType(decoded: DecodedParamsMap): EventType {
  const hasDepositFields = DEPOSIT_EVENT_FIELDS.every(
    (field) => field in decoded,
  );
  const hasActionExecutedFields = ACTION_EXECUTED_FIELDS.every(
    (field) => field in decoded,
  );

  if (hasDepositFields && hasActionExecutedFields) {
    // Both present - this is likely an ActionExecuted that includes
    // commitment information (could be both deposit and withdrawal in one tx)
    // Prioritize ActionExecuted as it's more specific
    return "ActionExecuted";
  }

  if (hasActionExecutedFields) {
    return "ActionExecuted";
  }

  if (hasDepositFields) {
    return "Deposit";
  }

  return "Unknown";
}

/**
 * Validates that the decoded parameters contain the required fields
 * for the detected event type.
 * 
 * @param decoded - The decoded parameters
 * @param eventType - The detected event type
 * @returns Object with isValid flag and any missing fields
 */
export function validateEventType(
  decoded: DecodedParamsMap,
  eventType: EventType,
): { isValid: boolean; missingFields: string[] } {
  const requiredFields = eventType === "ActionExecuted"
    ? ACTION_EXECUTED_FIELDS
    : eventType === "Deposit"
    ? DEPOSIT_EVENT_FIELDS
    : [];

  const missingFields = requiredFields.filter(
    (field) => !(field in decoded),
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Checks if the decoded parameters match a specific event type pattern.
 * 
 * @param decoded - The decoded parameters
 * @param eventType - The event type to check
 * @returns true if the parameters match the event type
 */
export function matchesEventType(
  decoded: DecodedParamsMap,
  eventType: EventType,
): boolean {
  const validation = validateEventType(decoded, eventType);
  return validation.isValid;
}

/**
 * Gets a human-readable description of the event based on its type.
 * 
 * @param eventType - The event type
 * @param decoded - The decoded parameters
 * @returns Human-readable description
 */
export function describeEvent(
  eventType: EventType,
  decoded: DecodedParamsMap,
): string {
  switch (eventType) {
    case "Deposit": {
      const leafIndex = decoded.leafIndex as number;
      return `Deposit: leafIndex=${leafIndex}`;
    }
    case "ActionExecuted": {
      const changeIndex = decoded.changeIndex as number;
      return `ActionExecuted: changeIndex=${changeIndex}`;
    }
    default:
      return `Unknown event with ${Object.keys(decoded).length} parameters`;
  }
}
