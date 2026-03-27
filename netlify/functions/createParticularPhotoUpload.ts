import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const fileName = String(body?.fileName || "").trim();

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta fileName." }),
      };
    }

    const safeName = sanitizeFileName(fileName);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
    const path = `particulars/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("deceased-photos")
      .createSignedUploadUrl(path);

    if (error || !data) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: error?.message || "No se pudo preparar la subida.",
        }),
      };
    }

    const { data: publicData } = supabase.storage
      .from("deceased-photos")
      .getPublicUrl(path);

    return {
      statusCode: 200,
      body: JSON.stringify({
        path,
        token: data.token,
        publicUrl: publicData.publicUrl,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "No se pudo preparar la subida de foto.",
      }),
    };
  }
};