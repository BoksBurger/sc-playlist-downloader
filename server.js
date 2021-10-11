const express = require('express');
const download = require('./download.js');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' })
const app = express();
let bodyParser = require("body-parser");
global._progress = {Message: 'Wag so oomblik...', Progress: 0, Done: false};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('lib'));

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('index', { message: 'Plak jou skakel hier om te begin.' })
});

app.post('/', upload.none(), function (req, res) {
    console.log(req.body.url);
    URL = req.body.url;
    res.writeHead(200);
    res.end('Wag so oomblik...');
    download.getReady(req.body.url);


});
app.get('/progress', function (req, res) {
    res.send(global._progress);
});


app.listen(3000, function () {
    console.log('Diensheer luister...');
});