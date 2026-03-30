'use client';

import { useState, useEffect, useRef } from 'react';

const TEACHER_IMG = '/teacher.jpg';
const SCOLDED_IMG_DATA = '/scolded.jpg';

// 검증된 한국 속담 182개


function parseQuiz(text) {
  const answerMatch = text.match(/\[ANSWER:(\d)\]/);
  const answer = answerMatch ? parseInt(answerMatch[1]) : null;
  const clean = text.replace(/\[ANSWER:\d\]/g, '').trim();
  const options = [];
  const optionRegex = /(?:([①②③④])|(\d)[\.번\)])\s*(.+)/g;
  const circleMap = { '①': 1, '②': 2, '③': 3, '④': 4 };
  let m;
  while ((m = optionRegex.exec(clean)) !== null) {
    const num = m[1] ? circleMap[m[1]] : parseInt(m[2]);
    const txt = m[3].trim();
    if (txt) options.push({ num, text: txt });
  }
  return { text: clean, options, answer };
}

function ScoldedOverlay({ visible, onDone }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 2800);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          background: '#8b1a1a', color: '#fff',
          padding: '10px 28px', borderRadius: 999,
          fontSize: 18, fontWeight: 700, letterSpacing: '0.05em',
          animation: 'shake 0.5s ease',
          boxShadow: '0 0 30px rgba(255,50,50,0.5)',
        }}>허허 이런! 틀렸도다! 😤</div>
        <img
          src={SCOLDED_IMG_DATA}
          alt="혼나는 학우"
          style={{
            width: 300, borderRadius: 16,
            border: '4px solid #8b1a1a',
            boxShadow: '0 0 50px rgba(255,50,50,0.35)',
            animation: 'shake 0.5s ease, popIn 0.3s ease',
          }}
        />
        <div style={{ color: '#ffcccc', fontSize: 12, opacity: 0.7 }}>잠시 후 사라집니다...</div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '14px 18px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#c8833b',
          animation: 'bounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

