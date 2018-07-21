const express = require('express')
const app = express()
const https = require('https');
const http = require('http');
const port = process.env.PORT ? process.env.PORT : "443";
const fs = require('fs');
const sessions = require("./apis/sessions")
const fileApi = require("./apis/fileApi")
const fileViewer = require("./apis/fileViewer")
const emailExporter = require("./apis/emailExporter")
const themeApi = require("./apis/themes")
const merchantApi = require("./apis/merchant")
const helpApi = require("./apis/help")
const analyticsApi = require("./apis/analytics")
const externalApi = require("./apis/external_api")
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
var session = require('express-session')

// Certificate
const privateKey = fs.readFileSync('./server.key', 'utf8');
const certificate = fs.readFileSync('./server.crt', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
};


const CRUDapi = require("./db/api_connector")
    .BuildApiRouter();

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,token');
    next();
};

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
    //cookie: { secure: true }
}))


// Serve static website
app.use(
    "/",
    allowCrossDomain,
    express.static('../public'),
    fileViewer
);



app.use(bodyParser.urlencoded({
    limit: "20mb",
    extended: true
}));

app.use(bodyParser.json({ limit: "20mb" }));

app.use('/api',
    allowCrossDomain,
    sessions,
    externalApi
);

app.use('/api/res',
    CRUDapi,
    fileApi,
    emailExporter,
    themeApi,
    helpApi,
    merchantApi,
    analyticsApi
);

var appRedirector = express();

appRedirector.use((req, res, next) => {
    res.status(301).redirect(`https://storehub.gophersauce.com${req.originalUrl}`)
})

const httpServer = http.createServer(appRedirector);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => console.log("Up on port 80"));

httpsServer.listen(parseInt(port), () => {
    console.log('HTTPS Server running on port 443');
});