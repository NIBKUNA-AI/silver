// @ts-nocheck
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
//
// ⚠️ IMPORTANT CONFIGURATION REQUIRED ⚠️
// You MUST disable "Enforce JWT Verification" for this function in the Supabase Dashboard.
// 1. Go to Supabase Dashboard > Edge Functions > invite-user
// 2. Click "Active" (or Settings icon)
// 3. Uncheck "Enforce JWT Verification" and Save.
// (We handle Auth manually in the code. If you don't do this, OPTIONS requests will fail with CORS errors)

import { createClient } from 'npm:@supabase/supabase-js@2.47.10'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    const logTag = `[INVITE-USER-${Math.random().toString(36).substring(7)}]`
    console.log(`\n--- 🚀 ${logTag} START ---`)
    console.log(`Method: ${req.method} | Time: ${new Date().toISOString()}`)

    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Environment Check
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('PRIVATE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error(`${logTag} ❌ Critical: Environment variables missing.`)
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Missing Secrets' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Auth Header Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 4. Validate User (Manual Auth)
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } },
        })

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error(`${logTag} ❌ Unauthorized: ${authError?.message}`)
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 5. Check Permissions (Super Admin or Local Admin)
        const SUPER_ADMINS = ['anukbin@gmail.com']
        const isSuperAdmin = SUPER_ADMINS.includes(user.email || '')

        // Admin Client for Privileged Actions
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        let targetCenterId = ''

        if (isSuperAdmin) {
            // Super Admin can pass center_id in body
        } else {
            // Normal Admin must be checked against DB
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('role, center_id')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return new Response(
                    JSON.stringify({ error: 'Forbidden: You must be an Admin.' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            targetCenterId = profile.center_id
        }

        // 6. Parse Body
        const { email, name, role, center_id, redirectTo, ...details } = await req.json()

        if (isSuperAdmin && center_id) targetCenterId = center_id

        if (!targetCenterId) {
            throw new Error("Target Center ID could not be determined.")
        }

        console.log(`${logTag} 📧 Inviting: ${email} -> Center: ${targetCenterId} (Role: ${role})`)

        // 7. Execute Invite
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                name,
                full_name: name,
                role,
                center_id: targetCenterId
            },
            redirectTo: redirectTo || `${req.headers.get('origin')}/auth/update-password`
        })

        let finalUserId = inviteData?.user?.id

        if (inviteError) {
            // If user already exists, we might need to find them
            if (inviteError.message.includes("already registered") || inviteError.status === 422) {
                console.log(`${logTag} ℹ️ User exists, Syncing tables only...`)
                const { data: existingProfile } = await supabaseAdmin.from('user_profiles').select('id').eq('email', email).maybeSingle()
                if (existingProfile) {
                    finalUserId = existingProfile.id
                } else {
                    // Try to find in Auth users list using listUsers (Last Resort)
                    const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
                    const foundUser = listData?.users.find(u => u.email === email)
                    if (foundUser) {
                        finalUserId = foundUser.id
                    } else {
                        throw new Error("User exists in Auth but not in DB. Manual intervention required.")
                    }
                }
            } else {
                throw inviteError
            }
        }

        if (!finalUserId) throw new Error("Failed to resolve User ID")

        // 8. Sync Tables
        // User Profile
        await supabaseAdmin.from('user_profiles').upsert({
            id: finalUserId,
            email,
            name,
            role: role || 'therapist',
            center_id: targetCenterId,
            status: 'active'
        })

        // Therapist Table
        if (role !== 'parent') {
            await supabaseAdmin.from('therapists').upsert({
                email,
                name,
                center_id: targetCenterId,
                system_role: role || 'therapist',
                system_status: 'active',
                ...details
            }, { onConflict: 'email' })
        }

        return new Response(
            JSON.stringify({ message: 'Invitation sent successfully', userId: finalUserId }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error(`${logTag} 🔴 Error:`, err)
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown Error' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
