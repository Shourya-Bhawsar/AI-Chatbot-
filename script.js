const API_KEY = 'AIzaSyCzHtbYJ-hCheLjF2sWlZiwNDLd7BeFmsQ';
let conversationHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('userInput').focus();
  updateDarkModeIcon();
  
  // Initialize with system message about MP Tourism
  conversationHistory.push({
    role: "user",
    parts: [{ text: "You are now a specialized Madhya Pradesh Tourism assistant. Your name is MP Explorer. Your purpose is to provide accurate, helpful information ONLY about tourism in Madhya Pradesh, India. This includes information about destinations, accommodations, transportation, cuisine, culture, festivals, wildlife, history, and travel tips within Madhya Pradesh. If asked about topics unrelated to Madhya Pradesh tourism, politely redirect the conversation back to MP tourism topics. Remember this context for all future responses." }]
  });
  
  // Send initial system message to set context
  initializeBot();
});

async function initializeBot() {
  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator.classList.remove('hidden');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: conversationHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated');
    }
    
    // Store the model's acknowledgment but don't display it
    conversationHistory.push({
      role: "model",
      parts: [{ text: data.candidates[0].content.parts[0].text }]
    });
    
    // Now send a welcome message to the user
    conversationHistory.push({
      role: "user",
      parts: [{ text: "Introduce yourself as MP Explorer, a Madhya Pradesh tourism assistant. Mention 3-4 key attractions briefly." }]
    });
    
    // Get the welcome message
    const welcomeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: conversationHistory
      })
    });
    
    const welcomeData = await welcomeResponse.json();
    const welcomeMessage = welcomeData.candidates[0].content.parts[0].text;
    
    // Add welcome message to conversation history
    conversationHistory.push({
      role: "model",
      parts: [{ text: welcomeMessage }]
    });
    
    // Display welcome message
    appendMessage('bot', welcomeMessage);
    
  } catch (error) {
    console.error('Error:', error);
    // Fallback welcome message if API fails
    appendMessage('bot', 'Namaste! I\'m MP Explorer, your Madhya Pradesh Tourism assistant. I can help you discover the wonders of the "Heart of India" - from the magnificent temples of Khajuraho to the majestic tigers of Bandhavgarh, the ancient city of Ujjain, and the stunning palaces of Orchha. How may I assist with your MP travel plans?');
  } finally {
    typingIndicator.classList.add('hidden');
  }
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const typingIndicator = document.getElementById('typingIndicator');
  const message = input.value.trim();
  
  if (!message) return;

  appendMessage('user', message);
  
  input.value = '';
  input.focus();
  typingIndicator.classList.remove('hidden');
  
  // Add MP tourism context to each user message
  const enhancedMessage = `${message} (Remember: You are MP Explorer, a Madhya Pradesh tourism assistant. Only provide information related to Madhya Pradesh tourism, travel, and culture.)`;
  
  conversationHistory.push({
    role: "user",
    parts: [{ text: enhancedMessage }]
  });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated');
    }
    
    const reply = data.candidates[0].content.parts[0].text;
    
    conversationHistory.push({
      role: "model",
      parts: [{ text: reply }]
    });
    
    appendMessage('bot', reply);
    
  } catch (error) {
    console.error('Error:', error);
    appendMessage('bot', `Sorry, I encountered an error: ${error.message}`);
    
    conversationHistory.pop();
  } finally {
    typingIndicator.classList.add('hidden');
  }
}

function appendMessage(sender, text) {
  const chatBox = document.getElementById('chatBox');
  const messageContainer = document.createElement('div');
  messageContainer.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} w-full mb-4`;
  
  const msg = document.createElement('div');
  msg.className = `p-3 rounded-lg max-w-[80%] ${
    sender === 'user' 
      ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' 
      : 'bg-primary/10 dark:bg-primary/20 text-gray-900 dark:text-gray-100'
  } break-words`;
  
  if (sender === 'bot') {
    // Code blocks
    text = text.replace(/``````/g, '<pre class="bg-gray-800 text-gray-200 dark:bg-gray-900 p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>');
    
    // Bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 dark:text-blue-400 underline">$1</a>');
    
    // Line breaks
    text = text.replace(/\n/g, '<br>');
    
    msg.innerHTML = text;
  } else {
    msg.textContent = text;
  }
  
  messageContainer.appendChild(msg);
  chatBox.appendChild(messageContainer);
  
  const timestamp = document.createElement('div');
  timestamp.className = `text-xs text-gray-500 mt-1 ${sender === 'user' ? 'text-right' : 'text-left'}`;
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageContainer.appendChild(timestamp);
  
  chatBox.scrollTop = chatBox.scrollHeight;
  
  msg.animate([
    { opacity: 0, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {
    duration: 300,
    easing: 'ease-out'
  });
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  
  const isDarkMode = document.documentElement.classList.contains('dark');
  localStorage.setItem('dark-mode', isDarkMode);
  
  updateDarkModeIcon();
}

function updateDarkModeIcon() {
  const darkModeIcon = document.getElementById('darkModeIcon');
  if (darkModeIcon) {
    const isDarkMode = document.documentElement.classList.contains('dark');
    darkModeIcon.textContent = isDarkMode ? '☀️' : '🌙';
  }
}

document.getElementById('userInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
});

function clearConversation() {
  const chatBox = document.getElementById('chatBox');
  chatBox.innerHTML = '';
  
  // Reset conversation but keep the initial context
  conversationHistory = [];
  
  // Re-initialize the bot
  setTimeout(() => {
    // Re-initialize with MP tourism context
    conversationHistory.push({
      role: "user",
      parts: [{ text: "You are now a specialized Madhya Pradesh Tourism assistant. Your name is MP Explorer. Your purpose is to provide accurate, helpful information ONLY about tourism in Madhya Pradesh, India. This includes information about destinations, accommodations, transportation, cuisine, culture, festivals, wildlife, history, and travel tips within Madhya Pradesh. If asked about topics unrelated to Madhya Pradesh tourism, politely redirect the conversation back to MP tourism topics. Remember this context for all future responses." }]
    });
    
    appendMessage('bot', 'Conversation cleared. I\'m MP Explorer, your Madhya Pradesh Tourism assistant. How can I help with your MP travel plans?');
  }, 300);
}
