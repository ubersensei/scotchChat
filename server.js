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
var socketHandshake = require('socket.io-handshake')

var redisHost = '127.0.0.1';
var redisPort = 6379;




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

app.use(session({
    name: 'jsessionid', // access using req.cookies['jsessionid']
    secret: 'secret',
    saveUninitialized: true, // avoids warning
    resave: true, // avoids warning
    store: sessionStore
}));


app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs'); // set up ejs for templating


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


var sub = redis.createClient(redisPort, redisHost);
var pub = redis.createClient(redisPort, redisHost);
sub.subscribe('chat-redis');

io.use(socketHandshake({store: sessionStore, key:'jsessionid', secret:'secret', parser:cookieParser()}));
io.on('connection', function (socket) {
    console.log('a new socket got connected');
    socket.on('join', function () {
        console.log(socket.handshake.session.user + ' joined');
        var reply = JSON.stringify({category:'join', user:socket.handshake.session.user, msg:' joined the channel' });
        pub.publish('chat-redis', reply);
    });
    socket.on('chat', function (message) {
        var chatMessage = JSON.parse(message);
        var content = chatMessage.msg;
        console.log(socket.handshake.session.user + ' published a chat message');
        var reply = JSON.stringify({category:'chat', user:socket.handshake.session.user, msg: content });
        pub.publish('chat-redis', reply);
    });
});

sub.on('message', function (channel, message) {
    io.emit('chat', message);
});


server.listen(port, function(){
    console.log('The magic happens on port ' + port);
});