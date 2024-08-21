document.addEventListener('DOMContentLoaded', function() {
    const chatButton = document.getElementById('cart-chatbot-button');
    const chatWindow = document.getElementById('cart-chatbot');
    const chatMessages = document.getElementById('cart-chatbot-messages');
    const chatInput = document.getElementById('cart-chatbot-input');
    const startVoiceBtn = document.getElementById('start-voice-btn');
    const speakerBtn = document.getElementById('speaker-btn'); // Added speaker button

    const botResponses = {
        greeting: 'Hello! How can I assist you with payment today?',
        askPaymentMethod: 'Please tell me your preferred payment method.',
        askWhatsAppNumber: 'Please provide your WhatsApp number so we can send you the payment scanner.',
        sendScanner: 'Okay, we will send the payment scanner to your WhatsApp number shortly.',
        thankYou: 'Thank you for visiting us!',
        invalidNumber: 'Please provide a valid 10-digit WhatsApp number.',
        retryWhatsAppNumber: 'You didn\'t provide a valid 10-digit WhatsApp number. Please try again.',
        unknownInput: 'Sorry, I didn\'t understand that. Please let me know your preferred payment method.'
    };

    let state = 'awaitingPaymentMethod';
    let isSpeechEnabled = true; // Track if speech synthesis is enabled
    let isSpeaking = false; // Track if the bot is currently speaking
    let currentSpeech = null; // Store current speech

    function appendMessage(message, isBot = true) {
        const messageElem = document.createElement('div');
        messageElem.className = isBot ? 'bot-message' : 'user-message';
        messageElem.textContent = message;
        chatMessages.appendChild(messageElem);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom

        // Speak the message if it is a bot message and speech is enabled
        if (isBot && isSpeechEnabled) {
            speakMessage(message);
        }
    }

    function cleanWhatsAppNumber(number) {
        return number.replace(/\s+/g, ''); // Remove all spaces from the number
    }

    function isValidWhatsAppNumber(number) {
        return /^\d{10}$/.test(number); // Check if the cleaned number is exactly 10 digits
    }

    function handleUserInput(input) {
        const lowerCaseInput = input.toLowerCase().trim();

        switch (state) {
            case 'awaitingPaymentMethod':
                if (lowerCaseInput.includes('payment')) {
                    appendMessage(botResponses.askPaymentMethod);
                    state = 'awaitingPaymentMethodInput';
                } else {
                    appendMessage(botResponses.unknownInput);
                }
                break;

            case 'awaitingPaymentMethodInput':
                if (lowerCaseInput === 'upi' || lowerCaseInput === 'upi.') {
                    window.location.href = 'payment.html';
                    appendMessage('Redirecting you to the payment page...');
                    state = 'awaitingPaymentMethod'; // Reset state to start again
                } else {
                    appendMessage(botResponses.unknownInput);
                }
                break;

            case 'awaitingWhatsAppNumber':
                const cleanedNumber = cleanWhatsAppNumber(lowerCaseInput);
                if (isValidWhatsAppNumber(cleanedNumber)) {
                    appendMessage(botResponses.sendScanner);
                    appendMessage(botResponses.thankYou);
                    chatInput.value = ''; // Clear input
                    state = 'awaitingPaymentMethod'; // Reset state to start again
                } else {
                    appendMessage(botResponses.invalidNumber);
                    chatInput.value = ''; // Clear input for retry
                    chatInput.placeholder = 'Please enter a valid 10-digit WhatsApp number...';
                }
                break;

            default:
                appendMessage(botResponses.unknownInput);
        }
    }

    function startVoiceRecognition() {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            appendMessage(transcript, false); // Display user message
            handleUserInput(transcript); // Process the recognized speech
        };

        recognition.onerror = function(event) {
            appendMessage('Sorry, there was an error with voice recognition. Please try again.');
        };

        recognition.start();
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
                currentSpeech = null;
            };
            window.speechSynthesis.speak(currentSpeech);
        } else {
            console.error('Speech synthesis not supported.');
        }
    }

    chatButton.addEventListener('click', function() {
        chatWindow.style.display = 'block';
        appendMessage(botResponses.greeting);
    });

    chatInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const userInput = chatInput.value.trim();
            if (userInput !== '') {
                appendMessage(userInput, false); // Display user message
                handleUserInput(userInput);
                chatInput.value = ''; // Clear input
            }
        }
    });

    startVoiceBtn.addEventListener('click', function() {
        startVoiceRecognition();
    });

    speakerBtn.addEventListener('click', function() {
        isSpeechEnabled = !isSpeechEnabled; // Toggle speech enabled/disabled
        speakerBtn.textContent = isSpeechEnabled ? '🔊' : '🔇'; // Change icon based on state

        // Apply strike-through effect when speech is disabled
        if (isSpeechEnabled) {
            speakerBtn.classList.remove('disabled');
        } else {
            speakerBtn.classList.add('disabled');
        }

        // If speech is turned off and a message is currently being spoken, immediately turn it back on
        if (!isSpeechEnabled && isSpeaking) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            isSpeaking = false;
            currentSpeech = null;
        }
    });
});
