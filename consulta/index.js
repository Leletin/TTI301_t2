require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { PORT } = process.env;

const dataStore = {}; 

const eventHandlers = {
  LembreteCriado: (lembrete) => {
    dataStore[lembrete.id] = { ...lembrete, observacoes: [] }; 
  },
  ObservacaoCriada: (observacao) => {
    const observacoes = dataStore[observacao.lembreteId]?.observacoes || [];
    observacoes.push(observacao);
    dataStore[observacao.lembreteId].observacoes = observacoes;
  },
  ObservacaoAtualizada: (observacao) => {
    const observacoes = dataStore[observacao.lembreteId]?.observacoes || [];
    const index = observacoes.findIndex((o) => o.id === observacao.id);
    if (index !== -1) {
      observacoes[index] = observacao;
    }
  }
};

// Endpoint GET para consultar lembretes
app.get('/lembretes', (req, res) => {
  res.status(200).json(dataStore);
});

// Endpoint POST para receber eventos
app.post('/eventos', (req, res) => {
  const evento = req.body;
  console.log('Evento recebido:', evento);

  const handleEvent = eventHandlers[evento.type];
  if (handleEvent) {
    try {
      handleEvent(evento.payload);
    } catch (error) {
      console.error(`Erro ao processar evento ${evento.type}:`, error.message);
    }
  } else {
    console.warn(`Tipo de evento desconhecido: ${evento.type}`);
  }

  res.status(200).json({ msg: 'Evento processado com sucesso' });
});

app.listen(PORT, async () => {
  console.log(`Servidor de Consulta ativo na porta ${PORT}.`);

  try {
    const response = await axios.get('http://tti301-barramento-service:10000/eventos');
    console.log('Recuperando eventos anteriores...');

    // Processa cada evento recebido
    response.data.forEach((evento) => {
      const handleEvent = eventHandlers[evento.type];
      if (handleEvent) {
        try {
          handleEvent(evento.payload);
        } catch (error) {
          console.error(`Erro ao processar evento pendente ${evento.type}:`, error.message);
        }
      }
    });
  } catch (error) {
    console.error('Erro ao recuperar eventos anteriores:', error.message);
  }
});
