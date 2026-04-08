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

const address = body?.address?.trim() || null;
const city = body?.city?.trim() || null;
const postal_code = body?.postal_code?.trim() || null;
const phone = body?.phone?.trim() || null;
const contact_email = body?.contact_email?.trim().toLowerCase() || null;
const country = body?.country?.trim() || null;

    if (!name || !email || !password || !address || !city || !postal_code || !phone || !contact_email || !country) {
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
console.log("Usuario auth creado:", authData?.user?.id, email);
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
  address,
  city,
  postal_code,
  phone,
  contact_email,
  country,
  owner_user_id: user.id,
  subscription_status: "trial",
  trial_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  subscription_plan: null,
  subscription_until: null,
})
      .select("id")
      .single();
console.log("Resultado insert funeral_homes:", {
  funeralHome,
  funeralHomeError,
});
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
console.log("Resultado insert funeral_home_users:", {
  relationError,
  userId: user.id,
  funeralHomeId: funeralHome?.id,
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