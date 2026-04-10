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

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    // 🔐 AUTH
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

    // 🔐 COMPROBAR ADMIN
    const { data: profile } = await supabase
      .from("funeral_home_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "No eres admin." }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;

    const {
      full_name,
      slug,
      access_token,
      funeral_home_id,
      photo_url,
      custom_text,
      family_email,
      is_searchable,
      closes_at,
    } = body || {};

    // 🛑 VALIDACIÓN BÁSICA
    if (!full_name || !slug || !funeral_home_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan datos obligatorios." }),
      };
    }

    // 🛑 SOLO PERMITIR PARTICULARES
    const { data: home } = await supabase
      .from("funeral_homes")
      .select("is_system, system_key")
      .eq("id", funeral_home_id)
      .maybeSingle();

    if (!home || !home.is_system || home.system_key !== "particulars") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Solo se permite crear en Particulares.",
        }),
      };
    }

    // ✅ CREAR PÁGINA
    const { error } = await supabase.from("deceased_pages").insert({
      full_name,
      slug,
      access_token,
      funeral_home_id,
      photo_url,
      custom_text,
      family_email,
      is_searchable,
      closes_at,
      status: "open",
    });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e?.message || "Error creando página.",
      }),
    };
  }
};