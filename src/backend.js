import express from 'express';
import path from 'path';
import Register from 'common/api/register';
import _ from 'lodash';

console.log('why? ' + __dirname);

const testFolder = __dirname;
const fs = require('fs');

fs.readdir(testFolder, (err, files) => {
    _.each(files, (file) => {
        console.log(file);
    })
});

const app = express();
app.use(express.static(path.resolve(path.join(__dirname, '../../dist'))));

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, '../../dist')});
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