import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    const slug = event.queryStringParameters?.slug;
    const token = event.queryStringParameters?.token;

    if (!slug || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing slug or token" }) };
    }

    const { data: page, error: pageError } = await supabase
  .from("deceased_pages")
  .select(
    `
      id,
      full_name,
      custom_text,
      theme,
      status,
      closes_at,
      funeral_home_id,
      funeral_homes ( name )
    `
  )
  .eq("slug", slug)
  .eq("access_token", token)
  .maybeSingle();

    if (pageError) {
      return { statusCode: 500, body: JSON.stringify({ error: pageError.message }) };
    }

    if (!page) {
      return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
    }

    const { data: messages, error: msgError } = await supabase
      .from("condolences")
      .select("id, author_name, message, photo_path, created_at")
      .eq("page_id", page.id)
      .order("created_at", { ascending: false });

const withUrls = await Promise.all(
  (messages ?? []).map(async (m: any) => {
    if (!m.photo_path) return { ...m, photo_url: null };

    const { data: signed } = await supabase.storage
      .from("condolence-photos")
      .createSignedUrl(m.photo_path, 60 * 60 * 24 * 10);

    return { ...m, photo_url: signed?.signedUrl ?? null };
  })
);

    if (msgError) {
      return { statusCode: 500, body: JSON.stringify({ error: msgError.message }) };
    }

    const pageOut = {
  ...page,
  funeral_home_name: (page as any).funeral_homes?.name ?? null,
};

return {
  statusCode: 200,
  body: JSON.stringify({ page: pageOut, messages: withUrls }),
};
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Unknown error" }) };
  }
};