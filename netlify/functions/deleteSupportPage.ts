import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

function normalizeStoragePath(urlOrPath: string | null | undefined, bucket: string) {
  if (!urlOrPath) return null;

  const marker = `/${bucket}/`;
  const idx = urlOrPath.indexOf(marker);

  if (idx >= 0) {
    return urlOrPath.slice(idx + marker.length);
  }

  return urlOrPath;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const authHeader =
      event.headers.authorization || event.headers.Authorization || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Falta sesión." }),
      };
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Sesión inválida." }),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("funeral_home_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: profileError.message }),
      };
    }

    if (!profile || profile.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "No eres admin." }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;
    const pageId = String(body?.page_id || "").trim();

    if (!pageId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta page_id." }),
      };
    }

    const { data: page, error: pageError } = await supabase
      .from("deceased_pages")
      .select("id, slug, photo_url")
      .eq("id", pageId)
      .maybeSingle();

    if (pageError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pageError.message }),
      };
    }

    if (!page) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "La página no existe o ya fue eliminada." }),
      };
    }

    const { data: condolences, error: condolencesLoadError } = await supabase
      .from("condolences")
      .select("id, photo_path")
      .eq("page_id", pageId);

    if (condolencesLoadError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: condolencesLoadError.message }),
      };
    }

    const deceasedPhotoPath = normalizeStoragePath(page.photo_url, "deceased-photos");
    const condolencePhotoPaths = Array.from(
      new Set(
        (condolences || [])
          .map((c: any) => normalizeStoragePath(c?.photo_path, "condolence-photos"))
          .filter(Boolean) as string[]
      )
    );

    const pdfPath = page.slug ? `${page.slug}.pdf` : null;

    if (deceasedPhotoPath) {
      const { error } = await supabase.storage
        .from("deceased-photos")
        .remove([deceasedPhotoPath]);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    if (condolencePhotoPaths.length > 0) {
      const { error } = await supabase.storage
        .from("condolence-photos")
        .remove(condolencePhotoPaths);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    if (pdfPath) {
      const { error } = await supabase.storage
        .from("pdfs")
        .remove([pdfPath]);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    const { error: condolencesDeleteError } = await supabase
      .from("condolences")
      .delete()
      .eq("page_id", pageId);

    if (condolencesDeleteError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: condolencesDeleteError.message }),
      };
    }

    const { data: deletedPages, error: pageDeleteError } = await supabase
      .from("deceased_pages")
      .delete()
      .eq("id", pageId)
      .select("id");

    if (pageDeleteError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pageDeleteError.message }),
      };
    }

    if (!deletedPages || deletedPages.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "La página no se ha eliminado en la base de datos." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    console.error("deleteSupportPage error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e?.message || "No se pudo eliminar la página.",
      }),
    };
  }
};