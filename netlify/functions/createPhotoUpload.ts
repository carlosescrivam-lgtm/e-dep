import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const body = event.body ? JSON.parse(event.body) : null;
    const slug = body?.slug;
    const token = body?.token;
    const fileName = body?.fileName;
    const mimeType = body?.mimeType;

    if (!slug || !token || !fileName || !mimeType) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing data" }) };
    }

    // validar página + token
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

    // tamaño máximo (por si quieres controlarlo aquí también)
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${page.id}/${Date.now()}_${safeName}`;

    // URL firmada para subir (válida 5 minutos)
    const { data: signed, error: signError } = await supabase.storage
      .from("condolence-photos")
      .createSignedUploadUrl(path);

    if (signError) return { statusCode: 500, body: JSON.stringify({ error: signError.message }) };

    return {
      statusCode: 200,
      body: JSON.stringify({
        photo_path: path,
        upload_url: signed.signedUrl,
        token: signed.token, // necesario para completar upload
      }),
    };
  } catch (e: any) {
    console.error("createPhotoUpload ERROR:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};