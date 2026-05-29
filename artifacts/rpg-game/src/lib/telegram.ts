export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function getTelegramUser(): { telegram_id: string; username: string } {
  // @ts-ignore
  const tg = window.Telegram?.WebApp;

  if (tg?.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user as TelegramUser;
    const displayName =
      user.username
        ? `@${user.username}`
        : [user.first_name, user.last_name].filter(Boolean).join(' ') || `User${user.id}`;
    return {
      telegram_id: user.id.toString(),
      username: displayName,
    };
  }

  // Browser testing fallback — stable per device, never random
  let storedId = localStorage.getItem('tg_test_id');
  let storedName = localStorage.getItem('tg_test_name');

  if (!storedId) {
    storedId = `test_${Date.now()}`;
    storedName = 'بطل_اختبار';
    localStorage.setItem('tg_test_id', storedId);
    localStorage.setItem('tg_test_name', storedName!);
  }

  return { telegram_id: storedId, username: storedName || 'بطل_اختبار' };
}

export function initTelegramApp() {
  // @ts-ignore
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor('#1a0a2e');
      tg.setBackgroundColor('#1a0a2e');
    } catch (_) {
      // ignore
    }
  }
}
