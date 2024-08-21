document.addEventListener('DOMContentLoaded', () => {
    const chatbotButton = document.getElementById('login-chatbot-button');
    const chatbot = document.getElementById('chatbot');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');

    let state = 'INITIAL';
    const loginState = {
        role: '',
        username: '',
        password: ''
    };

    chatbotButton.addEventListener('click', () => {
        chatbot.classList.toggle('hidden');
        chatbotInput.focus();
    });

    function addMessage(text, sender = 'bot') {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = text;
        messageDiv.classList.add(sender === 'bot' ? 'bot-message' : 'user-message');
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function handleUserMessage(message) {
        console.log('Current state:', state);
        console.log('User message:', message);

        let response = 'Sorry, I did not understand that.';
        const messageLower = message.toLowerCase();

        switch (state) {
            case 'INITIAL':
                if (messageLower.includes('hi')) {
                    response = 'Hello! Are you an admin or a user?';
                    state = 'ASKING_ROLE';
                }
                break;

            case 'ASKING_ROLE':
                if (messageLower.includes('admin')) {
                    response = 'Please enter your admin username.';
                    loginState.role = 'admin';
                    state = 'ASKING_USERNAME';
                } else if (messageLower.includes('user')) {
                    response = 'Please enter your username.';
                    loginState.role = 'user';
                    state = 'ASKING_USERNAME';
                }
                break;

            case 'ASKING_USERNAME':
                console.log('Entering ASKING_USERNAME state');
                loginState.username = message.trim();
                response = 'Please enter your password.';
                state = 'ASKING_PASSWORD';
                break;

            case 'ASKING_PASSWORD':
                console.log('Entering ASKING_PASSWORD state');
                loginState.password = message.trim();
                response = 'Attempting to log you in...';
                addMessage(response, 'bot');  // Show this message before attempting login
                handleLogin();
                return;  // Return early to avoid adding another message
                break;

            default:
                if (messageLower.includes('okay')) {
                    response = 'Thank you for visiting! Have a great day!';
                }
                break;
        }

        console.log('Bot response:', response);
        addMessage(response, 'bot');
    }

    async function handleLogin() {
        const loginForm = new FormData();
        loginForm.append('username', loginState.username);
        loginForm.append('password', loginState.password);
        loginForm.append('role', loginState.role);

        const messageDiv = document.getElementById('message');

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: loginState.username,
                    password: loginState.password,
                    role: loginState.role
                }),
            });

            const data = await response.json();
            if (response.ok) {
                messageDiv.textContent = data.message;
                alert(data.message);
                console.log('Login successful, redirecting...');
                // Corrected redirection logic
                if (loginState.role === 'admin') {
                    window.location.href = `admin.html?username=${loginState.username}`;
                } else if (loginState.role === 'user') {
                    window.location.href = `welcome.html?username=${loginState.username}`;
                }
            } else {
                messageDiv.textContent = data.error;
                addMessage(data.error, 'bot');
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred during login';
            console.error('Error:', error);
            addMessage('An error occurred during login', 'bot');
        } finally {
            // Reset state after attempting login
            state = 'INITIAL';
            loginState.role = '';
            loginState.username = '';
            loginState.password = '';
        }
    }

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatbotInput.value.trim();
            if (message) {
                addMessage(message, 'user');
                handleUserMessage(message);
                chatbotInput.value = '';
            }
        }
    });
});
