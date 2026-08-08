export type ValidationResult<T = undefined> =
  | {
      success: true;
      data: T;
      errors: [];
    }
  | {
      success: false;
      data: undefined;
      errors: string[];
    };

export interface ValidationError {
  field: string;
  message: string;
}

export const isNonEmptyString = (
  value: unknown,
): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isEmail = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

export const isMinLength = (
  value: unknown,
  minimum: number,
): value is string => {
  return typeof value === "string" && value.length >= minimum;
};

export const isMaxLength = (
  value: unknown,
  maximum: number,
): value is string => {
  return typeof value === "string" && value.length <= maximum;
};

export const validateRequired = (
  value: unknown,
  field = "value",
): ValidationError | null => {
  if (!isNonEmptyString(value)) {
    return {
      field,
      message: `${field} is required`,
    };
  }

  return null;
};

export const validateEmail = (
  value: unknown,
  field = "email",
): ValidationError | null => {
  if (!isNonEmptyString(value)) {
    return {
      field,
      message: `${field} is required`,
    };
  }

  if (!isEmail(value)) {
    return {
      field,
      message: `${field} must be a valid email address`,
    };
  }

  return null;
};

export const validateLength = (
  value: unknown,
  minimum: number,
  maximum?: number,
  field = "value",
): ValidationError | null => {
  if (!isNonEmptyString(value)) {
    return {
      field,
      message: `${field} is required`,
    };
  }

  if (value.length < minimum) {
    return {
      field,
      message: `${field} must be at least ${minimum} characters`,
    };
  }

  if (maximum !== undefined && value.length > maximum) {
    return {
      field,
      message: `${field} must be at most ${maximum} characters`,
    };
  }

  return null;
};

export const validatePassword = (
  value: unknown,
  field = "password",
): ValidationError | null => {
  return validateLength(value, 8, 128, field);
};

export const validatePasswordConfirmation = (
  password: unknown,
  confirmation: unknown,
  field = "confirmPassword",
): ValidationError | null => {
  if (!isNonEmptyString(confirmation)) {
    return {
      field,
      message: `${field} is required`,
    };
  }

  if (password !== confirmation) {
    return {
      field,
      message: `${field} does not match password`,
    };
  }

  return null;
};

export const collectValidationErrors = (
  errors: Array<ValidationError | null>,
): ValidationError[] => {
  return errors.filter(
    (error): error is ValidationError => error !== null,
  );
};

export const isValid = (
  errors: Array<ValidationError | null>,
): boolean => {
  return collectValidationErrors(errors).length === 0;
};