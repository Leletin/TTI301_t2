require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); 
const app = express();
app.use(express.json());

const { PORT } = process.env;

const reminders = [];

/*
esperado:
[
  { id: '1a2b3c', texto: 'estudar programação' },
  { id: '4d5e6f', texto: 'estudar java' }
]
*/

// Endpoint GET para obter todos os lembretes
app.get('/lembretes', (req, res) => {
  res.status(200).json(reminders);
});

// Endpoint POST para criar um novo lembrete
app.post('/lembretes', async (req, res) => {
  const newReminder = { id: uuidv4(), texto: req.body.texto };
  reminders.push(newReminder);

  try {
    await axios.post('http://tti301-barramento-de-eventos-service:10000/eventos', {
      type: 'LembreteCriado',
      payload: newReminder,
    });
    console.log('Evento LembreteCriado enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar evento LembreteCriado:', error.message);
  }

  res.status(201).json(newReminder);
});

// Endpoint para receber eventos
app.post('/eventos', (req, res) => {
  console.log('Evento recebido:', req.body);
  res.status(200).json({ mensagem: 'Evento recebido com sucesso' });
});

app.listen(PORT, () => {
  console.log(`Servidor de Lembretes ativo na porta ${PORT}`);
  console.log('Ambiente:', process.env.HOSTNAME);
  console.log('Versão atualizada do servidor de Lembretes');
});
