import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async () => {
  try {
    const { data: homes, error: homesError } = await supabase
      .from("funeral_homes")
      .select("id, name, subscription_status, subscription_plan, subscription_until, trial_until, access_blocked, created_at")
      .or("is_system.is.false,is_system.is.null")
      .order("created_at", { ascending: false });

    if (homesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: homesError.message }),
      };
    }

    const { data: systemParticularsHome, error: systemHomeError } = await supabase
      .from("funeral_homes")
      .select("id, name, subscription_status, subscription_plan, subscription_until, trial_until, access_blocked, created_at")
      .eq("is_system", true)
      .eq("system_key", "particulars")
      .maybeSingle();

    if (systemHomeError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: systemHomeError.message }),
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

    const { data: condolences, error: condolencesError } = await supabase
      .from("condolences")
      .select("page_id, moderation_status, deleted_at, created_at");

    if (condolencesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: condolencesError.message }),
      };
    }

    const buildHomeStats = (home: any) => {
      const homePages = (pages ?? []).filter(
        (page) => page.funeral_home_id === home.id
      );

      const pageIds = homePages.map((p) => p.id);

      const homeCondolences = (condolences ?? []).filter((c) =>
        pageIds.includes(c.page_id)
      );

      const pending_condolences = homeCondolences.filter(
        (c) => c.moderation_status === "pending"
      ).length;

      const rejected_condolences = homeCondolences.filter(
        (c) => c.moderation_status === "rejected" || !!c.deleted_at
      ).length;

      const approved_condolences = homeCondolences.filter(
        (c) => c.moderation_status === "approved" && !c.deleted_at
      ).length;

      const total_condolences = homeCondolences.length;

      const now = new Date();

      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const condolences_today = homeCondolences.filter((c) => {
        if (!c.created_at) return false;
        return new Date(c.created_at) >= startOfToday;
      }).length;

      const condolences_last_7_days = homeCondolences.filter((c) => {
        if (!c.created_at) return false;
        return new Date(c.created_at) >= sevenDaysAgo;
      }).length;

      return {
        ...home,
        total_pages: homePages.length,
        open_pages: homePages.filter((p) => p.status === "open").length,
        closed_pages: homePages.filter((p) => p.status !== "open").length,
        total_condolences,
        approved_condolences,
        pending_condolences,
        rejected_condolences,
        condolences_today,
        condolences_last_7_days,
      };
    };

    const homesWithStats = (homes ?? []).map(buildHomeStats);

    const systemParticularsHomeWithStats = systemParticularsHome
      ? buildHomeStats(systemParticularsHome)
      : null;

    const normalHomeIds = new Set((homes ?? []).map((h) => h.id));
    const normalPages = (pages ?? []).filter((p) => normalHomeIds.has(p.funeral_home_id));

    const stats = {
      totalFuneralHomes: (homes ?? []).length,
      totalPages: normalPages.length,
      openPages: normalPages.filter((p) => p.status === "open").length,
      closedPages: normalPages.filter((p) => p.status !== "open").length,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        stats,
        funeralHomes: homesWithStats,
        systemParticularsHome: systemParticularsHomeWithStats,
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message ?? "Unknown error" }),
    };
  }
};