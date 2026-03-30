import './globals.css';

export const metadata = {
  title: '속담 훈장님 - 한국 속담 퀴즈',
  description: '속담 훈장님과 함께 한국 속담을 배워보세요! 퀴즈와 자유대화를 통해 속담의 지혜를 익혀보세요.',
  keywords: '속담, 한국속담, 퀴즈, 훈장님',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
