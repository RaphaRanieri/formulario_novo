const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// estado em memória (fallback caso gravação em disco falhe)
let inMemoryFallback = null;

// helper: read
function readData() {
  try {
    if (inMemoryFallback) return inMemoryFallback;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // arquivo não existe ou erro -> cria estado inicial
    const initial = {
      totalSubmissions: 0,
      q1: { "opt1": 0, "opt2": 0, "opt3": 0 },
      q2: { "opt1": 0, "opt2": 0, "opt3": 0 },
      q3: { "opt1": 0, "opt2": 0, "opt3": 0 }
    };
    // guarda em memória para evitar repetidos erros de leitura
    inMemoryFallback = initial;
    return initial;
  }
}

// helper: write (tenta gravar em disco, se falhar usa fallback em memória)
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    inMemoryFallback = null; // arquivo salvo, podemos limpar o fallback
    return true;
  } catch (err) {
    console.error('Falha ao escrever em disco (usando fallback em memória):', err.message);
    inMemoryFallback = data;
    return false;
  }
}

// normaliza respostas (aceita "Sempre" ou "opt1" etc)
function normalizeAnswer(question, value) {
  if (!value) return null;
  // se já for opt1/opt2/opt3, retorna
  if (['opt1','opt2','opt3'].includes(value)) return value;

  // mapeamentos conhecidos das suas perguntas originais
  const maps = {
    motivo1: { 'Sempre': 'opt1', 'As vezes': 'opt2', 'As vezes.': 'opt2', 'Sou desatento': 'opt3' },
    motivo2: { 'Não': 'opt1', 'Sim': 'opt2', 'Não tenho certeza': 'opt3', 'Nao tenho certeza': 'opt3' },
    motivo3: { 'Sim': 'opt1', 'Não': 'opt2', 'Nao': 'opt2', 'Nunca aconteceu': 'opt3' },

    // também suportar q1/q2/q3 com labels genéricos (apenas como exemplo)
    q1: { 'Vermelho': 'opt1', 'Azul': 'opt2', 'Verde': 'opt3', 'opt1':'opt1','opt2':'opt2','opt3':'opt3' },
    q2: { 'Verão': 'opt1', 'Inverno': 'opt2', 'Primavera': 'opt3' },
    q3: { 'Ler Livros': 'opt1', 'Praticar Esportes': 'opt2', 'Assistir Filmes': 'opt3' }
  };

  // tenta mapear usando question original (motivo1 etc)
  if (maps[question] && maps[question][value] !== undefined) return maps[question][value];

  // tenta todas as maps (caso question seja "q1" mas value seja "Sempre")
  for (const k of Object.keys(maps)) {
    if (maps[k][value] !== undefined) return maps[k][value];
  }

  // fallback: se value contém "1","2","3"
  if (/1/.test(value)) return 'opt1';
  if (/2/.test(value)) return 'opt2';
  if (/3/.test(value)) return 'opt3';

  return null;
}

// rota raiz e páginas estáticas já servidas por express.static
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});
app.get('/termos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'termos.html'));
});

// Endpoint compatível: /submit (novo) e /contar (antigo)
app.post(['/submit','/contar'], (req, res) => {
  const body = req.body || {};

  // Aceita tanto q1/q2/q3 quanto motivo1/motivo2/motivo3
  const rawQ1 = body.q1 || body.motivo1 || body.m1 || null;
  const rawQ2 = body.q2 || body.motivo2 || body.m2 || null;
  const rawQ3 = body.q3 || body.motivo3 || body.m3 || null;

  if (!rawQ1 || !rawQ2 || !rawQ3) {
    // Se o frontend envia mais campos (nome/email) não falha aqui, mas exige as 3 perguntas
    return res.status(400).json({ success: false, message: 'As 3 perguntas são obrigatórias (q1,q2,q3 / motivo1,2,3).' });
  }

  const data = readData();

  // incrementa total
  data.totalSubmissions = (data.totalSubmissions || 0) + 1;

  // normaliza e incrementa cada resposta
  const a1 = normalizeAnswer('motivo1', rawQ1);
  const a2 = normalizeAnswer('motivo2', rawQ2);
  const a3 = normalizeAnswer('motivo3', rawQ3);

  if (a1 && data.q1.hasOwnProperty(a1)) data.q1[a1] += 1;
  if (a2 && data.q2.hasOwnProperty(a2)) data.q2[a2] += 1;
  if (a3 && data.q3.hasOwnProperty(a3)) data.q3[a3] += 1;

  const ok = writeData(data);
  if (!ok) {
    // avisamos que salvou apenas em memória
    return res.status(200).json({ success: true, message: 'Recebido (salvo em memória temporária).' });
  }

  res.json({ success: true, message: 'Recebido e salvo.' });
});

// rota API para pegar stats (frontend deve buscar /api/stats)
app.get('/api/stats', (req, res) => {
  const data = readData();
  res.json(data);
});

// rota antiga compatível (caso seu front busque /estatisticas/dados)
app.get('/estatisticas/dados', (req, res) => {
  const data = readData();
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Garante arquivo inicial se possível
  try {
    if (!fs.existsSync(DATA_FILE)) {
      writeData(readData());
    }
  } catch (err) {
    console.error('Não foi possível criar data.json automaticamente:', err.message);
  }
});