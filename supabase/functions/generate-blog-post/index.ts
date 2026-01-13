// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno for TypeScript environment
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // 1. CORS 처리
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const requestData = await req.json().catch(() => ({}));
        const { topic, keyword, center_name, region, openai_api_key } = requestData;

        // OpenAI Key & Google Key (Env or Request)
        const openAIKey = openai_api_key;
        const googleApiKey = Deno.env.get('GOOGLE_API_KEY') || requestData.google_api_key;

        const subject = topic || keyword || '아동 발달';
        console.log(`[Start] Generating blog post for subject: ${subject}`);

        const systemPrompt = `당신은 ${region || '지역'}에서 20년 이상 아동 발달 센터를 운영해온 베테랑 원장님입니다. 걱정하는 부모님을 안심시키고, 신뢰감 있는 조언을 주는 따뜻한 톤앤매너로 블로그 글을 작성해주세요.`;
        const userPrompt = `
            [글 작성 정보]
            - 주제: ${subject}
            - 키워드: ${keyword || subject}
            - 타겟 독자: ${region || '지역'} 센터를 찾고 있는 30-40대 부모님
            - 센터 이름: ${center_name || '자라다 아동발달센터'}
            - 지역: ${region || '지역'}

            [필수 준수 사항]
            1. **제목 포맷**: 반드시 "${region || '지역'} ${keyword || subject}"를 포함한 매력적인 제목으로 시작.
            2. **의료법 준수**: '완치', '100% 개선', '무조건' 표현 절대 금지. "도움이 될 수 있습니다" 등 완곡한 표현 사용.
            3. **형식**: Markdown (H2, H3, Bold) 사용. 문단은 짧게.
            4. **구조**:
               - [공감]: 부모님 걱정에 공감
               - [정보]: 전문적 설명 및 해결 방안 (3가지)
               - [안심]: 센터 철학 및 희망적 메시지
               - [하단바]: 센터 정보 및 문의처 포함
        `;

        let generatedText = '';
        let usedModel = '';

        // 1️⃣ Try OpenAI First (if key exists)
        let openAIError = null;
        if (openAIKey) {
            try {
                console.log("Attempting OpenAI...");
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openAIKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.7,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    generatedText = data.choices?.[0]?.message?.content;
                    usedModel = 'gpt-4o-mini';
                } else {
                    const errData = await response.json().catch(() => ({}));
                    console.error("OpenAI Error:", response.status, errData);
                    // If 429, we will try Gemini
                    if (response.status === 429) {
                        openAIError = "OpenAI Limit Exceeded";
                    } else {
                        throw new Error(`OpenAI Error: ${errData.error?.message || response.status}`);
                    }
                }
            } catch (e) {
                console.error("OpenAI Exception:", e);
                openAIError = e.message;
            }
        } else {
            openAIError = "No OpenAI Key provided";
        }

        // 2️⃣ Fallback to Gemini (if OpenAI failed or missing, and Gemini Key exists)
        if ((!generatedText || openAIError) && googleApiKey) {
            console.log("Attempting Gemini fallback...");
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`;
                const geminiResponse = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                        }]
                    })
                });

                if (geminiResponse.ok) {
                    const data = await geminiResponse.json();
                    generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    usedModel = 'gemini-pro';
                    console.log("Gemini Success!");
                } else {
                    const errData = await geminiResponse.json().catch(() => ({}));
                    console.error("Gemini Error:", errData);

                    if (geminiResponse.status === 429) {
                        throw new Error(`Google Gemini 429: Resource Exhausted (Free Tier Limit)`);
                    }

                    throw new Error(`Gemini Error: ${JSON.stringify(errData)}`);
                }
            } catch (e) {
                console.error("Gemini Exception:", e);
                // If both failed, throw error
                throw new Error(`AI Generation Failed. OpenAI: ${openAIError}, Gemini: ${e.message}`);
            }
        }

        // If still no text
        if (!generatedText) {
            const errorType = openAIError?.includes("insufficient_quota") ? "BILLING_LIMIT" : "RATE_LIMIT";

            // Provide specific advice based on error
            if (openAIError && (openAIError.includes("Limit Exceeded") || openAIError.includes("429") || openAIError.includes("insufficient_quota"))) {
                return new Response(
                    JSON.stringify({
                        error: "AI 서비스 이용량이 많아 일시적으로 제한되었습니다. (Server Quota)",
                        code: errorType,
                        details: openAIError
                    }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            throw new Error(`Generation failed. OpenAI Status: ${openAIError}`);
        }

        return new Response(
            JSON.stringify({ post: generatedText, usedModel }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Function Error:', error);

        // Handle Gemini 429 explicitly
        if (error.message.includes('Google Gemini 429') || error.message.includes('Resource Exhausted')) {
            return new Response(
                JSON.stringify({
                    error: "Google AI 사용 한도 초과(429). (무료 티어 제한)",
                    code: "LIMIT_EXCEEDED",
                    details: error.message
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
})
