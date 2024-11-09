require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { PORT } = process.env;
const logs = [];
let logId = 1;

// Endpoint para registrar um novo evento
app.post('/eventos', (req, res) => {
  const { type } = req.body;
  const newLogEntry = {
    id: logId++,
    type,
    timestamp: new Date().toISOString()
  };

  logs.push(newLogEntry);

  return res.status(201).json(newLogEntry);
});

// Endpoint para obter todos os logs registrados
app.get('/logs', (req, res) => {
  res.status(200).json(logs);
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor de Logs ativo na porta ${PORT}.`);
});
