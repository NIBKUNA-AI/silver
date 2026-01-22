// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
    console.log(`🚀 Function 'invite-user' invoked. Method: ${req.method}`);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // ✨ Admin Client (Service Role - Bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { email, name, role, ...details } = await req.json();

        if (!email) throw new Error("Email is required");

        console.log(`📧 Inviting user: ${email} as ${role}`);

        // 1. Send Invitation Email
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name, role, full_name: name },
            redirectTo: 'https://zaradacenter.co.kr/auth/update-password',
        });

        if (inviteError) {
            console.error("Invite Error:", inviteError.message);
            if (!inviteError.message.includes("already registered")) {
                throw inviteError;
            }
        }

        // 2. Resolve User ID
        let finalUserId = authData?.user?.id;
        if (!finalUserId) {
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const match = existingUser?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            if (match) finalUserId = match.id;
        }

        if (!finalUserId) throw new Error("Failed to resolve User ID");

        console.log(`👤 User ID resolved: ${finalUserId}`);

        // 3. Sync to 'therapists' table
        const { error: therapistError } = await supabaseAdmin
            .from("therapists")
            .upsert({
                email,
                name,
                system_role: role || 'therapist',
                system_status: 'active',
                ...details
            }, { onConflict: 'email' });

        if (therapistError) throw therapistError;

        // 4. Sync to 'user_profiles' table
        const { error: profileError } = await supabaseAdmin
            .from("user_profiles")
            .upsert({
                id: finalUserId,
                email,
                name,
                role: role || 'therapist',
                status: 'active',
                center_id: details.center_id
            }, { onConflict: 'id' });

        if (profileError) throw profileError;

        console.log(`✅ Invitation successful for ${email}`);

        return new Response(
            JSON.stringify({ message: "User invited successfully", userId: finalUserId }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("❌ Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
