document.addEventListener('DOMContentLoaded', () => {
  // Busca o form (tenta pelo id, senão pega o primeiro form da página)
  const form = document.getElementById('main-form') || document.querySelector('form');
  if (!form) {
    console.error('Formulário não encontrado (id="main-form" ou <form> ausente).');
    return;
  }

  // Botão de submit (procura dentro do form ou globalmente)
  let submitButton = form.querySelector('.submit-btn') || form.querySelector('[type="submit"]') || document.querySelector('.submit-btn') || null;
  if (!submitButton) {
    console.warn('Botão de envio não encontrado com .submit-btn ou type="submit". O script continuará sem desabilitar o botão.');
  }

  // Mensagens de UI — cria se não existirem (para evitar erros)
  let successMessage = document.getElementById('success-message');
  let errorMessage = document.getElementById('error-message');

  if (!successMessage) {
    successMessage = document.createElement('div');
    successMessage.id = 'success-message';
    successMessage.style.display = 'none';
    successMessage.style.color = 'green';
    successMessage.style.marginTop = '10px';
    form.appendChild(successMessage);
  }
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.id = 'error-message';
    errorMessage.style.display = 'none';
    errorMessage.style.color = 'crimson';
    errorMessage.style.marginTop = '10px';
    form.appendChild(errorMessage);
  }

  // Helper para mostrar/esconder mensagens
  function showSuccess(text) {
    successMessage.textContent = text;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }
  function showError(text) {
    errorMessage.textContent = text;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset UI
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.origText = submitButton.textContent;
      submitButton.textContent = 'Enviando...';
    }

    // Validação HTML5 - se quiser usar
    if (!form.checkValidity()) {
      showError('Por favor, preencha todos os campos obrigatórios do formulário.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.origText || 'Enviar';
      }
      return;
    }

    // Lê o form e tenta capturar q1/q2/q3 com fallback para motivo1/motivo2/motivo3
    const formData = new FormData(form);
    const q1 = formData.get('q1') ?? formData.get('motivo1') ?? formData.get('m1') ?? null;
    const q2 = formData.get('q2') ?? formData.get('motivo2') ?? formData.get('m2') ?? null;
    const q3 = formData.get('q3') ?? formData.get('motivo3') ?? formData.get('m3') ?? null;

    // Validação: exige que as 3 perguntas tenham resposta
    if (!q1 || !q2 || !q3) {
      showError('Por favor, responda todas as 3 perguntas antes de enviar.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.origText || 'Enviar';
      }
      return;
    }

    // Monta payload — envio com os nomes 'q1','q2','q3' é compatível com seu backend
    const payload = { q1, q2, q3 };

    try {
      const response = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // tenta interpretar resposta JSON, mas tolera resposta não-JSON
      let body;
      try {
        body = await response.json();
      } catch (jsonErr) {
        body = null;
      }

      if (response.ok) {
        showSuccess(body?.message ?? 'Enviado com sucesso!');
        form.reset();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        // reabilita após breve tempo
        setTimeout(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = submitButton.dataset.origText || 'Enviar';
          }
          successMessage.style.display = 'none';
        }, 2500);
      } else {
        const msg = body?.message ?? `Erro do servidor (${response.status})`;
        showError(msg);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.origText || 'Enviar';
        }
      }
    } catch (networkErr) {
      console.error('Erro de rede ao enviar formulário:', networkErr);
      showError('Erro de conexão. Verifique sua rede e tente novamente.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.origText || 'Enviar';
      }
    }
  });
});