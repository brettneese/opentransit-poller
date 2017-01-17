require('dotenv').config();

const Poller = require('ft-poller'), 
      knox = require('knox'), 
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
const bucket = env.ENVIRONMENT + '.opentransit.' + env.PROVIDER
const s3 = new aws.S3({ apiVersion: '2006-03-01' }) 
s3.createBucket( {Bucket: bucket}, function (err, data) {
    if (err)
        console.log(err, err.stack) // an error occurred
    else {
        p.start()
    }
})

// Send data to s3
const sendToS3 = function (data) {
    var params = { Bucket: bucket, Key: Date.now() + ".json", Body: JSON.stringify(data) }
    
    s3.upload(params, function (err, data) {
        console.log(err, data)
    })

    console.log(data)
}

p.on('data', sendToS3)

// A simple status page
const requestHandler = (request, response) => {  
    if(request.url == '/ping'){
        response.end('pong')
    }
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})