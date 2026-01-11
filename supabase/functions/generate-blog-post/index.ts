import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. CORS 처리
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. 데이터 받기 (클라이언트가 topic 또는 keyword로 보낼 수 있음)
        const { topic, keyword, center_name, region } = await req.json()
        const subject = topic || keyword || '아동 발달'

        // API 키 확인
        const apiKey = Deno.env.get('GOOGLE_AI_KEY')
        if (!apiKey) throw new Error('API Key not set')

        console.log(`Generating blog post for subject: ${subject}, Model: gemini-pro (v1beta)`)

        // 3. 라이브러리 없이 직접 URL 호출 
        // ✨ v1beta + gemini-pro 조합 (가장 널리 쓰이는 표준 조합)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

        const prompt = `
      당신은 아동 심리 발달 전문가입니다. 다음 주제로 블로그 포스팅을 작성해 주세요.
      주제: ${subject}
      센터 이름: ${center_name || '자라다 아동발달센터'}
      지역: ${region || '지역 정보 없음'}
      
      조건:
      - 독자는 어린 자녀를 둔 부모님입니다. 따뜻하고 전문적인 어조를 사용하세요.
      - 서론, 본론(3가지 포인트), 결론, 그리고 센터 방문 유도 문구로 구성하세요.
      - HTML 태그 없이 순수 텍스트로 작성하세요.
    `

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        })

        const data = await response.json()

        // 4. 에러 응답 처리
        if (!response.ok) {
            console.error('Gemini API Error:', JSON.stringify(data))

            // ✨ [Self-Diagnosis] 404 에러 시 사용 가능한 모델 목록 조회 및 로그 출력
            // 이렇게 하면 어떤 모델명을 써야 할지 로그에서 바로 확인할 수 있음
            if (response.status === 404) {
                try {
                    console.log("Attempting to list available models for debugging...");
                    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                    const listResp = await fetch(listUrl);
                    const listData = await listResp.json();
                    if (listData.models) {
                        console.log("✅ Available Models for this API Key:", JSON.stringify(listData.models.map((m: any) => m.name)));
                    } else {
                        console.log("❌ Could not list models (no models found in response)", listData);
                    }
                } catch (listErr) {
                    console.error("❌ Failed to list models:", listErr);
                }
            }

            throw new Error(data.error?.message || `Gemini API failed with status ${response.status}`)
        }

        // 5. 결과 추출
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "글 생성에 실패했습니다."

        return new Response(
            JSON.stringify({ post: generatedText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
