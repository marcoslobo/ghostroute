/**
 * Dynamic Parameter Mapping Utility
 * 
 * Transforms DecodedParametersNames and DecodedParametersValues arrays
 * into a structured key-value object (Dictionary/Map).
 */

/**
 * Maps two parallel arrays (names and values) into a key-value object.
 * 
 * @param names - Array of parameter names
 * @param values - Array of corresponding parameter values
 * @returns Object with names as keys and values as values
 * 
 * @example
 * const names = ["commitment", "leafIndex", "nullifierHash"];
 * const values = ["0xabc123", 5, "0xdef456"];
 * const result = mapParams(names, values);
 * // result: { commitment: "0xabc123", leafIndex: 5, nullifierHash: "0xdef456" }
 */
export function mapParams(
  names: string[],
  values: unknown[],
): Record<string, unknown> {
  if (names.length !== values.length) {
    throw new Error(
      `Parameter count mismatch: ${names.length} names vs ${values.length} values`,
    );
  }

  const result: Record<string, unknown> = {};
  
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const value = values[i];
    
    if (name === undefined || name === null) {
      throw new Error(`Invalid parameter name at index ${i}`);
    }
    
    result[String(name)] = value;
  }
  
  return result;
}

/**
 * Maps arrays with type safety for known parameter structures.
 * 
 * @param names - Array of parameter names
 * @param values - Array of corresponding parameter values
 * @param requiredFields - Optional list of required field names
 * @returns Typed object with validated structure
 */
export function mapParamsWithValidation<T extends Record<string, unknown>>(
  names: string[],
  values: unknown[],
  requiredFields?: (keyof T)[],
): T {
  const mapped = mapParams(names, values);
  
  if (requiredFields) {
    for (const field of requiredFields) {
      if (!(field in mapped)) {
        throw new Error(`Missing required field: ${String(field)}`);
      }
    }
  }
  
  return mapped as T;
}

/**
 * Safely maps arrays, returning null instead of throwing on mismatch.
 * 
 * @param names - Array of parameter names
 * @param values - Array of corresponding parameter values
 * @returns Object with names as keys and values, or null on mismatch
 */
export function tryMapParams(
  names: string[],
  values: unknown[],
): Record<string, unknown> | null {
  try {
    return mapParams(names, values);
  } catch {
    return null;
  }
}
