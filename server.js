var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file

var users = [
    {_id:"ABCD", name:"Saul Goodman", password:"money", admin:true},
    {_id:"BCDE", name:"James Bond", password:"excitement", admin:true},
    {_id:"CDEF", name:"Homer Simpson", password:"beer", admin:false}
    ];
    // modules
var static = require( 'node-static' );


// config
var file = new static.Server( './public', {
    cache: 3600,
    gzip: true
} );

// configuration =========
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
app.set('secret-key', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// routes ================
app.get('/', function(req, res) {
     //Lets serve up some "vanilla" html.
     file.serve( req, res );
});

// API ROUTES -------------------
var apiRoutes = express.Router(); 

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/noauth', function(req, res) {
  res.json({ message: "This is a message from your server, no auth was required" });
});

apiRoutes.post('/auth', function(req, res) {
    var authenticated = false;
    var i = 0;
    
    while (i < users.length) {
        if( users[i].name === req.body.name && users[i].password === req.body.password){
            authenticated = true;
            break;
        }
        i++;
    }
    
        
    if(authenticated){
         var token = jwt.sign(users[i], app.get('secret-key'), { algorithm: 'HS256' }) ;
         // return the information including token as JSON
         res.json({
                success: true,
                message: 'Enjoy your token!',
                token: token
         });
     }else{
         res.json({ success: false, message: 'Authentication failed.' });
     }
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('secret-key'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;  
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
    console.log("Request after middle ware:" + JSON.stringify(req.decoded));
    res.json({ success: true, message: 'Here are the users', users: users});
});   

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// start the server ======
app.listen(port);
console.log('Server started at http://localhost:' + port);