document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('main-form');
    const submitButton = form.querySelector('.submit-btn');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o envio tradicional do formulário

        // Esconde mensagens anteriores
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        // Validação básica do HTML5 (required)
        if (!form.checkValidity()) {
            errorMessage.textContent = 'Por favor, preencha todos os campos obrigatórios.';
            errorMessage.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
            return;
        }

        // Coleta apenas os dados necessários para o backend (as perguntas)
        const formData = new FormData(form);
        const data = {
            q1: formData.get('q1'),
            q2: formData.get('q2'),
            q3: formData.get('q3')
        };

        try {
            const response = await fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                // Sucesso
                successMessage.style.display = 'block';
                form.reset(); // Limpa o formulário
                window.scrollTo(0, document.body.scrollHeight); // Rola para o fim para ver a msg
                
                // Reabilita o botão após um tempo
                setTimeout(() => {
                    successMessage.style.display = 'none';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Enviar';
                }, 3000);

            } else {
                // Erro do servidor
                const errorData = await response.json();
                errorMessage.textContent = `Erro: ${errorData.message || 'Não foi possível registrar o envio.'}`;
                errorMessage.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar';
            }
        } catch (error) {
            // Erro de rede
            console.error('Erro de rede:', error);
            errorMessage.textContent = 'Erro de conexão. Tente novamente.';
            errorMessage.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
        }
    });
});