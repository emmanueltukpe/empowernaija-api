import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * Nigerian TIN (Tax Identification Number) format: 12345678-0001
 * Format: 8 digits, hyphen, 4 digits
 */
export const TIN_REGEX = /^\d{8}-\d{4}$/;

/**
 * Nigerian NIN (National Identification Number) format: 11 digits
 * Format: 12345678901
 */
export const NIN_REGEX = /^\d{11}$/;

/**
 * Validates Nigerian TIN format (########-####)
 */
export function IsTIN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isTIN",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          return typeof value === "string" && TIN_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Nigerian TIN format (########-####, e.g., 12345678-0001)`;
        },
      },
    });
  };
}

/**
 * Validates Nigerian NIN format (11 digits)
 */
export function IsNIN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isNIN",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          return typeof value === "string" && NIN_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Nigerian NIN format (11 digits, e.g., 12345678901)`;
        },
      },
    });
  };
}

/**
 * Utility function to validate TIN format
 */
export function validateTIN(tin: string): boolean {
  return TIN_REGEX.test(tin);
}

/**
 * Utility function to validate NIN format
 */
export function validateNIN(nin: string): boolean {
  return NIN_REGEX.test(nin);
}

/**
 * Utility function to format TIN (adds hyphen if missing)
 */
export function formatTIN(tin: string): string | null {
  const cleaned = tin.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `${cleaned.substring(0, 8)}-${cleaned.substring(8, 12)}`;
  }
  return null;
}

/**
 * Utility function to format NIN (removes non-digits)
 */
export function formatNIN(nin: string): string | null {
  const cleaned = nin.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned;
  }
  return null;
}

