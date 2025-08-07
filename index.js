const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const allowedOrigins = ['https://fiosdecabacos.web.app', 'http://localhost:4200'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('A origem não é permitida pelo CORS'));
    }
  }
}));
app.use(express.json());

app.post('/send-email', async (req, res) => {
  const {
    to,
    fullName,
    totalPrice,
    totalItems,
    items // espera-se um array de { product: {name, price, imagePaths}, quantity }
  } = req.body;

  if (!to || !fullName || !totalPrice || !totalItems || !items) {
    return res.status(400).send('Faltam dados no pedido.');
  }

  // Montar uma lista legível dos itens do carrinho
  const itemsList = items.map((item, index) => {
    const name = item.product.name;
    const price = item.product.price?.toFixed(2) || "0.00";
    const quantity = item.quantity;
    return `${index + 1}. ${name} — Quantidade: ${quantity}, Preço unitário: €${price}`;
  }).join('\n');

  // Texto do email para o cliente
  const emailUserText = `
Olá ${fullName},

Obrigado pela tua compra!

Resumo da encomenda:
- Total de itens: ${totalItems}
- Preço total: €${totalPrice.toFixed(2)}

Itens:
${itemsList}

Em breve entraremos em contacto.
`;

// Texto do email para ti
const emailNotifyText = `
Nova encomenda recebida:

Cliente: ${fullName} (${to})
Total de itens: ${totalItems}
Preço total: €${totalPrice.toFixed(2)}

Itens:
${itemsList}
`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Obrigado pela tua compra!',
      text: emailUserText,
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      subject: 'Nova encomenda recebida',
      text: emailNotifyText,
    });

    res.status(200).json({ message: 'Emails enviados com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao enviar emails.');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));
