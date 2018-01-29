
// init project
var express = require('express')
var app = express()
app.use(express.static('public'))

var validUrl = require('valid-url')

// init database
var mongo = require('mongodb')
var MongoClient = mongo.MongoClient

// Database address
var url = 'mongodb://sgomezpaz:mongodburlshortenerfcc@ds117868.mlab.com:17868/urlshortenerfcc'

// APP usage
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html')
})

// Creation of shortened URL
app.get("/new/:url(*)", function(req, res) {
  var urlToShorten = req.params.url
  // Check if URL follows valid format
  if(validUrl.isUri(urlToShorten)) {
    // Insert into database
    MongoClient.connect(url, function(err, client) {
      if (err) throw err;
      // Get db and collection
      var dbo = client.db("urlshortenerfcc")
      var urls = dbo.collection("urls")
      // Look for URL in db
      urls.find({
        url: urlToShorten
      }).toArray(function(err, docs) {
        if(err) throw err
        if(docs[0]==null) {
          // Insert if new
          urls.count({}, function(err, count){
            if(err) throw err
            var obj = { 
              number: parseInt(count.toString()), 
              url: urlToShorten 
            }
            urls.insert(obj, function(err, data) {
              if (err) throw err
              var json = { 
                original_url: urlToShorten, 
                short_url: "hhttps://fcodec-urlshortener.glitch.me/" + data.ops[0].number 
              }
              res.send(json)
              client.close()
            })
          })
        } else {
          var json = { 
            original_url: urlToShorten, 
            short_url: "hhttps://fcodec-urlshortener.glitch.me/" + docs[0].number 
          }
          res.send(json)
          client.close()
        }
      })
    })
  } else {
    res.send({error: "Not valid URL format"})
  }
})

// Redirect shortened URL
app.get("/:number", function(req, res) {
  var number = parseInt(req.params.number)
  MongoClient.connect(url, function(err, client) {
    // Get db and collection
    var dbo = client.db("urlshortenerfcc")
    var urls = dbo.collection("urls")
    urls.find({
      number: number
    }).toArray(function(err, docs) {
      if(err) throw err
      // Check for URL in database
      if(docs[0]==null) {
        res.send({error: "This URL is not in the database"})
      } else {
        // Redirect to shortened URL
        res.redirect(docs[0].url)
      }
      client.close()
    })
  })
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})
