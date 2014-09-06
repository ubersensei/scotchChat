// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var path = require('path');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);


var port = process.env.PORT || 8081;
var passport = require('passport');
var flash = require('connect-flash');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var redis = require("redis");
var RedisStore = require('connect-redis')(session);

var redisHost = '127.0.0.1';
var redisPort = 6379;


app.use(express.static(path.join(__dirname, 'public')));

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console


/*
 Also use Redis for Session Store. Redis will keep all Express sessions in it.
 */
var rClient = redis.createClient(redisPort, redisHost);
var sessionStore = new RedisStore({client:rClient});

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

app.use(session({
    name: 'jsessionid', // access using req.cookies['jsessionid']
    secret: 'secret',
    saveUninitialized: true, // avoids warning
    resave: true, // avoids warning
    store: sessionStore
}));

app.get('/', function(req, res) {
    console.log("New session with userName: " + req.session.user + " sessionid: " + req.sessionID + " and jsessionid: " + req.cookies['jsessionid']);
    res.render('index.ejs'); // load the index.ejs file
});


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
//app.listen(port);
//console.log('The magic happens on port ' + port);

server.listen(port, function(){
    console.log('The magic happens on port ' + port);
});