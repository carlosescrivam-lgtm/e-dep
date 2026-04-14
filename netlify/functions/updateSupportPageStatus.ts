import { Handler } from "@netlify/functions";
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
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const pageId = body?.pageId;
    const status = body?.status;

    if (!pageId || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan pageId o status" }),
      };
    }

    if (status !== "open" && status !== "closed") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Status inválido" }),
      };
    }

   let updatePayload: Record<string, any> = { status };

if (status === "open") {
  const newCloseDate = new Date();
  newCloseDate.setDate(newCloseDate.getDate() + 7);
  updatePayload.closes_at = newCloseDate.toISOString();
}

const { error } = await supabase
  .from("deceased_pages")
  .update(updatePayload)
  .eq("id", pageId);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e?.message || "No se pudo actualizar el estado de la página",
      }),
    };
  }
};