import { redirect } from 'next/navigation';

export default function RootPage() {
  // 自動跳轉到登入頁或儀表板
  redirect('/login'); 
}