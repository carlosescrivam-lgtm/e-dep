import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const pageId = body?.page_id;

    if (!pageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing page_id" }),
      };
    }

    const { data, error } = await supabase
      .from("deceased_pages")
      .select("full_name, slug, access_token, status")
      .eq("id", pageId)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Not found" }),
      };
    }

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      process.env.URL ||
      "http://localhost:8888";

    const url = `${origin}/p/${data.slug}?token=${data.access_token}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        full_name: data.full_name,
        status: data.status,
        url,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "Unknown error",
      }),
    };
  }
};