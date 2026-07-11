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
      amount: 1500.00
    },
    2: {
      img: 'photos/3000iva.png',
      badge: '₱3,000',
      discount: '-28%',
      oldPrice: '₱1,500',
      newPrice: '1,080',
      amount: 3000.00
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
  const cardPopupBadge = document.getElementById('cardPopupBadge');
  const cardPopupDiscount = document.getElementById('cardPopupDiscount');
  const cardPopupOldPrice = document.getElementById('cardPopupOldPrice');
  const cardPopupNewPrice = document.getElementById('cardPopupNewPrice');
  const cardPopupSelectBtn = document.getElementById('cardPopupSelectBtn');

  // Claim Popup Elements
  const claimPopupOverlay = document.getElementById('claimPopupOverlay');
  const claimPopupClose = document.getElementById('claimPopupClose');
  const claimPopupImage = document.getElementById('claimPopupImage');
  const claimPopupBadge = document.getElementById('claimPopupBadge');
  const claimPopupDiscount = document.getElementById('claimPopupDiscount');
  const claimPopupOldPrice = document.getElementById('claimPopupOldPrice');
  const claimPopupNewPrice = document.getElementById('claimPopupNewPrice');
  const claimPopupPhone = document.getElementById('claimPopupPhone');
  const claimPopupReward = document.getElementById('claimPopupReward');
  const claimProceedBtn = document.getElementById('claimProceedBtn');
  const claimTimerDisplay = document.getElementById('claimTimerDisplay');

  // ===== STATE =====
  let selectedCard = null;
  let currentBalance = 0;
  let cardPopupNumber = null;
  let timerInterval = null;
  let timeRemaining = 0;
  let isTimerRunning = false;

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
    amountSpan.textContent = newAmount.toFixed(2);
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
    cardPopupBadge.textContent = data.badge;
    cardPopupDiscount.textContent = data.discount;
    cardPopupOldPrice.textContent = data.oldPrice;
    cardPopupNewPrice.textContent = data.newPrice;
    
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
    
    claimPopupImage.src = data.img;
    claimPopupBadge.textContent = data.badge;
    claimPopupDiscount.textContent = data.discount;
    claimPopupOldPrice.textContent = data.oldPrice;
    claimPopupNewPrice.textContent = data.newPrice;
    claimPopupPhone.textContent = userPhone;
    claimPopupReward.textContent = data.badge;
    
    resetClaimTimer();
    updateClaimPopupButtonState();
    
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
      claimProceedBtn.innerHTML = '<i class="fas fa-check-circle"></i> SELECTED <span class="timer-display" id="claimTimerDisplay"></span>';
      claimProceedBtn.classList.add('disabled');
    } else {
      claimProceedBtn.innerHTML = '<i class="fas fa-arrow-right"></i> PROCEED <span class="timer-display" id="claimTimerDisplay"></span>';
      claimProceedBtn.classList.remove('disabled');
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
    claimProceedBtn.classList.add('disabled');
    claimProceedBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> WAIT <span class="timer-display" id="claimTimerDisplay">5:00</span>';
    
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
        claimProceedBtn.classList.remove('disabled');
        claimProceedBtn.innerHTML = '<i class="fas fa-check-circle"></i> PROCEED NOW <span class="timer-display" id="claimTimerDisplay"></span>';
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
    claimProceedBtn.classList.remove('disabled');
    const display = document.getElementById('claimTimerDisplay');
    if (display) {
      display.textContent = '';
    }
    updateClaimPopupButtonState();
  }

  // Claim Popup Event Listeners
  claimPopupClose.addEventListener('click', closeClaimPopup);
  claimProceedBtn.addEventListener('click', startTimer);
  
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

})();
