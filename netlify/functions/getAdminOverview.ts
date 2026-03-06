import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async () => {
  try {
    const { data: homes, error: homesError } = await supabase
      .from("funeral_homes")
      .select("id, name, subscription_status, created_at")
      .order("created_at", { ascending: false });

    if (homesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: homesError.message }),
      };
    }

    const { data: pages, error: pagesError } = await supabase
      .from("deceased_pages")
      .select("id, status, funeral_home_id");

    if (pagesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pagesError.message }),
      };
    }

    const homesWithStats = (homes ?? []).map((home) => {
      const homePages = (pages ?? []).filter(
        (page) => page.funeral_home_id === home.id
      );

      return {
        ...home,
        total_pages: homePages.length,
        open_pages: homePages.filter((p) => p.status === "open").length,
        closed_pages: homePages.filter((p) => p.status !== "open").length,
      };
    });

    const stats = {
      totalFuneralHomes: (homes ?? []).length,
      totalPages: (pages ?? []).length,
      openPages: (pages ?? []).filter((p) => p.status === "open").length,
      closedPages: (pages ?? []).filter((p) => p.status !== "open").length,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        stats,
        funeralHomes: homesWithStats,
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message ?? "Unknown error" }),
    };
  }
};