window.addEventListener('DOMContentLoaded', () => {
    const outputDiv = document.getElementById('output');
    const voiceAssistantTrigger = document.getElementById('voiceAssistantTrigger');
    const microphoneErrorMessage = document.createElement('p');
    microphoneErrorMessage.textContent = 'Unable to access your microphone. Please check your browser settings and try again.';

    let recognition;
    let speechSynthesis;

    function startVoiceAssistant() {
        const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognitionConstructor) {
            recognition = new SpeechRecognitionConstructor();
            speechSynthesis = window.speechSynthesis;

            recognition.lang = 'en-US';
            recognition.continuous = true; // Enable continuous recognition
            recognition.interimResults = true; // Enable interim results

            recognition.onstart = () => {
                // Do not display "Listening..." here
            };

            recognition.onspeechstart = () => {
                outputDiv.textContent = 'Listening...';
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                processVoiceCommand(transcript);
            };

            recognition.onspeechend = () => {
                outputDiv.textContent = ''; // Clear the "Listening..." text
            };

            recognition.onerror = (event) => {
                if (event.error === 'no-speech') {
                    outputDiv.textContent = 'No speech detected. Please try again.';
                } else if (event.error === 'audio-capture') {
                    outputDiv.textContent = '';
                    outputDiv.appendChild(microphoneErrorMessage);
                    recognition.stop();
                } else {
                    outputDiv.textContent = `Error: ${event.error}`;
                }
            };

            recognition.start();
        } else {
            outputDiv.textContent = 'Your browser does not support the Web Speech API.';
        }
    }

    function processVoiceCommand(command) {
        const lowercaseCommand = command.toLowerCase();
        const commandMap = {
            'hi': greetUser,
            'hello': greetUser,
            'hey' : greetUser,
            'open cart': openCart,
            'cart': openCart,
            'card': openCart,
            'open card': openCart,
            'open cut': openCart,
            'car': openCart,
            'open car': openCart,
            'cut': openCart,
            'go home': goHome,
            'home': goHome,
            'return home': goHome,
            'go back home': goHome,
            'go back': goHome,
            'go to home': goHome,
            'go to home page': goHome,
            'show products': showProducts,
            'product': showProducts,
            'products': showProducts,
            'show about': showAbout,
            'about': showAbout,
            'contact us': contactUs,
            'help': showHelp,
            'what can you do' : showHelp,
            'what can you do for me' : showHelp,
            'confused' : showHelp,
            'show services' : showServices,
            'services' : showServices,
            'service' : showServices,
            'open manual login': manualLoginPage,
            'manual login': manualLoginPage,
            'manual login page': manualLoginPage,
            'open login bot': handleLogin,
            'login bot': handleLogin,
            'open login': handleLogin,
            'open login page': handleLogin,
            'login': handleLogin,
            'stop': byeUser,
            'stop listening': byeUser,
            'exit': byeUser,
            'bye' : byeUser,
            'nothing' : byeUser,
            'logout': logout,
            'log out' : logout
        };

        if (commandMap[lowercaseCommand]) {
            commandMap[lowercaseCommand]();
        } else {
            if (outputDiv.textContent.trim() === '') {
                outputDiv.textContent = `"${command}"`;
            }
        }
    }

    function handleLogin() {
        // Check if the user is already logged in
        const isLoggedIn = localStorage.getItem('isLogin') === 'true'; // or any other way you check login status
        const currentPage = window.location.pathname;
        const url = new URL(window.location.href);
        const pathname = url.pathname;
    
        // Check if the pathname is '/index.html'
        if (pathname === '/index.html') {
            initializeLoginBot(); 
        } else if (pathname.includes('welcome') || pathname.includes('admin')) {
                speakText('You are already logged in.');
        } else {
            initializeLoginBot(); 
        }
        stopListening();
    }
   
    function initializeLoginBot() {
        speakText('Opening Login Page');
        const loginChatbotButton = document.getElementById('google-chatbot-btn');
        if (loginChatbotButton) {
            loginChatbotButton.click();
        } else {
            outputDiv.textContent = 'Unable to find the login button element.';
        }
        stopListening();
    }

    function greetUser() {
        speakText('Hello! How can I assist you today?');
        stopListening();
    }

    function openCart() {
        speakText('Opening your cart.');
        window.location.href = 'cart.html';
        stopListening();
    }

    function goHome() {
        speakText('Going to the home page.');
        window.location.href = 'index.html';
        stopListening();
    }

    function showProducts() {
        speakText('Here are our products.');
        outputDiv.textContent = 'Here are our products:';
        // Scroll to the #Products element
        const productsElement = document.getElementById('Products');
        if (productsElement) {
            productsElement.scrollIntoView({ behavior: 'smooth' });
        } else {
            outputDiv.textContent = 'Unable to find the products section.';
        }stopListening();
    }

    function showAbout() {
        speakText('Here is information about our company.');
        outputDiv.textContent = 'Here is information about our company:';
        // Scroll to the #About element
        const aboutElement = document.getElementById('About');
        if (aboutElement) {
            aboutElement.scrollIntoView({ behavior: 'smooth' });
        } else {
            outputDiv.textContent = 'Unable to find the about section.';
        }stopListening();
    }

    function showServices() {
        speakText('Here are our services.');
        outputDiv.textContent = 'Here are our services:';
        // Scroll to the #Servises element
        const servicesElement = document.getElementById('Servises');
        if (servicesElement) {
            servicesElement.scrollIntoView({ behavior: 'smooth' });
        } else {
            outputDiv.textContent = 'Unable to find the services section.';
        }stopListening();
    }

    function manualLoginPage() {
        // Create a URL object from the current URL
        const url = new URL(window.location.href);
        const pathname = url.pathname;
    
        // Check if the pathname is '/index.html'
        if (pathname === '/index.html') {
            manualLogin();
        } else if (pathname.includes('welcome') || pathname.includes('admin')) {
            // If the pathname is '/welcome.html' or '/admin.html', speak that the user is already logged in
            speakText("You're already logged in.");
        } else {
            // If not on index.html, redirect to index.html and to the login section
            speakText('Redirecting to the login section.');
            window.location.href = 'index.html#Login'; 
        }
        stopListening();
    }
    
    function manualLogin() {
        speakText('Redirecting to the login Section');
        window.location.href = 'index.html#Login'; 
        stopListening();
    }

    function contactUs() {
        speakText('Here are our contact details.');
        outputDiv.textContent = 'Here are our contact details:';
        // Add code to display your contact information or navigate to the contact page
    }

    function showHelp() {
        speakText('Here are some commands you can use.');
        outputDiv.textContent = 'Login, Manual Login, Logout, Open Cart, Go Home, Product, About, Services ';
        // Add code to display a list of available voice commands
    }

    function logout() {
        speakText('Logging out.');
        window.location.href = 'index.html';
        localStorage.removeItem('isLogin'); // Or set to 'false'
        stopListening();
    }

    function stopListening() {
        if (recognition) {
            recognition.stop();
            recognition = null; // Reset the recognition object
        }
        // Disable the microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const audioTracks = stream.getAudioTracks();
                audioTracks.forEach(track => track.stop());
            })
            .catch(error => {
                console.error('Error disabling microphone:', error);
            });
    }

    function byeUser(){
        stopListening();
        speakText("I'm happy to assist you. Have a nice day, bye!");
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Speech synthesis is not supported in this browser.');
        }
    }

    voiceAssistantTrigger.addEventListener('click', () => {
        outputDiv.textContent = 'Listening...';
        startVoiceAssistant();
    });
});