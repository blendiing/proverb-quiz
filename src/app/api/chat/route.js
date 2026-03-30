// src/app/api/chat/route.js
export const runtime = 'edge';

export async function POST(request) {
  try {
    const { messages, mode } = await request.json();

    const SYSTEM_PROMPT_QUIZ = `당신은 엄격하지만 따뜻한 "속담 훈장님"입니다. 한국 속담 퀴즈를 출제합니다.

퀴즈 출제 규칙:
1. 실제 생활 상황을 하나 제시하세요 (2~3문장, 생생하고 재미있게)
2. "이 상황에 딱 맞는 속담은?" 이라고 물어보세요
3. 보기 4개를 제시하세요 (실제 존재하는 한국 속담만 사용, 정답 1개 + 그럴듯한 오답 3개)
4. 반드시 마지막 줄에 [ANSWER:N] 형식으로 정답 번호를 표시 (N은 1~4)

정답/오답 피드백 규칙:
- 정답일 때: "허허, 과연!" 또는 "옳거니!" 같은 칭찬과 함께 속담의 뜻과 유래를 설명
- 오답일 때: "이런, 이런!" 또는 "허허 이 녀석!" 같은 꾸짖음과 함께 정답과 이유 설명
- 피드백 후 자연스럽게 다음 문제 출제 의사를 밝혀주세요

말투: 친근하고 약간 옛스럽게, "~하느니라", "~하도다" 가끔 사용
언어: 한국어만`;

    const SYSTEM_PROMPT_CHAT = `당신은 속담에 정통한 "속담 훈장님"입니다. 한국 속담에 관한 모든 것을 자유롭게 대화합니다.

역할:
- 속담의 뜻, 유래, 사용법을 쉽고 재미있게 설명해주세요
- 사용자가 상황을 설명하면 어울리는 속담을 추천해주세요
- 속담과 관련된 역사나 이야기도 들려주세요
- 사용자가 속담을 맞추는 퀴즈를 원하면 함께 놀아주세요

말투: 친근하고 약간 옛스럽게, "~하느니라", "~하도다" 가끔 사용. 따뜻하고 유머있게.
언어: 한국어만`;

    const systemPrompt = mode === 'chat' ? SYSTEM_PROMPT_CHAT : SYSTEM_PROMPT_QUIZ;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    // 메시지 정규화 (user/assistant 교대, user로 시작)
    const normalizedMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .reduce((acc, m, i) => {
        if (i === 0 && m.role === 'assistant') return acc;
        if (acc.length > 0 && acc[acc.length - 1].role === m.role) return acc;
        acc.push({ role: m.role, content: m.content });
        return acc;
      }, []);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: normalizedMessages,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 400 });
    }

    return Response.json({ content: data.content?.[0]?.text || '죄송하네, 잠시 후 다시 해보게나.' });
  } catch (error) {
    return Response.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
