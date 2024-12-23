const user = "demo";
const ip = ""; // add an URL here like hivemind.webserver.com
const port = 443; // the webserver needs to have SSL certificate; this port therefore should be 443 (=ssl)
let hivemind_connection;
let isMessageDisplayed = false;
const ovosMessageQueue = [];
let currentName = ""; // Variable to store the entered name

// Function to read a message using the Web Speech API
function speakMessage(text) {
    const speechToggle = document.getElementById("speechToggle").checked;
    if (speechToggle && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nl-NL'; // Dutch
        window.speechSynthesis.speak(utterance);
    }
}

// Onload function for sessionStorage data
window.onload = function () {
    if (sessionStorage.getItem("rememberMe") === "true") {
        document.getElementById("key").value = sessionStorage.getItem("key") || "";
        document.getElementById("crypto_key").value = sessionStorage.getItem("crypto_key") || "";
        document.getElementById("rememberMe").checked = true;
    }
};

document.getElementById('loginButton').onclick = function () {
    const name = document.getElementById('name').value;
    const password = document.getElementById('crypto_key').value;
    const key = document.getElementById('key').value;

    if (!key || !password) {
        alert("Please enter your username and password.");
        return;
    }

    currentName = name; // Store the entered name in the variable

    if (document.getElementById("rememberMe").checked) {
        sessionStorage.setItem("key", key); // Remember the real username
        sessionStorage.setItem("crypto_key", password); // Remember the password
        sessionStorage.setItem("rememberMe", "true");
    } else {
        sessionStorage.removeItem("key");
        sessionStorage.removeItem("crypto_key");
        sessionStorage.removeItem("rememberMe");
    }

    hivemind_connection = new JarbasHiveMind();

    hivemind_connection.onHiveConnected = function () {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'flex';
        document.getElementById('chatTitle').innerText = "Welcome, " + currentName + "!";
        displayWelcomeMessage(currentName); 
        showSuggestions(["What time is it?", "Exampple intent 2", "How tall is the Eiffel Tower?"]); // add intents here from the skills you have installed; the third one will trigger local AI in my case
    };
    
    hivemind_connection.onMycroftSpeak = function (mycroft_message) {
        const utterance = mycroft_message.data.utterance;
        ovosMessageQueue.push(utterance);
        displayNextMessage();
    };

    function displayNextMessage() {
        if (isMessageDisplayed || ovosMessageQueue.length === 0) return;
        isMessageDisplayed = true;
        const utterance = ovosMessageQueue.shift();
        const chatBox = document.getElementById('chatBox');

        const ovosMessage = document.createElement("div");
        ovosMessage.className = "message ovos";
        ovosMessage.setAttribute("aria-live", "assertive");
        ovosMessage.innerText = utterance;

        const ovosName = document.createElement("div");
        ovosName.className = "ovos-name";
        ovosName.innerText = "OVOS:";

        chatBox.appendChild(ovosName);
        chatBox.appendChild(ovosMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Read the message aloud if enabled
        speakMessage(utterance);

        const readTime = Math.max(1000, utterance.length * 35);
        setTimeout(() => {
            isMessageDisplayed = false;
            displayNextMessage();
        }, readTime);
    }

    hivemind_connection.onHiveDisconnected = function () {
        alert("Connection to Visio Assistant has been lost...");
    };

    hivemind_connection.connect(ip, port, user, key, password);
};

document.getElementById('messageInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
        event.preventDefault();
    }
});

document.getElementById('sendButton').onclick = sendMessage;

function sendMessage() {
    const message = document.getElementById('messageInput').value;
    if (message) {
        hivemind_connection.sendUtterance(message);
        addUserMessage(message);
        document.getElementById('messageInput').value = "";
    }
}

function addUserMessage(message) {
    const chatBox = document.getElementById('chatBox');
    
    const userName = document.createElement("div");
    userName.className = "user-name";
    userName.innerText = currentName + ":";

    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.innerText = message;

    chatBox.appendChild(userName);
    chatBox.appendChild(userMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    suggestionsContainer.innerHTML = '';

    suggestions.forEach(text => {
        const suggestionButton = document.createElement('button');
        suggestionButton.className = 'suggestion';
        suggestionButton.textContent = text;
        suggestionButton.onclick = () => {
            document.getElementById('messageInput').value = text;
            sendMessage();
        };
        suggestionsContainer.appendChild(suggestionButton);
    });
    suggestionsContainer.style.display = 'flex';
}

function displayWelcomeMessage(name) {
    const chatBox = document.getElementById('chatBox');
    const welcomeMessage = document.createElement("div");
    welcomeMessage.className = "message ovos";
    welcomeMessage.innerHTML = "Welcome, " + name + "! Glad you're here! How can I help you?";
    chatBox.appendChild(welcomeMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// JavaScript for toggling between speaker-on and speaker-off icons
document.getElementById('speechToggle').addEventListener('change', function() {
    const speakerIcon = document.getElementById('speakerIcon');
    const label = document.querySelector('label[for="speechToggle"]');
    const isChecked = this.checked;

    // Update the icon and aria-checked
    label.setAttribute('aria-checked', isChecked.toString());
    if (isChecked) {
        speakerIcon.classList.remove('-off');
        speakerIcon.classList.add('-on');
    } else {
        speakerIcon.classList.remove('-on');
        speakerIcon.classList.add('-off');
    }
});
