import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const slug = body?.slug;
    const token = body?.token;
    const author_name = body?.author_name ?? null;
    const message = body?.message;
    const photo_path = body?.photo_path ?? null;

    if (!slug || !token || !message || !String(message).trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing data" }) };
    }

    // 1) validar página + token
    const { data: page, error: pageError } = await supabase
      .from("deceased_pages")
      .select("id, status, closes_at")
      .eq("slug", slug)
      .eq("access_token", token)
      .maybeSingle();

    if (pageError) return { statusCode: 500, body: JSON.stringify({ error: pageError.message }) };
    if (!page) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    // 2) comprobar abierta y no pasada de fecha
    const closesAt = new Date(page.closes_at).getTime();
    if (page.status !== "open" || Date.now() > closesAt) {
      return { statusCode: 403, body: JSON.stringify({ error: "Page closed" }) };
    }

    // 3) insertar condolencia
    const { error: insError } = await supabase.from("condolences").insert({
      page_id: page.id,
      author_name: author_name && String(author_name).trim() ? String(author_name).trim() : null,
      message: String(message).trim(),
      photo_path: photo_path,
    });

    if (insError) {
      return { statusCode: 500, body: JSON.stringify({ error: insError.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};