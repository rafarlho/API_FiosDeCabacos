const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
  const { to } = req.body;

  if (!to) return res.status(400).send('Email do utilizador em falta.');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email para o utilizador
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Obrigado pela tua compra!',
      text: 'Recebemos a tua encomenda com sucesso.',
    });

    // Email para ti
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: 'Nova encomenda recebida',
      text: `Nova encomenda de: ${to}`,
    });

    res.send('Emails enviados com sucesso.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao enviar emails.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));
