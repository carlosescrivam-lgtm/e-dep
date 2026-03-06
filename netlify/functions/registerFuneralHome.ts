import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : null;

    const name = body?.name?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan datos obligatorios" }),
      };
    }

   const { data: authData, error: authError } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

    if (authError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: authError.message }),
      };
    }

    const user = authData.user;

    if (!user) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No se pudo crear el usuario" }),
      };
    }

    const { data: funeralHome, error: funeralHomeError } = await supabase
      .from("funeral_homes")
      .insert({
        name,
        owner_user_id: user.id,
        subscription_status: "inactive",
      })
      .select("id")
      .single();

    if (funeralHomeError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: funeralHomeError.message }),
      };
    }

    const { error: relationError } = await supabase
      .from("funeral_home_users")
      .insert({
        user_id: user.id,
        funeral_home_id: funeralHome.id,
        role: "funeral_home",
      });

    if (relationError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: relationError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: "Cuenta creada correctamente",
      }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message ?? "Unknown error" }),
    };
  }
};