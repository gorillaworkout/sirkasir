// Direct Cloudflare D1 HTTP API client
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const CF_DB_ID = process.env.D1_DATABASE_ID || "";

const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DB_ID}/query`;

export async function d1Query(sql: string, params?: unknown[]) {
  const body: Record<string, unknown> = { sql };
  if (params && params.length > 0) {
    body.params = params;
  }

  const res = await fetch(D1_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
  }

  return data.result[0].results;
}
