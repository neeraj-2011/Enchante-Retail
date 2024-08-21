document.addEventListener("DOMContentLoaded", function () {
    const chatbotButton = document.getElementById("google-chatbot-btn");
    const chatbot = document.getElementById("google-chatbot");
    const input = document.getElementById("google-chatbot-input");
    const messages = document.getElementById("google-chatbot-messages");
    const startVoiceButton = document.getElementById("start-voice-btn");
    const speakerButton = document.getElementById("speaker-btn");

    let isSpeechEnabled = true; // Track if speech synthesis is enabled
    let recognition;
    let state = 'initial'; // 'initial', 'googleLogin', 'usernamePassword'
    let username = null;
    let role = null;

    // Initialize the chatbot
    chatbotButton.addEventListener("click", function () {
        chatbot.classList.toggle("hidden");
        if (!chatbot.classList.contains("hidden")) {
            startVoiceButton.style.display = 'block';
            addInitialMessages();
        } else {
            stopVoiceRecognition(); // Ensure recognition stops if chatbot is closed
        }
    });

    // Start voice recognition when the button is clicked
    startVoiceButton.addEventListener("click", function () {
        if (!chatbot.classList.contains("hidden")) {
            startVoiceRecognition();
        }
    });

    // Toggle speech synthesis
    speakerButton.addEventListener("click", function () {
        toggleSpeech(); // Toggle speech synthesis
    });

    // Process messages on Enter key press
    input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission if inside a form
            const message = input.value.trim();
            if (message) {
                processMessage(message);
                input.value = ""; // Clear the input field after sending the message
            }
        }
    });

    // Start voice recognition
    function startVoiceRecognition() {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            addMessage('Speech recognition is not supported in this browser.');
            return;
        }

        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function (event) {
            const message = event.results[0][0].transcript.trim();
            processMessage(message);
        };

        recognition.onerror = function (event) {
            addMessage(`Speech recognition error: ${event.error}`);
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();
    }

    // Stop voice recognition
    function stopVoiceRecognition() {
        if (recognition) {
            recognition.stop();
        }
    }

    // Process user messages
    function processMessage(message) {
        switch (state) {
            case 'initial':
                handleInitial(message);
                break;
            case 'googleLogin':
                handleGoogleLoginInput(message);
                break;
            case 'usernamePassword':
                handleUsernamePasswordInput(message);
                break;
            default:
                addMessage("Invalid state.");
                break;
        }
    }

    // Handle initial state messages
    function handleInitial(message) {
        const normalizedMessage = message.toLowerCase();
        if (normalizedMessage === "1" || normalizedMessage.includes("google")) {
            addMessage("You selected: Sign in with Google");
            handleGoogleLogin();
        } else if (normalizedMessage === "2" || normalizedMessage.includes("username")) {
            askForCredentials();
            state = 'usernamePassword';
        } else {
            addMessage("Invalid option. Please choose 1 for Google sign-in or 2 for username and password sign-in.");
            if (isSpeechEnabled) speak("Invalid option. Please choose 1 for Google sign-in or 2 for username and password sign-in.");
        }
    }

    // Handle Google login input
    function handleGoogleLoginInput(message) {
        const normalizedMessage = message.toLowerCase();
        if (normalizedMessage === "google method") {
            handleGoogleLogin();
        } else {
            addMessage("Invalid command. Say 'google method' to log in with Google.");
            if (isSpeechEnabled) speak("Invalid command. Say 'google method' to log in with Google.");
        }
        state = 'initial'; // Reset state after processing
    }

    // Handle username and password input
    function handleUsernamePasswordInput(message) {
        const cleanedMessage = cleanInput(message);

        if (!role) {
            role = cleanedMessage.toLowerCase(); // Convert role to lowercase
            addMessage(`Role: ${role}`);
            if (isSpeechEnabled) speak("Please enter your username:");
        } else if (!username) {
            username = cleanedMessage;
            addMessage(`Username: ${username}`);
            if (isSpeechEnabled) speak("Please enter your password:");
        } else {
            const password = cleanedMessage;
            addMessage(`Password: ${password}`);
            if (isSpeechEnabled) speak("Attempting to log you in...");
            handleLogin(role, username, password);
            role = null;
            username = null;
            state = 'initial'; // Reset state after processing
        }
    }

    // Handle Google login redirection
    function handleGoogleLogin() {
        addMessage('Initiating Google login...');
        if (isSpeechEnabled) speak('Initiating Google login...');
        // Redirect to Google authentication
        window.location.href = `http://localhost:3000/auth/google`;
    }

    // Ask for user credentials
    function askForCredentials() {
        addMessage("Please enter your role (admin/user):");
        if (isSpeechEnabled) speak("Please enter your role (admin/user):");
    }

    // Handle login
    async function handleLogin(role, username, password) {
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                }),
            });

            const data = await response.json();
            if (response.ok) {
                if (isSpeechEnabled) speak(data.message);
                localStorage.setItem('isLogin', JSON.stringify(true));
                console.log('Login successful, redirecting...');
                if (role === 'admin') {
                    window.location.href = `admin.html?username=${username}`;
                } else if (role === 'user') {
                    window.location.href = `welcome.html?username=${username}`;
                }
            } else {
                addMessage(data.error);
                if (isSpeechEnabled) speak(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage('An error occurred during login');
            if (isSpeechEnabled) speak('An error occurred during login');
        }
    }

    // Clean up input by removing trailing punctuation
    function cleanInput(input) {
        return input.replace(/[.?!]+$/, '').trim();
    }

    // Add a message to the chat
    function addMessage(message) {
        const msgElement = document.createElement("div");
        msgElement.textContent = message;
        messages.appendChild(msgElement);
        messages.scrollTop = messages.scrollHeight; // Scroll to the bottom
    }

    // Speak a message if speech is enabled
    function speak(message) {
        if (isSpeechEnabled) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel(); // Stop any ongoing speech synthesis
            }
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.onend = function () {
                console.log('Speech synthesis finished');
            };
            utterance.onerror = function (event) {
                console.error('Speech synthesis error:', event.error);
            };
            window.speechSynthesis.speak(utterance);
        }
    }

    // Toggle the speech synthesis state
    function toggleSpeech() {
        isSpeechEnabled = !isSpeechEnabled; // Toggle speech enabled state
        // Update button text based on the current state
        speakerButton.textContent = isSpeechEnabled ? '🔊' : '🔇';
        // Inform the user about the state change
        addMessage(isSpeechEnabled ? 'Speech synthesis enabled' : 'Speech synthesis disabled');
        // Optionally stop speech synthesis when disabled
        if (!isSpeechEnabled) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
        }
    }

    // Add initial messages to the chat
    function addInitialMessages() {
        addMessage("Choose login method:");
        addMessage("1. Sign in with Google");
        addMessage("2. Sign in with username and password");
        if (isSpeechEnabled) speak("Choose login method: 1 for Sign in with Google or 2 for Sign in with username and password");
    }
});
