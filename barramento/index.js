require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { PORT } = process.env;

const eventos = [];

// Array de URLs dos serviços de destino
const destinos = [
  'http://tti301-lembretes-clusterip-service:4000/eventos',
  'http://192.168.79.167:5000/eventos',
  'http://192.168.79.167:6000/eventos',
  'http://192.168.79.167:7000/eventos'
];

// Função para enviar evento a todos os serviços
async function enviarEventoParaDestinos(evento) {
  const promessas = destinos.map(async (url) => {
    try {
      await axios.post(url, evento);
      console.log(`Evento enviado para ${url}`);
    } catch (error) {
      console.error(`Falha ao enviar para ${url}: ${error.message}`);
    }
  });
  await Promise.all(promessas);
}

// Endpoint POST 
//eventos
app.post('/eventos', async (req, res) => {
  const evento = req.body;
  eventos.push(evento);
  console.log(`Novo evento recebido:`, evento);

  await enviarEventoParaDestinos(evento);

  res.status(200).json({ mensagem: 'Evento distribuído com sucesso' });
});

// Endpoint GET 
//eventos para obter todos os eventos
app.get('/eventos', (req, res) => {
  res.status(200).json(eventos);
});

// Inicia o servidor
app.listen(PORT, () => console.log(`Barramento ativo na porta ${PORT}.`));
