const form = document.querySelector('#message-form');
const input = document.querySelector('#message');
const button = document.querySelector('#send');
const status = document.querySelector('#status');

input.addEventListener('input', () => {
  document.querySelector('#count').textContent = input.value.length;
  input.setCustomValidity('');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!input.value.trim()) {
    input.setCustomValidity('Escribe un mensaje antes de enviarlo.');
    input.reportValidity();
    return;
  }

  const config = window.TELEGRAM_CONFIG || {};
  if (!config.BOT_TOKEN || config.BOT_TOKEN === 'tu_bot_token_aqui' || !config.CHAT_ID || config.CHAT_ID === 'tu_chat_id_aqui') {
    status.className = 'status error';
    status.textContent = 'Configura BOT_TOKEN y CHAT_ID en config.js antes de usar.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Enviando…';
  status.textContent = '';

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
      throw new Error(data.description || 'Telegram no pudo recibir el mensaje.');
    }
    status.className = 'status success';
    status.textContent = '¡Mensaje enviado a Telegram!';
    form.reset();
    document.querySelector('#count').textContent = '0';
  } catch (error) {
    status.className = 'status error';
    status.textContent = error.message || 'No se pudo conectar con Telegram. Intenta nuevamente.';
  } finally {
    button.disabled = false;
    button.textContent = 'Enviar mensaje';
  }
});
