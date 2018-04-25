import express from 'express';
import Register from 'common/api/register';

const app = express();
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname});
});

app.get('/api/register', (req, res) => {
    Register.registerUser();
    res.json('{}');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});