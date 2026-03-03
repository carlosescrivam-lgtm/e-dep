import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    const pageId = event.queryStringParameters?.pageId;
    if (!pageId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing pageId" }) };
    }

    // coger el último PDF generado para esa página
    const { data: row, error } = await supabase
      .from("generated_pdfs")
      .select("pdf_path, created_at")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    if (!row) return { statusCode: 404, body: JSON.stringify({ error: "No PDF yet" }) };

    const { data: signed, error: signError } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(row.pdf_path, 60 * 30); // 30 min

    if (signError) return { statusCode: 500, body: JSON.stringify({ error: signError.message }) };

    return { statusCode: 200, body: JSON.stringify({ url: signed.signedUrl, pdf_path: row.pdf_path }) };
  } catch (e: any) {
    console.error("getPdfLink ERROR:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};