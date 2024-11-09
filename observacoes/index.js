require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const { PORT } = process.env;

const notesByReminder = {};

const eventHandlers = {
  ObservacaoClassificada: async (observation) => {
    const observations = notesByReminder[observation.lembreteId] || [];
    const observationToUpdate = observations.find(o => o.id === observation.id);
    
    if (observationToUpdate) {
      observationToUpdate.status = observation.status;
      
      // Envia o evento ObservacaoAtualizada para o barramento de eventos
      try {
        await axios.post('http://tti301-barramento-service:10000/eventos', {
          type: "ObservacaoAtualizada",
          payload: { ...observationToUpdate }
        });
        console.log('Evento ObservacaoAtualizada enviado com sucesso');
      } catch (error) {
        console.error('Erro ao enviar ObservacaoAtualizada:', error.message);
      }
    }
  }
};

// Endpoint GET para obter todas as observações de um lembrete específico
app.get('/lembretes/:idLembrete/observacoes', (req, res) => {
  const reminderObservations = notesByReminder[req.params.idLembrete] || [];
  res.status(200).json(reminderObservations);
});

// Endpoint POST para adicionar uma nova observação a um lembrete
app.post('/lembretes/:idLembrete/observacoes', async (req, res) => {
  const observationId = uuidv4();
  const { texto } = req.body;

  // Adiciona uma nova observação com status inicial "aguardando"
  const newObservation = { id: observationId, texto, status: 'aguardando' };
  const observations = notesByReminder[req.params.idLembrete] || [];
  observations.push(newObservation);
  notesByReminder[req.params.idLembrete] = observations;

  try {
    await axios.post('http://tti301-barramento-service:10000/eventos', {
      type: 'ObservacaoCriada',
      payload: { ...newObservation, lembreteId: req.params.idLembrete }
    });
    console.log('Evento ObservacaoCriada enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar ObservacaoCriada:', error.message);
  }

  res.status(201).json(newObservation);
});

// Endpoint para receber eventos e processá-los com base no tipo de evento
app.post('/eventos', (req, res) => {
  const event = req.body;
  console.log('Evento recebido:', event);

  const handleEvent = eventHandlers[event.type];
  if (handleEvent) {
    try {
      handleEvent(event.payload);
    } catch (error) {
      console.error(`Erro ao processar evento ${event.type}:`, error.message);
    }
  } else {
    console.warn(`Nenhum manipulador para o tipo de evento: ${event.type}`);
  }

  res.status(200).json({ msg: 'Evento processado com sucesso' });
});

app.listen(PORT, () => console.log(`Servidor de Observações ativo na PORTA ${PORT}.`));
