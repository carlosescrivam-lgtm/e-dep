import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeStoragePath(value: string | null | undefined, bucketName: string) {
  if (!value) return null;

  // Si ya viene como ruta interna tipo "archivo.jpg" o "carpeta/archivo.jpg"
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value;
  }

  try {
    const publicMarker = `/storage/v1/object/public/${bucketName}/`;
    const signMarker = `/storage/v1/object/sign/${bucketName}/`;

    const publicIdx = value.indexOf(publicMarker);
    if (publicIdx !== -1) {
      return value
        .slice(publicIdx + publicMarker.length)
        .split("?")[0];
    }

    const signIdx = value.indexOf(signMarker);
    if (signIdx !== -1) {
      return value
        .slice(signIdx + signMarker.length)
        .split("?")[0];
    }

    return null;
  } catch {
    return null;
  }
}

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

    if (!funeralHomeId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta funeral_home_id" }),
      };
    }

    // 1) Buscar datos de la funeraria para logo
    const { data: funeralHome, error: funeralHomeError } = await supabase
      .from("funeral_homes")
      .select("id, logo_url")
      .eq("id", funeralHomeId)
      .maybeSingle();

    if (funeralHomeError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: funeralHomeError.message }),
      };
    }

    // 2) Buscar usuarios vinculados a la funeraria
    const { data: links, error: linksError } = await supabase
      .from("funeral_home_users")
      .select("user_id")
      .eq("funeral_home_id", funeralHomeId);

    if (linksError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: linksError.message }),
      };
    }

    const userIds = (links || []).map((x: any) => x.user_id).filter(Boolean);

    // 3) Buscar páginas de la funeraria y sus fotos
    const { data: pages, error: pagesError } = await supabase
  .from("deceased_pages")
  .select("id, photo_url, slug")
  .eq("funeral_home_id", funeralHomeId);

    if (pagesError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pagesError.message }),
      };
    }

    const pageIds = (pages || []).map((p: any) => p.id).filter(Boolean);

    // 4) Buscar condolencias y posibles fotos
    let condolences: any[] = [];
    if (pageIds.length > 0) {
      const { data: condolencesData, error: condolencesError } = await supabase
  .from("condolences")
  .select("id, page_id, photo_path")
  .in("page_id", pageIds);

      if (condolencesError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: condolencesError.message }),
        };
      }

      condolences = condolencesData || [];
    }

    // 5) Preparar borrado de archivos Storage

// Logo funeraria
const logoPaths = Array.from(
  new Set(
    [normalizeStoragePath(funeralHome?.logo_url, "funeral-logos")].filter(
      Boolean
    ) as string[]
  )
);

// Fotos de difuntos
const deceasedPhotoPaths = Array.from(
  new Set(
    (pages || [])
      .map((page: any) => normalizeStoragePath(page?.photo_url, "deceased-photos"))
      .filter(Boolean) as string[]
  )
);

// Fotos de condolencias
const condolencePhotoPaths = Array.from(
  new Set(
    (condolences || [])
      .map((c: any) => normalizeStoragePath(c?.photo_path, "condolence-photos"))
      .filter(Boolean) as string[]
  )
);

// PDFs
const pdfPaths = Array.from(
  new Set(
    (pages || [])
      .map((page: any) => (page?.slug ? `${page.slug}.pdf` : null))
      .filter(Boolean) as string[]
  )
);

    // 6) Borrar archivos de Storage antes de borrar filas

    if (logoPaths.length > 0) {
      const { error } = await supabase.storage
        .from("funeral-logos")
        .remove(logoPaths);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error.message }),
        };
      }
    }

    if (deceasedPhotoPaths.length > 0) {
      const { error } = await supabase.storage
        .from("deceased-photos")
        .remove(deceasedPhotoPaths);

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

if (pdfPaths.length > 0) {
  const { error } = await supabase.storage
    .from("pdfs")
    .remove(pdfPaths);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
    
    // 7) Borrar condolencias
    if (pageIds.length > 0) {
      const { error: condolencesDeleteError } = await supabase
        .from("condolences")
        .delete()
        .in("page_id", pageIds);

      if (condolencesDeleteError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: condolencesDeleteError.message }),
        };
      }
    }

    // 8) Borrar páginas
    const { error: pagesDeleteError } = await supabase
      .from("deceased_pages")
      .delete()
      .eq("funeral_home_id", funeralHomeId);

    if (pagesDeleteError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: pagesDeleteError.message }),
      };
    }

    // 9) Borrar relaciones funeral_home_users
    const { error: linksDeleteError } = await supabase
      .from("funeral_home_users")
      .delete()
      .eq("funeral_home_id", funeralHomeId);

    if (linksDeleteError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: linksDeleteError.message }),
      };
    }

    // 10) Borrar funeraria
    const { error: homeDeleteError } = await supabase
      .from("funeral_homes")
      .delete()
      .eq("id", funeralHomeId);

    if (homeDeleteError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: homeDeleteError.message }),
      };
    }

    // 11) Borrar usuarios de Supabase Auth
    for (const userId of userIds) {
      const { error: authDeleteError } =
        await supabase.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: authDeleteError.message }),
        };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e?.message || "No se pudo eliminar la funeraria",
      }),
    };
  }
};