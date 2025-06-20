require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors({
  origin: 'https://tasselgroup.co.za/shop'
}));
app.use(express.json());

app.post('/api/yoco-charge', async (req, res) => {
  const { token, amountInCents } = req.body;
  try {
    const response = await fetch('https://online.yoco.com/v1/charges/', {
      method: 'POST',
      headers: {
        'X-Auth-Secret-Key': process.env.YOCO_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        amountInCents,
        currency: 'ZAR'
      })
    });
    const data = await response.json();
    if (data.status === 'successful') {
      res.json({ status: 'successful' });
    } else {
      res.json({ status: 'failed', message: data.message || 'Payment failed' });
    }
  } catch (err) {
    res.status(500).json({ status: 'failed', message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Yoco payment backend running on port ${PORT}`));