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
        const { topic, keyword, center_name, region } = requestData;
        const subject = topic || keyword || '아동 발달';

        // API 키 확인
        const apiKey = Deno.env.get('GOOGLE_AI_KEY');
        if (!apiKey) throw new Error('API Key not set');

        console.log(`[Start] Generating blog post for subject: ${subject}`);

        // 프롬프트 준비
        const prompt = `
      당신은 아동 심리 발달 전문가입니다. 다음 주제로 블로그 포스팅을 작성해 주세요.
      주제: ${subject}
      센터 이름: ${center_name || '자라다 아동발달센터'}
      지역: ${region || '지역 정보 없음'}
      
      조건:
      - 독자는 어린 자녀를 둔 부모님입니다. 따뜻하고 전문적인 어조를 사용하세요.
      - 서론, 본론(3가지 포인트), 결론, 그리고 센터 방문 유도 문구로 구성하세요.
      - HTML 태그 없이 순수 텍스트로 작성하세요.
    `;

        // 🚀 [Smart Retry Logic]
        // 1. 기본 모델 시도
        // 2. 404/400 발생 시 -> 모델 리스트 조회 -> 사용 가능한 모델로 재시도
        let generatedText = "";
        let usedModel = "";

        // Generation Helper Function
        const attemptGeneration = async (modelName: string) => {
            // "models/" 접두사 처리
            const cleanModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

            // v1beta 사용
            const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${apiKey}`;

            console.log(`[Attempt] Trying with model: ${cleanModelName}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Throw custom error object
                throw { status: response.status, data: errorData, model: cleanModelName };
            }

            return await response.json();
        };

        try {
            // --- 1차 시도: gemini-1.5-flash (Standard) ---
            try {
                const data = await attemptGeneration("gemini-1.5-flash");
                generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                usedModel = "gemini-1.5-flash";
            } catch (firstError: any) {
                console.warn(`[Fail] First attempt failed (${firstError.status}). Checking alternatives...`);

                // 404 (Not Found) or 400 (Bad Request) -> Auto Discovery
                if (firstError.status === 404 || firstError.status === 400) {

                    // --- 모델 목록 조회 ---
                    console.log("[Discovery] Listing available models...");
                    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                    const listResp = await fetch(listUrl);

                    if (!listResp.ok) throw new Error("Failed to list models for fallback");

                    const listData = await listResp.json();
                    const availableModels = listData.models || [];

                    // 'generateContent' 지원하는 모델 필터링
                    const candidates = availableModels.filter((m: any) =>
                        m.supportedGenerationMethods?.includes("generateContent")
                    );

                    if (candidates.length === 0) throw new Error("No text generation models found for this API Key.");

                    console.log("[Discovery] Candidates:", candidates.map((m: any) => m.name));

                    // 최적 모델 선정 (flash -> pro -> anything)
                    let fallbackModel = candidates.find((m: any) => m.name.includes("gemini-1.5-flash")) ||
                        candidates.find((m: any) => m.name.includes("gemini-1.5-pro")) ||
                        candidates.find((m: any) => m.name.includes("gemini-pro")) ||
                        candidates[0];

                    console.log(`[Retry] Retrying with discovered model: ${fallbackModel.name}`);

                    // --- 2차 시도: Discovered Model ---
                    const data = await attemptGeneration(fallbackModel.name);
                    generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    usedModel = fallbackModel.name;

                } else {
                    throw firstError; // 500 등 다른 에러는 재시도 안함
                }
            }

        } catch (finalError: any) {
            console.error('[Error] All attempts failed:', finalError);
            const errorMessage = finalError.data?.error?.message || finalError.message || "Unknown GenAI Error";

            return new Response(
                JSON.stringify({
                    error: errorMessage,
                    details: "Automatic model discovery failed.",
                    lastStatus: finalError.status
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!generatedText) {
            return new Response(
                JSON.stringify({ error: "Generated text is empty", usedModel }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ post: generatedText, usedModel }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Function Systematic Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
