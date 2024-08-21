document.addEventListener('DOMContentLoaded', () => {
    loadDressData();
    document.getElementById('cart-chatbot-button').addEventListener('click', toggleChat);
    document.getElementById('cart-chatbot-header').addEventListener('click', toggleChat);
    document.getElementById('cart-chatbot-input').addEventListener('keypress', handleKeyPress);
    document.getElementById('start-voice-btn').addEventListener('click', toggleVoiceRecognition);
    document.getElementById('toggle-speech-btn').addEventListener('click', toggleSpeechOutput);
});

let dressData = [];
let awaitingPaymentMethod = false;
let awaitingWhatsAppNumber = false;
let isVoiceRecognitionActive = false;
let isSpeechOutputEnabled = true;
let lastSpokenMessage = '';

function loadDressData() {
    const data = localStorage.getItem('products');
    if (data) {
        dressData = JSON.parse(data);
    } else {
        console.error('No dress data found in local storage.');
    }
}

function toggleChat() {
    const chatbot = document.getElementById('cart-chatbot');
    chatbot.style.display = chatbot.style.display === 'none' ? 'flex' : 'none';
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage(message = null) {
    const input = document.getElementById('cart-chatbot-input');
    const msg = message || input.value;
    if (msg.trim() === '') return;

    console.log(`Received message: "${msg}"`); // Debugging

    appendMessage('User', msg);
    if (!message) input.value = '';

    if (awaitingPaymentMethod) {
        handlePaymentMethod(msg);
    } else if (awaitingWhatsAppNumber) {
        handleWhatsAppNumber(msg);
    } else {
        handleCustomerMessage(msg);
    }
}

function appendMessage(sender, message) {
    const messageContainer = document.getElementById('cart-chatbot-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add(`${sender.toLowerCase()}-message`);
    messageElement.textContent = `${sender}: ${message}`;
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    // Speak the message if speech output is enabled and it's a bot message
    if (sender === 'Bot' && isSpeechOutputEnabled && message !== lastSpokenMessage) {
        speakMessage(message);
        lastSpokenMessage = message; // Update the last spoken message
    }
}

function calculatePrice() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    return totalPrice.toFixed(2);
}

const variationsMap = {
    'dress one': 'Dress1',
    'dress one.': 'Dress1',
    'dress 1': 'Dress1',
    'dress 1.': 'Dress1',
    'Dress one': 'Dress1',
    'dress two': 'Dress2',
    'dress two.': 'Dress2',
    'dress too.':'Dress2',
    'dress 2': 'Dress2',
    'dress 2.': 'Dress2',
    'dress to': 'Dress2',
    'dress three': 'Dress3',
    'dress three.': 'Dress3',
    'dress 3': 'Dress3',
    'dress 3.': 'Dress3',
    'dress 3.': 'Dress3',
    'dress four': 'Dress4',
    'dress four.': 'Dress4',
    'dress 4': 'Dress4',
    'dress 4.': 'Dress4',
    'dress five': 'Dress5',
    'dress five.': 'Dress5',
    'dress 5': 'Dress5',
    'dress 5.': 'Dress5',
    'dress six': 'Dress6',
    'dress six.': 'Dress6',
    'dress 6': 'Dress6',
    'dress 6.': 'Dress6',
    'dress seven': 'Dress7',
    'dress seven.': 'Dress7',
    'dress 7': 'Dress7',
    'dress 7.': 'Dress7',
    'dress eight': 'Dress8',
    'dress eight.': 'Dress8',
    'dress 8': 'Dress8',
    'dress 8.': 'Dress8'
};

function mapVariation(name) {
    const mappedName = variationsMap[name.toLowerCase()] || name;
    console.log(`Mapping "${name}" to "${mappedName}"`); // Debugging
    return mappedName;
}

function handleCustomerMessage(message) {
    let response = 'Sorry, I did not understand that.';
    const messageLower = message.toLowerCase();

    if (messageLower.includes('hello') || messageLower.includes('hi')) {
        response = 'Hello! How can I assist you with our dresses today?';
    } else if (messageLower.includes('okay') || messageLower.includes('sure')) {
        response = 'Thank you for visiting! Have a great day!';
    } else if (messageLower.startsWith('add to cart ')) {
        handleAddToCart(messageLower);
        return;
    } else if (messageLower === 'add more'|| messageLower === 'add more.' ) {
        handleAddMore();
        return;
    } else if (messageLower === 'payment' || messageLower === 'payment.') {
        window.location.href = 'cart.html';
        handlePayment();
        return;
    } else {
        const dressNameQuery = messageLower.replace(/price of |rating of |description of /, '').trim();
        const mappedName = mapVariation(dressNameQuery);
        console.log(`Processed query for: "${dressNameQuery}" mapped to: "${mappedName}"`); // Debugging
        const dressMatch = dressData.find(dress => dress.name.toLowerCase() === mappedName.toLowerCase());

        if (dressMatch) {
            if (messageLower.includes('price')) {
                response = `The price of ${dressMatch.name} is $${dressMatch.price.toFixed(2)}.`;
            } else if (messageLower.includes('rating')) {
                response = `The rating of ${dressMatch.name} is ${dressMatch.rating}.`;
            } else if (messageLower.includes('description')) {
                response = `The description of ${dressMatch.name} is ${dressMatch.description}.`;
            } else {
                response = `Here is the information on ${dressMatch.name}: Price - $${dressMatch.price.toFixed(2)}, Rating - ${dressMatch.rating}, Description - ${dressMatch.description}.`;
            }
        }
    }

    appendMessage('Bot', response);
}

function handleAddMore() {
    awaitingPaymentMethod = false;
    awaitingWhatsAppNumber = false;
    appendMessage('Bot', 'You can add more items to your cart. Please type "add to cart" followed by the item name(s).');
}

function handlePayment() {
    awaitingPaymentMethod = true;
    //appendMessage('Bot', 'Please specify your preferred payment method (e.g., UPI).');
}

function handleAddToCart(messageLower) {
    const itemsString = messageLower.replace('add to cart ', '').trim();
    const items = itemsString.split(',').map(item => item.trim().toLowerCase());

    const mappedItems = items.map(item => mapVariation(item));
    console.log('Mapped items:', mappedItems);

    const notFoundItems = [];

    mappedItems.forEach(item => {
        const dressMatch = dressData.find(dress => dress.name.toLowerCase() === item.toLowerCase());
        if (dressMatch) {
            addToCart(dressMatch);
        } else {
            notFoundItems.push(item);
        }
    });

    let response = 'The following items have been added to your cart: ';
    response += mappedItems.filter(item => !notFoundItems.includes(item)).join(', ');

    if (notFoundItems.length > 0) {
        response += `. The following items were not found: ${notFoundItems.join(', ')}.`;
    }

    appendMessage('Bot', response);
    let price = calculatePrice();
    appendMessage('Bot', `The total price of your cart is $${price}`);
    appendMessage('Bot', 'Would you like to add more items to your cart or proceed to payment? Please type "add more" to add more items or "payment" to proceed to payment.');
}

function handlePaymentMethod(message) {
    const messageLower = message.toLowerCase();
    if (messageLower.includes('upi')) {
        appendMessage('Bot', 'Please provide your WhatsApp number to receive the UPI scanner:');
        awaitingWhatsAppNumber = true;
    } else {
        appendMessage('Bot', 'Other payment methods are not supported yet. Please choose UPI:');
    }
    awaitingPaymentMethod = false;
}

function handleWhatsAppNumber(message) {
    const whatsappNumber = message.trim();
    appendMessage('Bot', `Thank you! We will send the UPI scanner to this WhatsApp number: ${whatsappNumber}`);
    sendUPIScanner(whatsappNumber);
    appendMessage('Bot', 'Thank you for your purchase! If you have any other questions, feel free to ask.');
    awaitingWhatsAppNumber = false;
}

function sendUPIScanner(whatsappNumber) {
    console.log(`Sending UPI scanner to WhatsApp number: ${whatsappNumber}`);
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProductIndex = cart.findIndex(item => item.name === product.name);

    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += 1;
    } else {
        product.quantity = 1;
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} has been added to the cart!`);
}

// Voice Recognition and Synthesis
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false;
recognition.interimResults = false;

recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript.toLowerCase();
    console.log('Voice input received:', speechResult);
    sendMessage(speechResult);
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
};

function toggleVoiceRecognition() {
    if (isVoiceRecognitionActive) {
        recognition.stop();
        document.getElementById('start-voice-btn').textContent = '🎤 Start';
    } else {
        recognition.start();
        document.getElementById('start-voice-btn').textContent = '🎤 Stop';
    }
    isVoiceRecognitionActive = !isVoiceRecognitionActive;
}

function speakMessage(message) {
    if (isSpeechOutputEnabled) {
        const utterance = new SpeechSynthesisUtterance(message);
        speechSynthesis.speak(utterance);
    }
}

function toggleSpeechOutput() {
    isSpeechOutputEnabled = !isSpeechOutputEnabled;
    const button = document.getElementById('toggle-speech-btn');
    button.textContent = isSpeechOutputEnabled ? '🔊' : '🔇'; // Toggle between sound on and off
}
