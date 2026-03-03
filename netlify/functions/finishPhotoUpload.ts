import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const body = event.body ? JSON.parse(event.body) : null;
    const photo_path = body?.photo_path;
    const upload_token = body?.upload_token;

    if (!photo_path || !upload_token) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing data" }) };
    }

    const { data, error } = await supabase.storage
      .from("condolence-photos")
      .createSignedUrl(photo_path, 60 * 60 * 24 * 10);

    // Nota: Supabase Storage no necesita "finish" en todas las versiones,
    // pero algunas usan token. Si tu versión lo requiere, lo ajustamos.
    // Para mantenerlo simple: devolvemos signedUrl para mostrar.
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    return { statusCode: 200, body: JSON.stringify({ signed_url: data.signedUrl }) };
  } catch (e: any) {
    console.error("finishPhotoUpload ERROR:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};