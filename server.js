// require('./dist/backend.js');

const express = require('express');
const path = require('path');
// import Register from 'common/api/register';

console.log('why? ' + __dirname);

const testFolder = __dirname;
const fs = require('fs');

fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
        console.log(file);
    })

})
const app = express();
app.use(express.static(path.resolve(path.join(__dirname, '../dist'))));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/api/register', (req, res) => {
    // Register.registerUser();
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});