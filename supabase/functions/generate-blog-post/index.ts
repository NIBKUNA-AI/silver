
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Declare Deno for TypeScript if environment not configured
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Function Invoked");

        // 1. Init Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseKey) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
            throw new Error("Missing Server Configuration");
        }

        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        // 2. Fetch Context (Center Info)
        const { data: settings, error: settingsError } = await supabaseClient.from('admin_settings').select('*');
        if (settingsError) console.error("Settings Fetch Error:", settingsError);

        const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || '';

        const centerName = getSetting('center_name') || '아동발달센터';
        const programsRaw = getSetting('programs_list');

        let programsList = "언어치료, 놀이치료, 감각통합";
        try {
            if (programsRaw) {
                const parsed = JSON.parse(programsRaw);
                programsList = parsed.map((p: any) => p.title).join(', ');
            }
        } catch (e) { }

        // 3. Define Persona & Prompt
        const topics = [
            "말이 늦은 아이를 위한 가정 지도 꿀팁",
            "초등학교 입학 전 꼭 체크해야 할 사회성 발달",
            "떼쓰는 아이, 어떻게 훈육해야 할까요?",
            "놀이치료가 정말 효과가 있을까요?",
            "집에서 아이와 함께하는 감각통합 놀이",
            "우리아이 자존감 높여주는 대화법",
            "스마트폰만 보는 우리 아이, 괜찮을까요?",
            "형제 자매 싸움, 부모의 현명한 중재법"
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        const systemPrompt = `
You are the "Head Director" (원장님) of a warm, professional Child Development Center named "${centerName}".
Your tone is empathetic, encouraging, and professional yet accessible (friendly Korean).
You write blog posts to help parents who are worried about their children's development.

Style Guidelines:
- **Human-like**: Do NOT use robotic transitions like "First, Second, In conclusion". Use natural flow.
- **Storytelling**: Start with a relatable scenario/question (e.g., "요즘 이런 고민 하시는 어머님들 많으시죠?").
- **Warmth**: Use phrases like "~랍니다", "~하셨나요?", "저도 참 마음이 쓰이네요".
- **Structure**:
  1. **Hook**: Empathize with the parent's struggle.
  2. **Expert Insight**: Explain the "Why" simply.
  3. **Actionable Advice**: Give 2-3 specific, easy tips parents can do at HOME today.
  4. **Center Context**: Mention "${centerName}" softly (e.g., "우리 센터 놀이실에서도...").
  5. **Warm Closing**: Encourage them.

Format the output as a valid JSON object (no markdown code fences) with these fields:
- "title": A catchy, click-worthy Korean title.
- "slug": A URL-friendly English slug (kebab-case).
- "excerpt": A 2-sentence summary hook.
- "content": The full blog post content in HTML format. Use <h2> for section headers. Use <blockquote> for key insights. Use <b> for emphasis. Do NOT include <h1> or title in content.
- "seo_title": SEO optimized title (under 60 chars).
- "seo_description": SEO meta description (under 150 chars).
- "keywords": CSV string of 5-7 keywords.
- "image_query": A short English description to search for a stock photo (e.g., "mother playing with child blocks").
`;

        const userPrompt = `Write a blog post about: "${randomTopic}".
    The center offers these programs: ${programsList}.
    Target Audience: Parents of children aged 3-10.`;

        // 4. Call Google Gemini API (via SDK)
        const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_KEY');
        if (!GEMINI_API_KEY) {
            console.error("Missing GOOGLE_AI_KEY");
            throw new Error('Missing GOOGLE_AI_KEY environment variable');
        }

        console.log("Initializing Gemini SDK...");
        // Use standard import for Edge Function
        const { GoogleGenerativeAI } = await import("https://esm.sh/@google/generative-ai");

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Using gemini-flash-latest to avoid quota issues with 2.0 preview
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        console.log("Generating Content with gemini-flash-latest...");

        const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
        const response = result.response;
        const generatedText = response.text();

        if (!generatedText) {
            console.error("Gemini returned no content");
            throw new Error('No content generated from Gemini');
        }

        let generatedPost;
        try {
            generatedPost = JSON.parse(generatedText);
        } catch (e) {
            // Fallback cleanup if formatted partially
            const cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '');
            generatedPost = JSON.parse(cleanJson);
        }

        // 5. Insert into Database
        const safeCoverImage = "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1600&q=80";

        console.log("Inserting Blog Post:", generatedPost.title);

        const { data: post, error: dbError } = await supabaseClient.from('blog_posts').insert({
            title: generatedPost.title,
            slug: `${generatedPost.slug}-${Date.now()}`,
            excerpt: generatedPost.excerpt,
            content: generatedPost.content,
            cover_image_url: safeCoverImage,
            seo_title: generatedPost.seo_title,
            seo_description: generatedPost.seo_description,
            keywords: generatedPost.keywords.split(',').map((s: string) => s.trim()),
            is_published: true,
            published_at: new Date().toISOString(),
            view_count: 0
        }).select().single();

        if (dbError) {
            console.error("DB Insert Failed:", dbError);
            throw dbError;
        }

        console.log("Blog Post Created ID:", post.id);

        return new Response(JSON.stringify({ success: true, post }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error("Function Handler Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
