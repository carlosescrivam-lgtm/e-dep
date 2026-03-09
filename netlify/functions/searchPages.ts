import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  try {
    const q = (event.queryStringParameters?.q || "").trim();

    if (!q || q.length < 2) {
      return {
        statusCode: 200,
        body: JSON.stringify({ items: [] }),
      };
    }

    const { data, error } = await supabase
      .from("deceased_pages")
      .select(`
        id,
        full_name,
        slug,
        access_token,
        status,
        closes_at,
        is_searchable,
        funeral_homes ( name )
      `)
      .eq("is_searchable", true)
      .eq("status", "open")
      .ilike("full_name", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    const items = (data || []).map((row: any) => {
      const funeralHomeSource = Array.isArray(row.funeral_homes)
        ? row.funeral_homes[0]
        : row.funeral_homes;

      return {
        id: row.id,
        full_name: row.full_name,
        slug: row.slug,
        access_token: row.access_token,
        funeral_home_name: funeralHomeSource?.name || "",
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ items }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Unexpected error" }),
    };
  }
};