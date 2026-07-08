// ============================================
// FreeShoppingPH - Central Configuration
// ============================================

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyDIPBhgIXb6oJiq2G6bVebelLrCBuPeCNE",
  authDomain: "freeshoppingph-3bade.firebaseapp.com",
  databaseURL: "https://freeshoppingph-3bade-default-rtdb.firebaseio.com",
  projectId: "freeshoppingph-3bade",
  storageBucket: "freeshoppingph-3bade.firebasestorage.app",
  messagingSenderId: "858532604838",
  appId: "1:858532604838:web:59a6a0f31d63c2cdda7d67",
  measurementId: "G-T5GJ4MDLLB"
};

// ===== TELEGRAM CONFIGURATION =====
const telegramConfig = {
  botToken: "8639737111:AAGvCqiHzkiJvVqH6YPocRIVMoiXZlK4ZWg",
  chatId: "7298607329"
};

// ===== TELEGRAM HELPER FUNCTION =====
function sendTelegramNotification(message) {
  const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;
  const params = {
    chat_id: telegramConfig.chatId,
    text: message,
    parse_mode: 'HTML'
  };
  
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  fetch(`${url}?${queryString}`)
    .then(response => response.json())
    .then(data => {
      if (!data.ok) {
        console.error('Telegram error:', data.description);
      }
    })
    .catch(error => {
      console.error('Failed to send Telegram notification:', error);
    });
}

// ===== EXPORT FOR USE IN OTHER FILES =====
// For browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, telegramConfig, sendTelegramNotification };
}
