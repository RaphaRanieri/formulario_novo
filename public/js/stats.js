document.addEventListener('DOMContentLoaded', () => {

    // Função para atualizar os elementos da UI com os dados
    function updateStatsUI(data) {
        const total = data.totalSubmissions;
        
        // Total de Envios
        document.getElementById('total-count').textContent = total;

        // Função auxiliar para atualizar uma barra de progresso
        const updateProgressBar = (question, option) => {
            const count = data[question][option];
            const percentage = (total > 0) ? ((count / total) * 100).toFixed(1) : 0;
            
            const countEl = document.getElementById(`${question}-${option}-count`);
            const barEl = document.getElementById(`${question}-${option}-bar`);

            if (countEl) countEl.textContent = `${count} votos`;
            if (barEl) {
                barEl.style.width = `${percentage}%`;
                barEl.textContent = `${percentage}%`;
            }
        };

        // Atualiza Pergunta 1
        updateProgressBar('q1', 'opt1');
        updateProgressBar('q1', 'opt2');
        updateProgressBar('q1', 'opt3');

        // Atualiza Pergunta 2
        updateProgressBar('q2', 'opt1');
        updateProgressBar('q2', 'opt2');
        updateProgressBar('q2', 'opt3');

        // Atualiza Pergunta 3
        updateProgressBar('q3', 'opt1');
        updateProgressBar('q3', 'opt2');
        updateProgressBar('q3', 'opt3');
    }

    // Função para buscar os dados da API
    async function fetchStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Não foi possível buscar as estatísticas.');
            }
            const data = await response.json();
            updateStatsUI(data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    }

    // Busca os dados imediatamente ao carregar a página
    fetchStats();

    // Define um intervalo para buscar os dados a cada 5 segundos (polling)
    setInterval(fetchStats, 5000);
});