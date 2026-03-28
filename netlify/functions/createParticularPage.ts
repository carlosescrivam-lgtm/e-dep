import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;

    const fullName = String(body?.full_name || "").trim();
    const customText = String(body?.custom_text || "").trim();
    const contactEmail = String(body?.contact_email || "").trim();
    const durationDays = Number(body?.duration_days || 7);
    const theme = String(body?.theme || "classic").trim();
    const isSearchable = !!body?.is_searchable;
    const photoUrl = body?.photo_url ? String(body.photo_url).trim() : null;
    console.log("CREATE PARTICULAR PAGE photo_url recibida:", photoUrl);

    if (!fullName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta el nombre del ser querido." }),
      };
    }

    if (!contactEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta el email de contacto." }),
      };
    }

    const allowedDurations = [3, 7, 10];
    const safeDuration = allowedDurations.includes(durationDays) ? durationDays : 7;

    const slug =
      slugify(fullName) + "-" + Date.now().toString().slice(-6);

    const accessToken =
      Math.random().toString(36).slice(2) + Date.now().toString(36);

    const closesAt = new Date();
    closesAt.setDate(closesAt.getDate() + safeDuration);

    const GENERIC_FUNERAL_HOME_ID = "70fa03b2-753e-4894-90fd-a7371b4e0cb5";

const { data: systemFuneralHome, error: systemFuneralHomeError } = await supabase
  .from("funeral_homes")
  .select("id")
  .eq("system_key", "particulars")
  .eq("is_system", true)
  .maybeSingle();

if (systemFuneralHomeError || !systemFuneralHome?.id) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "No se encontró la funeraria interna de particulares.",
    }),
  };
}

console.log("CREATE PARTICULAR PAGE payload photo_url:", photoUrl);


    const payload = {
      full_name: fullName,
      custom_text: customText || null,
      slug,
      access_token: accessToken,
      status: "pending_payment",
      closes_at: closesAt.toISOString(),
      theme,
      family_email: contactEmail,
      funeral_home_id: systemFuneralHome.id,
      photo_url: null,
      is_searchable: isSearchable,
    };

   const { data, error } = await supabase
  .from("deceased_pages")
  .insert(payload)
  .select("id, slug, access_token, status, photo_url")
  .single();

console.log("CREATE PARTICULAR PAGE inserted row photo_url:", data?.photo_url);

if (error || !data) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: error?.message || "No se pudo crear la página." }),
  };
}

// Si la foto no quedó guardada en el insert, la actualizamos justo después
if (photoUrl && !data.photo_url) {
  const { data: updatedRow, error: updatePhotoError } = await supabase
    .from("deceased_pages")
    .update({ photo_url: photoUrl })
    .eq("id", data.id)
    .select("id, slug, access_token, status, photo_url")
    .single();

  if (updatePhotoError) {
    console.error("CREATE PARTICULAR PAGE update photo_url error:", updatePhotoError);
  } else if (updatedRow) {
    console.log("CREATE PARTICULAR PAGE updated row photo_url:", updatedRow.photo_url);
    Object.assign(data, updatedRow);
  }
}

   return {
  statusCode: 200,
  body: JSON.stringify({
    ok: true,
    pageId: data.id,
    slug: data.slug,
    accessToken: data.access_token,
    status: data.status,
    photo_url: data.photo_url || null,
  }),
};
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err?.message || "No se pudo crear la página particular.",
      }),
    };
  }
};