const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

const app = express()

app.set('view engine', 'ejs'); 

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

require('./routes')(app, axios);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });