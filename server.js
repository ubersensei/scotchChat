// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var path = require('path');

var app = express();
var server = require('http').Server(app);



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

// set up our express application
app.use(morgan('dev')); // log every request to the console


require('./config/passport')(passport); // pass passport for configuration




/*
 Also use Redis for Session Store. Redis will keep all Express sessions in it.
 */
var rClient = redis.createClient(redisPort, redisHost);
var sessionStore = new RedisStore({client:rClient});

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

var sessionMiddleware = session({
    name: 'jsessionid', // access using req.cookies['jsessionid']
    secret: 'secret',
    saveUninitialized: true, // avoids warning
    resave: true, // avoids warning
    store: sessionStore
});


app.use(sessionMiddleware);


app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs'); // set up ejs for templating


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


var sub = redis.createClient(redisPort, redisHost);
var pub = redis.createClient(redisPort, redisHost);
sub.subscribe('chat-redis');


var io = require('socket.io').listen(server);


// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


app.get('/', function(req, res) {
    console.log(" New sessionid: " + req.sessionID + " and jsessionid: " + req.cookies['jsessionid']);

    // We do this addition check in case the server restarts
    // and if the browser is not closed, then if the user is loggedin
    // then you'd want to show the profile page
    if (req.isAuthenticated()) {

        console.log('whats in the session: req.session.passport.user >> ' + req.session.passport.user);

        res.redirect('/profile');
    } else {
        res.render('index.ejs'); // load the index.ejs file
    }
});


//app.get('/regenerateSession', function(req, res) {
//
//
//    var temp_user = req.user;
//
//    //Regenerate new session & store user from previous session (if it exists)
//    req.session.regenerate(function (err) {
//
//        if (err) {
//            console.log ("could not regenerate new session");
//        }
//
//        req.user = temp_user;
//        console.log(" Regenerated sessionid: " + req.sessionID + " and jsessionid: " + req.cookies['jsessionid']);
//
//        console.log('temp.user.id' + temp_user.id);
//
//        // We do this addition check in case the server restarts
//        // and if the browser is not closed, then if the user is loggedin
//        // then you'd want to show the profile page
//        if (req.isAuthenticated()) {
//            res.redirect('/profile');
//        } else {
//            res.render('index.ejs'); // load the index.ejs file
//        }
//    });
//
//});


//app.post('/regenSess', function(req, res, next) {
//
//    req.body.email = req.user.email;
//    req.body.password = req.user.password;
//
//    var user = req.user;
//
//    req.session.regenerate(function (err) {
//
//        if (err) {
//            console.log ("could not regenerate new session");
//        } else {
//
//            console.log("before passport.authenticate");
//            passport.authenticate('local-login', function(err, user, info) {
//                if (err) {
//                    console.log("inside passport.authenticate");
//                    return next(err)
//                }
//                if (!user) {
//                    console.log("did not find user");
//                    req.flash('error', info.message);
//                    return res.redirect('/login')
//                }
//                req.logIn(user, function(err) {
//                    if (err) { return next(err); }
//                    console.log("relogin was a grand success");
//                    //            return res.redirect('/profile'); // can send js payload too
//                });
//            })(req, res, next);
//
//        }
//    });
//
//});



app.post('/regenSess', function(req, res, next) {


//    req.session.regenerate(function (err) {
//
//        if (err) {
//            console.log ("could not regenerate new session");
//        } else {
//            passport.authenticate('local-login', function(err, user, info) {
//                if (err) { return next(err) }
//                if (!user) {
//                    req.flash('error', info.message);
//                    return res.redirect('/login')
//                }
//                req.logIn(user, function(err) {
//                    console.log(user);
//                    if (err) { return next(err); }
//                    // console.log('now logged in with req.session.passport.user: ' + req.session.passport.user);
//                    return res.redirect('/profile'); // can send js payload too
//                });
//            })(req, res, next);
//        }
//    });






    req.session.regenerate(function(err) {
        // will have a new session here
        req.body.email = "lev";
        req.body.password = "tolstoy";
    });


    passport.authenticate('local-login', function(err, user, info) {

        if (err) { return next(err) }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/login')
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
//            console.log('now logged in with req.session.passport.user: ' + req.session.passport.user);
            return res.redirect('/profile'); // can send js payload too
        });
    })(req, res, next);



});



io.use(function(socket,next){
    sessionMiddleware(socket.request, {}, next);
});


io.on('connection', function (socket) {

    var userId = socket.request.session.passport.user;

    console.log('a new socket got connected');
    console.log("Your User ID is", userId);

    socket.on('join', function () {
        console.log('userId: ' + userId + ' joined');
        var reply = JSON.stringify({category:'join', user:userId, msg:' joined the channel' });
        pub.publish('chat-redis', reply);
    });
    socket.on('chat', function (message) {
        var chatMessage = JSON.parse(message);
        var content = chatMessage.msg;
        console.log('userId: ' + userId + ' published a chat message');
        var reply = JSON.stringify({category:'chat', user:userId, msg: content });
        pub.publish('chat-redis', reply);
    });

});

sub.on('message', function (channel, message) {
    io.emit('chat', message);
});




//io.use(function(socket,next){
//    sessionMiddleware(socket.request, {}, next);
//});
//
//
//io.on('connection', function (socket, req) {
//
//    var userId = socket.request.session.passport.user;
//
//    console.log('a new socket got connected');
//    console.log("Your User ID is", userId);
//
//    socket.on('join', function () {
//        console.log('userId: ' + userId + ' joined');
//        var reply = JSON.stringify({category:'join', user:userId, msg:' joined the channel' });
//        pub.publish('chat-redis', reply);
//    });
//    socket.on('chat', function (message) {
//        var chatMessage = JSON.parse(message);
//        var content = chatMessage.msg;
//        console.log('userId: ' + userId + ' published a chat message');
//        var reply = JSON.stringify({category:'chat', user:userId, msg: content });
//        pub.publish('chat-redis', reply);
//    });
//
//});
//
//sub.on('message', function (channel, message) {
//    io.emit('chat', message);
//});


server.listen(port, function(){
    console.log('The magic happens on port ' + port);
});