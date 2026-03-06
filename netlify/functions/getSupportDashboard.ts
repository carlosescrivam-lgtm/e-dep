import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    const funeralHomeId = event.queryStringParameters?.funeral_home_id;

    if (!funeralHomeId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing funeral_home_id" }),
      };
    }

    const { data: funeralHome, error: homeError } = await supabase
      .from("funeral_homes")
      .select(
        "id, name, address, city, postal_code, phone, contact_email, website, logo_url, subscription_status, created_at"
      )
      .eq("id", funeralHomeId)
      .maybeSingle();

    if (homeError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: homeError.message }),
      };
    }

    if (!funeralHome) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Funeral home not found" }),
      };
    }

    const { data: pages, error: pagesError } = await supabase
      .from("deceased_pages")
      .select(
        `
          id,
          full_name,
          custom_text,
          theme,
          status,
          closes_at,
          slug,
          access_token,
          created_at,
          funeral_home_id,
          funeral_homes ( name )
        `
      )
      .eq("funeral_home_id", funeralHomeId)
      .order("created_at", { ascending: false });

    if (pagesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pagesError.message }),
      };
    }

    const pageIds = (pages ?? []).map((p: any) => p.id);

    let condolences: any[] = [];

    if (pageIds.length > 0) {
      const { data: condolencesData, error: condolencesError } = await supabase
        .from("condolences")
        .select("id, page_id, created_at")
        .in("page_id", pageIds);

      if (condolencesError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: condolencesError.message }),
        };
      }

      condolences = condolencesData ?? [];
    }

    const countByPageId: Record<string, number> = {};

    for (const condolence of condolences) {
      if (!condolence.page_id) continue;
      countByPageId[condolence.page_id] =
        (countByPageId[condolence.page_id] || 0) + 1;
    }

    const items = (pages ?? []).map((page: any) => {
      const funeralHomeSource = Array.isArray(page.funeral_homes)
        ? page.funeral_homes[0]
        : page.funeral_homes;

      return {
        id: String(page.id),
        full_name: page.full_name || "Sin nombre",
        custom_text: page.custom_text || "",
        theme: page.theme || "default",
        status: page.status || "open",
        closes_at: page.closes_at || null,
        slug: page.slug || "",
        access_token: page.access_token || "",
        created_at: page.created_at || null,
        funeral_home_name: funeralHomeSource?.name || funeralHome.name || "",
        condolences_count: countByPageId[String(page.id)] || 0,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        funeralHome,
        items,
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message ?? "Unknown error" }),
    };
  }
};