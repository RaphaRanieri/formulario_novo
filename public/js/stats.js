document.addEventListener('DOMContentLoaded', () => {
  function updateStatsUI(data) {
    const total = data.totalSubmissions;

    // Atualiza total de envios
    const totalCountEl = document.getElementById('total-count');
    if (totalCountEl) totalCountEl.textContent = total;

    // Função auxiliar para atualizar barras
    const updateProgressBar = (question, option) => {
      const count = data[question][option];
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

      const countEl = document.getElementById(`${question}-${option}-count`);
      const barEl = document.getElementById(`${question}-${option}-bar`);

      if (countEl) countEl.textContent = `${count} votos`;
      if (barEl) {
        barEl.style.width = `${percentage}%`;
        barEl.textContent = `${percentage}%`;
      }
    };

    // Atualiza todas as perguntas
    ['q1', 'q2', 'q3'].forEach(q =>
      ['opt1', 'opt2', 'opt3'].forEach(o => updateProgressBar(q, o))
    );
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/stats?_t=' + Date.now());
      if (!response.ok) throw new Error('Falha ao obter estatísticas');
      const data = await response.json();
      updateStatsUI(data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }

  fetchStats();
  setInterval(fetchStats, 5000);
});
