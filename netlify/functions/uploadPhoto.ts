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

    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.includes("application/json")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Content-Type must be application/json" }) };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const slug = body?.slug;
    const token = body?.token;
    const fileName = body?.fileName; // ej: foto.jpg
    const base64 = body?.base64; // sin prefijo data:
const mimeType = body?.mimeType;
    if (!slug || !token || !fileName || !base64 || !mimeType) {
  return { statusCode: 400, body: JSON.stringify({ error: "Missing data" }) };
}

    // Validar página + token
    const { data: page, error: pageError } = await supabase
      .from("deceased_pages")
      .select("id, status, closes_at")
      .eq("slug", slug)
      .eq("access_token", token)
      .maybeSingle();

    if (pageError) return { statusCode: 500, body: JSON.stringify({ error: pageError.message }) };
    if (!page) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    const closesAt = new Date(page.closes_at).getTime();
    if (page.status !== "open" || Date.now() > closesAt) {
      return { statusCode: 403, body: JSON.stringify({ error: "Page closed" }) };
    }
console.log("uploadPhoto called", {
  slug,
  hasToken: !!token,
  fileName,
  base64Length: String(base64).length,
  contentType: mimeType,
});
    // Decodificar base64
    const buffer = Buffer.from(base64, "base64");

    // Validación básica de tamaño (2MB)
    const maxBytes = 2 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return { statusCode: 400, body: JSON.stringify({ error: "Image too large (max 2MB)" }) };
    }

    // Guardar en Storage con path único
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${page.id}/${Date.now()}_${safeName}`;

    const { data: upData, error: upError } = await supabase.storage
  .from("condolence-photos")
  .upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });

if (upError) {
  console.error("SUPABASE UPLOAD ERROR:", upError);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: upError.message,
      details: (upError as any).error ?? null,
      hint: (upError as any).hint ?? null,
    }),
  };
}

console.log("Upload OK:", upData);

    // Crear URL firmada (válida 10 días)
    const { data: signed, error: signError } = await supabase.storage
      .from("condolence-photos")
      .createSignedUrl(path, 60 * 60 * 24 * 10);

    if (signError) return { statusCode: 500, body: JSON.stringify({ error: signError.message }) };

    return {
      statusCode: 200,
      body: JSON.stringify({ photo_path: path, signed_url: signed.signedUrl }),
    };
  } catch (e: any) {
    console.error("uploadPhoto ERROR:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};