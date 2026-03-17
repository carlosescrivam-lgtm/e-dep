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
    const funeralHomeId = body?.funeral_home_id;
    const accessBlocked = body?.access_blocked;

    if (!funeralHomeId || typeof accessBlocked !== "boolean") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Faltan funeral_home_id o access_blocked",
        }),
      };
    }

    const { error } = await supabase
      .from("funeral_homes")
      .update({ access_blocked: accessBlocked })
      .eq("id", funeralHomeId);

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
        error: e?.message || "No se pudo cambiar el acceso de la funeraria",
      }),
    };
  }
};