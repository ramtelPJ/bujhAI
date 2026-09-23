/** Exact user-facing strings required by authentication-security.md §4. */
export const AUTH_ERRORS = {
  invalidLogin: "Invalid login details.",
  invalidVerification: "This verification link is invalid or expired.",
  tooManyAttempts: "Too many attempts. Try again later.",
  unauthenticated: "Please log in to continue.",
  forbidden: "You don't have access to this item.",
  notFound: "We couldn't find that item.",
  generic: "Something went wrong. Please try again.",
} as const;

/**
 * Shape returned by Clerk's Future API (`signIn.password()`, `signUp.verifications.*`, etc):
 * a wrapper error whose `code` is generic ("api_response_error") — the field-specific code and
 * user-safe message live in `errors[0]`.
 */
type ClerkFutureError =
  | {
      code?: string;
      errors?: Array<{ code: string; longMessage?: string; message?: string }>;
    }
  | null
  | undefined;

// Both codes below collapse to the same message so a login failure never reveals
// whether the email address has an account.
const SIGN_IN_CODES = new Set(["form_identifier_not_found", "form_password_incorrect"]);
const VERIFICATION_CODES = new Set([
  "form_code_incorrect",
  "verification_expired",
  "verification_failed",
  "verification_already_verified",
]);
const RATE_LIMIT_CODES = new Set(["too_many_requests"]);

function fieldError(error: ClerkFutureError) {
  return error?.errors?.[0];
}

function fieldCode(error: ClerkFutureError): string | undefined {
  return fieldError(error)?.code ?? error?.code;
}

export function mapSignInError(error: ClerkFutureError): string {
  const code = fieldCode(error);
  if (code && RATE_LIMIT_CODES.has(code)) return AUTH_ERRORS.tooManyAttempts;
  if (code && SIGN_IN_CODES.has(code)) return AUTH_ERRORS.invalidLogin;
  return AUTH_ERRORS.generic;
}

export function mapVerificationError(error: ClerkFutureError): string {
  const code = fieldCode(error);
  if (code && RATE_LIMIT_CODES.has(code)) return AUTH_ERRORS.tooManyAttempts;
  if (code && VERIFICATION_CODES.has(code)) return AUTH_ERRORS.invalidVerification;
  return AUTH_ERRORS.generic;
}

export function mapSignUpError(error: ClerkFutureError): string {
  const code = fieldCode(error);
  if (code && RATE_LIMIT_CODES.has(code)) return AUTH_ERRORS.tooManyAttempts;
  if (code === "form_identifier_exists") {
    return "An account with this email already exists. Try logging in instead.";
  }
  // Password-strength/format feedback doesn't reveal account existence, safe to pass through.
  return fieldError(error)?.longMessage ?? AUTH_ERRORS.generic;
}
