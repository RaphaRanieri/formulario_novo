const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware para ler JSON do corpo da requisição
app.use(express.json());
// Middleware para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Função auxiliar para ler os dados
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existir ou estiver corrompido, retorna o estado inicial
    return {
      totalSubmissions: 0,
      q1: { "opt1": 0, "opt2": 0, "opt3": 0 },
      q2: { "opt1": 0, "opt2": 0, "opt3": 0 },
      q3: { "opt1": 0, "opt2": 0, "opt3": 0 }
    };
  }
}

// Função auxiliar para escrever os dados
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Rota principal - serve o formulário
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para a página de estatísticas
app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// Rota para a página de termos
app.get('/termos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'termos.html'));
});

// API: Endpoint para submissão do formulário
app.post('/submit', (req, res) => {
  const { q1, q2, q3 } = req.body;
  
  if (!q1 || !q2 || !q3) {
    return res.status(400).json({ message: 'Todas as perguntas são obrigatórias.' });
  }

  const data = readData();

  // Incrementa o total
  data.totalSubmissions += 1;

  // Incrementa as respostas
  if (data.q1.hasOwnProperty(q1)) data.q1[q1] += 1;
  if (data.q2.hasOwnProperty(q2)) data.q2[q2] += 1;
  if (data.q3.hasOwnProperty(q3)) data.q3[q3] += 1;

  writeData(data);

  res.status(200).json({ message: 'Formulário recebido com sucesso!' });
});

// API: Endpoint para buscar as estatísticas
app.get('/api/stats', (req, res) => {
  const data = readData();
  res.json(data);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Garante que o arquivo data.json exista na inicialização
  if (!fs.existsSync(DATA_FILE)) {
    writeData(readData());
  }
});