export async function readApiResponse(response, fallbackMessage = "The request failed") {
  const responseText = await response.text();
  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    // Non-JSON server errors are reported with status below instead of a parser exception.
  }

  if (!response.ok) {
    throw new Error(data?.error || `${fallbackMessage} (HTTP ${response.status})`);
  }
  if (!data || typeof data !== "object") {
    throw new Error(`${fallbackMessage}: the server returned an empty or invalid response.`);
  }
  return data;
}
