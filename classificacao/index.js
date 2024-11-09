require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { PORT } = process.env;
const KEYWORD = 'importante'; 

// Funções de eventos
const eventHandlers = {
  ObservacaoCriada: async (observacao) => {
    observacao.status = observacao.texto.includes(KEYWORD) ? 'importante' : 'comum';

    try {
      await axios.post('http://tti301-barramento-service:10000/eventos', {
        type: 'ObservacaoClassificada',
        payload: observacao,
      });
      console.log('Evento ObservacaoClassificada enviado');
    } catch (error) {
      console.error('Erro ao enviar ObservacaoClassificada:', error.message);
    }
  },
};

// Endpoint para receber eventos
app.post('/eventos', async (req, res) => {
  const evento = req.body;
  console.log('Evento recebido:', evento);

  const handleEvent = eventHandlers[evento.type];
  if (handleEvent) {
    try {
      await handleEvent(evento.payload);
    } catch (error) {
      console.error(`Erro ao processar evento ${evento.type}:`, error.message);
    }
  } else {
    console.warn(`Nenhum manipulador para o tipo de evento: ${evento.type}`);
  }

  res.json({ msg: 'Evento processado' });
});

// Inicialização do servidor e recuperação de eventos pendentes
app.listen(PORT, async () => {
  console.log(`Serviço de Classificação ativo na porta ${PORT}.`);

  try {
    const response = await axios.get('http://tti301-barramento-service:10000/eventos');
    console.log('Recuperando eventos anteriores...');

    response.data.forEach(async (evento) => {
      const handleEvent = eventHandlers[evento.type];
      if (handleEvent) {
        try {
          await handleEvent(evento.payload);
        } catch (error) {
          console.error(`Erro ao processar evento pendente ${evento.type}:`, error.message);
        }
      }
    });
  } catch (error) {
    console.error('Erro ao recuperar eventos anteriores:', error.message);
  }
});
