document.addEventListener('DOMContentLoaded', () => {
    const chatbotButton = document.getElementById('admin-chatbot-buttonn');
    const chatbot = document.getElementById('admin-chatbot');
    const chatbotMessages = document.getElementById('admin-chatbot-messages');
    const chatbotInput = document.getElementById('admin-chatbot-input');
    const micButton = document.getElementById('admin-chatbot-voice-btn');
    const speakerButton = document.getElementById('admin-chatbot-speaker-btn');
    const backToOriginal = document.getElementById('back-to-original');

    if (chatbotButton && chatbot) {
        chatbotButton.addEventListener('click', () => {
            chatbot.style.display = chatbot.style.display === 'none' ? 'block' : 'none';
        });
    }

    let state = 0;
    let discount = 0;
    let isSpeechEnabled = true; // Track if speech synthesis is enabled
    let isSpeaking = false; // Track if the bot is currently speaking
    let currentSpeech = null; // Store current speech

    function toggleChatbot() {
        if (chatbot.style.display === 'none' || chatbot.style.display === '') {
            chatbot.style.display = 'flex';
            chatbotButton.textContent = 'Close Chatbot';
            chatbotInput.focus();
        } else {
            chatbot.style.display = 'none';
            chatbotButton.textContent = 'Admin Chat Bot';
        }
    }

    backToOriginal.addEventListener('click', backToOriginalPrices);

    chatbot.style.display = 'none';

    chatbotButton.addEventListener('click', toggleChatbot);

    function addMessage(text, sender = 'bot') {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = text;
        messageDiv.classList.add(sender === 'bot' ? 'bot-message' : 'admin-message');
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        if (sender === 'bot' && isSpeechEnabled) {
            speakMessage(text);
        }
    }

    function speakMessage(message) {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel(); // Stop any ongoing speech
            }
            currentSpeech = new SpeechSynthesisUtterance(message);
            currentSpeech.onstart = () => {
                isSpeaking = true;
            };
            currentSpeech.onend = () => {
                isSpeaking = false;
                if (currentSpeech) {
                    currentSpeech = null;
                }
            };
            window.speechSynthesis.speak(currentSpeech);
        } else {
            console.error('Speech synthesis not supported.');
        }
    }

    function handleAdminMessage(message) {
        switch (state) {
            case 0:
                addMessage('Hello Admin! I\'m here to help with applying discounts to specific products.');
                state = 1;
                break;
            case 1:
                addMessage('Please provide the discount percentage.');
                state = 2;
                break;
            case 2:
                const newDiscount = parseInt(message, 10);
                if (!isNaN(newDiscount) && newDiscount >= 0 && newDiscount <= 100) {
                    discount = newDiscount;
                    addMessage('Please provide the product IDs to apply the discount, separated by commas.');
                    state = 3;
                } else {
                    addMessage('Please provide a valid discount percentage.');
                }
                break;
            case 3:
                const productIds = message.split(',').map(id => id.trim()).filter(id => !isNaN(id)).map(id => parseInt(id));
                if (productIds.length > 0) {
                    applyDiscountToSelectedProducts(discount, productIds);
                    addMessage('Successfully added the discount to the specified products.');
                } else {
                    addMessage('Please provide valid product IDs.');
                }
                state = 4;
                break;
            case 4:
                addMessage('Would you like to apply another discount? Type "yes" or "no".');
                state = 5;
                break;
            case 5:
                if (message.toLowerCase() === 'yes') {
                    state = 1;
                } else {
                    addMessage('Thank you! Have a great day.');
                    state = 0;
                }
                break;
        }
    }

    function applyDiscountToSelectedProducts(discountValue, selectedProductIds) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        products.forEach((product, index) => {
            if (selectedProductIds.includes(product.id)) {
                if (!product.originalPrice) {
                    product.originalPrice = product.price;  // Save the original price if not already saved
                }
                product.discount = discountValue;
                // Recalculate price based on the discount
                product.price = product.originalPrice - (product.originalPrice * product.discount / 100);
            }
        });

        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('discount', discountValue);  // Save discount
        alert('Offers Created');
        updateProductList();
    }

    function backToOriginalPrices() {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        products.forEach((product) => {
            if (product.originalPrice) {
                product.discount = 0;
                product.price = product.originalPrice;  // Reset to original price
            }
        });
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts(products);
    }

    function updateProductList() {
        const productsToRender = JSON.parse(localStorage.getItem('products')) || [];
        const discount = localStorage.getItem('discount') || 0;
        renderProducts(productsToRender);
    }

    function startVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = function(event) {
                const result = event.results[0][0].transcript;
                addMessage(result, 'admin');
                handleAdminMessage(result);
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error', event);
            };

            recognition.onend = function() {
                console.log('Speech recognition ended');
            };

            recognition.start();
        } else {
            console.error('Speech recognition not supported.');
        }
    }

    micButton.addEventListener('click', startVoiceRecognition);

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatbotInput.value.trim();
            if (message) {
                addMessage(message, 'admin');
                handleAdminMessage(message);
                chatbotInput.value = '';
            }
        }
    });

    speakerButton.addEventListener('click', () => {
        isSpeechEnabled = !isSpeechEnabled;
        speakerButton.textContent = isSpeechEnabled ? '🔊' : '🔇';

        // Apply strike-through effect when speech is disabled
        if (isSpeechEnabled) {
            speakerButton.classList.remove('disabled');
        } else {
            speakerButton.classList.add('disabled');
        }

        // If speech is turned off and a message is currently being spoken, immediately turn it back on.
        if (!isSpeechEnabled && isSpeaking) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            isSpeechEnabled = true;
            speakerButton.textContent = '🔊'; // Update button icon to indicate enabled
            speakerButton.classList.remove('disabled'); // Remove strike-through
        }
    });
});
