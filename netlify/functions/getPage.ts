import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    const slug = event.queryStringParameters?.slug;
    const token = event.queryStringParameters?.token;

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing slug" }),
      };
    }

    let pageQuery = supabase
      .from("deceased_pages")
      .select(`
        id,
        full_name,
        custom_text,
        theme,
        status,
        closes_at,
        photo_url,
        funeral_homes ( name, logo_url )
      `)
      .eq("slug", slug);

    if (token) {
      pageQuery = pageQuery.eq("access_token", token);
    }

    const { data: page, error: pageError } = await pageQuery.maybeSingle();

    if (pageError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pageError.message }),
      };
    }

    if (!page) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Not found" }),
      };
    }

    const { data: messages, error: msgError } = await supabase
      .from("condolences")
      .select("id, author_name, message, photo_path, created_at")
      .eq("page_id", page.id)
      .is("deleted_at", null)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false });

    if (msgError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: msgError.message }),
      };
    }

    const withUrls = await Promise.all(
      (messages ?? []).map(async (m: any) => {
        if (!m.photo_path) return { ...m, photo_url: null };

        const { data: signed } = await supabase.storage
          .from("condolence-photos")
          .createSignedUrl(m.photo_path, 60 * 60 * 24 * 10);

        return { ...m, photo_url: signed?.signedUrl ?? null };
      })
    );

    const funeralHomeSource = Array.isArray((page as any).funeral_homes)
      ? (page as any).funeral_homes[0]
      : (page as any).funeral_homes;

    const pageOut = {
      ...page,
      funeral_home_name: funeralHomeSource?.name ?? null,
      funeral_home_logo_url: funeralHomeSource?.logo_url ?? null,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ page: pageOut, messages: withUrls }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message ?? "Unknown error" }),
    };
  }
};