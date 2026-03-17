import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async () => {
  try {
    const { data: homes, error: homesError } = await supabase
      .from("funeral_homes")
      .select("id, name, subscription_status, access_blocked, created_at")
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

   const { data: condolences, error: condolencesError } = await supabase
  .from("condolences")
  .select("page_id, moderation_status, deleted_at, created_at");

if (condolencesError) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: condolencesError.message }),
  };
}

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