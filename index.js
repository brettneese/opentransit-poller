process.env.TZ = 'UTC' 
require('dotenv').config();

const Poller = require('ft-poller'), 
      aws = require('aws-sdk'),
      http = require('http'), 
      port = 8080,
      env = process.env

// Set up the poller 
const p = new Poller({
      url: env.PROVIDER_API_ROOT,
      refreshInterval: env.PROVIDER_REFRESH_INTERVAL
})

// Create the bucket if it does not exist, and start the poller 
const bucket = 'com.opentransit.' + env.ENVIRONMENT + '.' + env.PROVIDER
const s3 = new aws.S3({ apiVersion: '2006-03-01' }) 
s3.createBucket( {Bucket: bucket}, function (err, data) {
    if (err) {
        console.log(err, err.stack) // an error occurred
        process.exit(1);
    }

    else {
        p.start()
    }
})

// Send data to s3
const sendToS3 = function (data) {

    var date = new Date(Date.now()),
        millisecond = date.getUTCMilliseconds(),
        second = date.getUTCSeconds(),
        minute = date.getUTCMinutes(),
        hour = date.getUTCHours(),
        day = date.getUTCDate(),
        month = date.getUTCMonth(),
        year = date.getUTCFullYear(),
        key = [year, month, day, hour, minute, second, millisecond].join("/") + ".json"

    s3.upload({ Bucket: bucket, Key: key, Body: JSON.stringify(data)}, function (err, data) {
        console.log(err, data)
    })

    console.log('data added')
}

const error = function(error){
    console.log(error);
    return process.exit(1);
}

p.on('data', sendToS3)
p.on('error', error)

// A simple status page
const requestHandler = (request, response) => {  
    if(request.url == '/ping'){
        response.end('pong')
    }
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {  
  if (err) {
    console.log('something bad happened', err)
    return process.exit(1);
  }

  console.log(`server is listening on ${port}`)
})
