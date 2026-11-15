import { NextResponse } from "next/server";

export function adminApiErrorResponse(scope, error) {
  console.error(`${scope} failed:`, error);

  const code = error?.code;
  const schemaMismatch = ["P2021", "P2022"].includes(code)
    || ["42P01", "42703"].includes(error?.meta?.code)
    || /relation .* does not exist|column .* does not exist/i.test(error?.message || "");
  const databaseUnavailable = ["P1001", "P1002", "P1017"].includes(code);

  const responseCode = schemaMismatch
    ? "DATABASE_SCHEMA_OUT_OF_DATE"
    : databaseUnavailable
      ? "DATABASE_UNAVAILABLE"
      : "ADMIN_REQUEST_FAILED";
  const message = schemaMismatch
    ? "The database schema is out of date. Apply the pending database migration and try again."
    : databaseUnavailable
      ? "The database is temporarily unavailable. Try again shortly."
      : "The admin request failed. Try again or check the server logs.";

  return NextResponse.json({ error: message, code: responseCode }, { status: 500 });
}
