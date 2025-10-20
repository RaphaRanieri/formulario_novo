const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Carrega os contadores do arquivo (ou cria um novo)
let contadores = {
  campos: {
    nome: 0,
    email: 0,
    telefone: 0,
    endereco: 0,
    data_nascimento: 0
  },
  perguntas: {
    motivo1: { Sempre: 0, "As vezes": 0, "Sou desatento": 0 },
    motivo2: { "Não": 0, Sim: 0, "Não tenho certeza": 0 },
    motivo3: { Sim: 0, "Não": 0, "Nunca aconteceu": 0 }
  }
};

// Lê os dados salvos no data.json (se existir)
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    contadores = data;
    console.log('✅ Dados carregados do arquivo data.json');
  } catch (err) {
    console.error('⚠️ Erro ao ler data.json:', err);
  }
}

// 🔹 Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔹 Página de estatísticas
app.get('/estatisticas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// 🔹 API para enviar respostas
app.post('/contar', (req, res) => {
  const dados = req.body;

  // Contar campos preenchidos
  Object.keys(contadores.campos).forEach(campo => {
    if (dados[campo] && dados[campo].trim() !== '') {
      contadores.campos[campo]++;
    }
  });

  // Contar respostas de perguntas
  Object.keys(contadores.perguntas).forEach(pergunta => {
    const valor = dados[pergunta];
    if (valor && contadores.perguntas[pergunta].hasOwnProperty(valor)) {
      contadores.perguntas[pergunta][valor]++;
    }
  });

  // Salva no arquivo JSON
  fs.writeFileSync(DATA_FILE, JSON.stringify(contadores, null, 2));
  res.json({ mensagem: 'Estatísticas atualizadas com sucesso.' });
});

// 🔹 API para exibir estatísticas
app.get('/estatisticas/dados', (req, res) => {
  res.json(contadores);
});

// 🔹 Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
