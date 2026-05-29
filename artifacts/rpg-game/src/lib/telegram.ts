export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function getTelegramUser(): { telegram_id: string; username: string } {
  // Check if Telegram WebApp is available
  // @ts-ignore
  const tg = window.Telegram?.WebApp;
  
  if (tg?.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user as TelegramUser;
    return {
      telegram_id: user.id.toString(),
      username: user.username || user.first_name || `User${user.id}`,
    };
  }

  // Fallback for browser testing
  // Check local storage for persistent test user
  const storedId = localStorage.getItem('test_telegram_id');
  const storedName = localStorage.getItem('test_username');
  
  if (storedId && storedName) {
    return { telegram_id: storedId, username: storedName };
  }

  // Generate new test user
  const randomId = Math.floor(Math.random() * 1000000).toString();
  const randomName = `Player_${randomId.substring(0, 4)}`;
  
  localStorage.setItem('test_telegram_id', randomId);
  localStorage.setItem('test_username', randomName);
  
  return { telegram_id: randomId, username: randomName };
}

export function initTelegramApp() {
  // @ts-ignore
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand(); // Request full height
    
    // Set theme colors if possible
    try {
      tg.setHeaderColor('#1a0a2e');
      tg.setBackgroundColor('#1a0a2e');
    } catch (e) {
      // Ignore
    }
  }
}
