// Include the cluster module
var cluster = require('cluster');
var request = require('request');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');

    AWS.config.region = process.env.REGION

    var sns = new AWS.SNS();
    var ddb = new AWS.DynamoDB();

    var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(bodyParser.urlencoded({extended:false}));

    var callGoogleAPI = (query, start) => {
    return new Promise((resolve, reject) => {
        const url = `https://www.googleapis.com/customsearch/v1?key=AIzaSyCgsswbMWwKaRU0DJHSlCPcU_ViKyGvbus&cx=002613651227514622369:do3zcslach8&q=${query}&start=${start}`
        request(url, (err, resp, body) => {
        if(err) reject(err);
        resolve(body);
    });
  });
}

    app.get('/', (req, resp) => {
      resp.send("Hello world");
    })

    app.get('/google', (req, resp) => {
      callGoogleAPI(req.param('q'), '1')
        .then((body) => {
          resp.send(JSON.stringify(body));
        })
    })

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}