export default function ProverbQuiz() {
  const [mode, setMode] = useState('quiz');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '허허, 어서 오시게나! \n\n나는 속담 훈장님이라네. 오늘은 자네의 속담 실력을 한번 시험해보겠노라!\n\n준비가 되었으면 아래 버튼을 눌러보게나~',
    parsed: null,
  }]);
  const [proverbs, setProverbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScolded, setShowScolded] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/proverbs.json')
      .then(r => r.json())
      .then(data => setProverbs(data))
      .catch(() => console.error('속담 데이터를 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const callAPI = async (msgs, currentMode) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs, mode: currentMode }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.content;
  };

  const startQuiz = async () => {
    setLoading(true);
    setQuizActive(true);
    setAnswered(false);
    setSelectedOption(null);
    // 목록에서 랜덤으로 속담 1개 선택
    const p = proverbs[Math.floor(Math.random() * proverbs.length)];
    if (!p) return;
    const { proverb, meaning, situation, wrong } = p;
    const [wrong1, wrong2, wrong3] = wrong;
    const prompt = `다음 속담으로 퀴즈를 출제해주세요.\n\n속담: "${proverb}"\n뜻: ${meaning}\n상황 예시: ${situation}\n오답 보기: ${wrong1}, ${wrong2}, ${wrong3}\n\n위 정보를 활용해 훈장님 말투로 상황을 생생하게 묘사하고, 보기는 본문에 넣지 말고 아래 형식으로만 제시하세요:\n1) 속담\n2) 속담\n3) 속담\n4) 속담\n정답은 위 속담이며, 오답 3개는 위 오답 재료를 활용하되 순서를 섞어주세요. 반드시 마지막 줄에 [ANSWER:N] 형식으로 정답 번호를 표시하세요.`;
    const newMsgs = [...messages, { role: 'user', content: prompt }];
    try {
      const reply = await callAPI(newMsgs, 'quiz');
      const parsed = parseQuiz(reply);
      setMessages([...newMsgs, { role: 'assistant', content: reply, parsed }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: `허허, 소통이 어렵구만. (${e.message || '알 수 없는 오류'}) 다시 시도해보게나!`, parsed: null }]);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (optionNum) => {
    if (answered || loading) return;
    setSelectedOption(optionNum);
    setAnswered(true);
    const lastMsg = messages[messages.length - 1];
    const correct = lastMsg.parsed?.answer;
    if (correct && optionNum !== correct) setShowScolded(true);
    const newMsgs = [...messages, { role: 'user', content: `${optionNum}번을 선택했습니다.` }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const reply = await callAPI(newMsgs, 'quiz');
      const parsed = parseQuiz(reply);
      const isNewQuiz = parsed.options.length >= 4 && parsed.answer !== null;
      setMessages([...newMsgs, { role: 'assistant', content: reply, parsed: isNewQuiz ? parsed : null }]);
      setQuizActive(isNewQuiz);
      if (isNewQuiz) { setAnswered(false); setSelectedOption(null); }
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: `허허, 잠시 문제가 생겼구만! (${e.message || ''})`, parsed: null }]);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || loading) return;
    setChatInput('');
    const newMsgs = [...messages, { role: 'user', content: text, parsed: null }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const reply = await callAPI(newMsgs, 'chat');
      setMessages([...newMsgs, { role: 'assistant', content: reply, parsed: null }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: `허허, 소통이 어렵구만. (${e.message || ''})`, parsed: null }]);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setQuizActive(false);
    setAnswered(false);
    setSelectedOption(null);
    setChatInput('');
    const greeting = newMode === 'chat'
      ? '허허, 자유대화 모드로다! \n\n속담에 관해 무엇이든 물어보게나. 뜻이 궁금한 속담, 어떤 상황에 쓰이는지, 아니면 그냥 이야기도 좋으니라~'
      : '허허, 퀴즈 모드로 돌아왔구나! \n\n자네의 속담 실력을 다시 시험해볼 차례라네. 준비가 되었으면 버튼을 눌러보게나~';
    setMessages([{ role: 'assistant', content: greeting, parsed: null }]);
  };

  const showStartBtn = !quizActive && !loading;
  const showNextBtn = answered && !loading;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a0f00 0%, #2d1a00 50%, #150c00 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Pretendard', sans-serif",
      padding: 16,
    }}>
      {/* BG 한자 장식 */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '8%', right: '4%', fontSize: 100, opacity: 0.04, animation: 'float 7s ease-in-out infinite', color: '#c8833b' }}>竹</div>
        <div style={{ position: 'absolute', bottom: '10%', left: '3%', fontSize: 120, opacity: 0.04, animation: 'float 9s ease-in-out infinite reverse', color: '#c8833b' }}>學</div>
        <div style={{ position: 'absolute', top: '45%', right: '8%', fontSize: 70, opacity: 0.03, color: '#c8833b' }}>道</div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,90,43,0.06), transparent 65%)', pointerEvents: 'none' }} />
      </div>

      <ScoldedOverlay visible={showScolded} onDone={() => setShowScolded(false)} />

      <div style={{
        width: '100%', maxWidth: 680, height: '92vh', maxHeight: 860,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(16,8,0,0.92)',
        backdropFilter: 'blur(28px)',
        borderRadius: 24,
        border: '1px solid rgba(200,131,59,0.2)',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.02)',
        position: 'relative', zIndex: 1,
      }}>

        {/* 헤더 */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid rgba(200,131,59,0.12)',
          background: 'rgba(139,90,43,0.07)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '2px solid rgba(200,131,59,0.5)',
            boxShadow: '0 0 20px rgba(200,131,59,0.3)',
          }}>
            <img src={TEACHER_IMG} alt="훈장님" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} />
          </div>
          <div>
            <div style={{ color: '#f0e6d3', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em' }}>속담 훈장님</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 500 }}>훈장님이 계십니다</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {[['quiz', '📝 퀴즈'], ['chat', '💬 대화']].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
                border: '1px solid rgba(200,131,59,0.4)',
                background: mode === m ? 'rgba(200,131,59,0.3)' : 'transparent',
                color: mode === m ? '#f0e6d3' : 'rgba(200,131,59,0.5)',
                transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const parsed = msg.parsed;
            const isLastMsg = i === messages.length - 1;

            if (isUser) return (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, animation: 'slideIn 0.3s ease' }}>
                <div style={{
                  maxWidth: '65%', padding: '11px 16px',
                  background: 'linear-gradient(135deg, #5c3a1e, #7a4e2a)',
                  borderRadius: '18px 18px 4px 18px',
                  color: '#fff8eb', fontSize: 14.5, lineHeight: 1.7,
                  boxShadow: '0 4px 18px rgba(92,58,30,0.4)',
                }}>{msg.content}</div>
              </div>
            );

            const cleanText = parsed
              ? msg.content.replace(/\[ANSWER:\d\]/g, '').replace(/(\d)[\.번\)]\s*.+(\n|$)/g, '').trim()
              : msg.content;

            return (
              <div key={i} style={{ marginBottom: 16, animation: 'slideIn 0.35s ease' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden',
                    border: '1.5px solid rgba(200,131,59,0.4)',
                    boxShadow: '0 0 10px rgba(200,131,59,0.2)',
                  }}>
                    <img src={TEACHER_IMG} alt="훈장님" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} />
                  </div>
                  <div style={{
                    maxWidth: '80%', padding: '13px 16px',
                    background: 'rgba(255,248,235,0.05)',
                    border: '1px solid rgba(200,131,59,0.18)',
                    borderRadius: '4px 18px 18px 18px',
                    color: '#f0e6d3', fontSize: 14.5, lineHeight: 1.8,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {cleanText}
                  </div>
                </div>

                {isLastMsg && parsed?.options?.length > 0 && (
                  <div style={{ marginTop: 12, marginLeft: 46, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsed.options.map((opt) => {
                      let bg = 'rgba(200,131,59,0.06)';
                      let border = 'rgba(200,131,59,0.2)';
                      let color = '#e8d5b7';
                      if (answered) {
                        if (opt.num === parsed.answer) { bg = 'rgba(74,222,128,0.15)'; border = 'rgba(74,222,128,0.5)'; color = '#4ade80'; }
                        else if (opt.num === selectedOption) { bg = 'rgba(255,80,80,0.12)'; border = 'rgba(255,80,80,0.4)'; color = '#ff8080'; }
                      }
                      return (
                        <button key={opt.num} className="opt-btn"
                          disabled={answered}
                          onClick={() => submitAnswer(opt.num)}
                          style={{
                            background: bg, border: `1px solid ${border}`,
                            borderRadius: 12, padding: '10px 16px',
                            color, fontSize: 14, cursor: answered ? 'default' : 'pointer',
                            textAlign: 'left', fontFamily: "'Pretendard', sans-serif", lineHeight: 1.5,
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: answered && opt.num === parsed.answer ? 'rgba(74,222,128,0.3)' : 'rgba(200,131,59,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                            color: answered && opt.num === parsed.answer ? '#4ade80' : '#c8833b',
                          }}>{opt.num}</span>
                          {opt.text}
                          {answered && opt.num === parsed.answer && ' ✓'}
                          {answered && opt.num === selectedOption && opt.num !== parsed.answer && ' ✗'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16, animation: 'slideIn 0.3s ease' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                overflow: 'hidden',
                border: '1.5px solid rgba(200,131,59,0.4)',
              }}>
                <img src={TEACHER_IMG} alt="훈장님" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} />
              </div>
              <div style={{
                background: 'rgba(255,248,235,0.05)',
                border: '1px solid rgba(200,131,59,0.18)',
                borderRadius: '4px 18px 18px 18px',
              }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 하단 버튼 */}
        <div style={{
          padding: '14px 20px 20px',
          borderTop: '1px solid rgba(200,131,59,0.1)',
          background: 'rgba(139,90,43,0.04)',
        }}>
          {mode === 'quiz' && (showStartBtn || showNextBtn) && (
            <button onClick={startQuiz} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #8b5a2b, #c8833b)',
              border: 'none', borderRadius: 14,
              color: '#fff8eb', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Pretendard', sans-serif",
              boxShadow: '0 6px 24px rgba(200,131,59,0.4)',
              letterSpacing: '0.05em',
            }}>
              {answered ? '다음 문제 →' : '퀴즈 시작하기'}
            </button>
          )}

          {mode === 'chat' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="훈장님께 무엇이든 물어보게나..."
                disabled={loading}
                style={{
                  flex: 1, background: 'rgba(200,131,59,0.07)',
                  border: '1px solid rgba(200,131,59,0.3)',
                  borderRadius: 12, padding: '11px 14px',
                  color: '#f0e6d3', fontSize: 14, fontFamily: "'Pretendard', sans-serif",
                  outline: 'none',
                }}
              />
              <button onClick={sendChat} disabled={loading || !chatInput.trim()} style={{
                padding: '11px 16px', borderRadius: 12,
                background: chatInput.trim() && !loading ? 'linear-gradient(135deg, #8b5a2b, #c8833b)' : 'rgba(200,131,59,0.1)',
                border: 'none', color: '#fff8eb', fontSize: 18,
                cursor: chatInput.trim() && !loading ? 'pointer' : 'default',
                flexShrink: 0,
              }}>↑</button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', color: 'rgba(200,131,59,0.3)', fontSize: 12, padding: '6px 0' }}>
              훈장님께서 생각 중이시니라...
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(200,131,59,0.25)', fontSize: 11 }}>
            속담으로 지혜를 나누는 훈장님 · {mode === 'quiz' ? '틀리면 혼납니다 😤' : '무엇이든 물어보게나 '}
          </div>
        </div>
      </div>
    </div>
  );
}
