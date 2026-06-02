import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Backend running successfully' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${PORT}`);
});