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
    const funeralHomeId = body?.funeral_home_id;
    const subscriptionStatus = body?.subscription_status;

    if (!funeralHomeId || !subscriptionStatus) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing data" }),
      };
    }

    if (!["active", "inactive"].includes(subscriptionStatus)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid subscription status" }),
      };
    }

    const { error } = await supabase
      .from("funeral_homes")
      .update({ subscription_status: subscriptionStatus })
      .eq("id", funeralHomeId);

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
      body: JSON.stringify({ error: e?.message ?? "Unknown error" }),
    };
  }
};