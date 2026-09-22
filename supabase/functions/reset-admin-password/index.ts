import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "admin@ayurclinic.com";

Deno.serve(async (req) => {
  try {
    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const admin = listData.users.find((u) => u.email === ADMIN_EMAIL);
    if (!admin) {
      return new Response(JSON.stringify({ error: "Admin user not found" }), { status: 404 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(admin.id, {
      password: newPassword,
    });
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
