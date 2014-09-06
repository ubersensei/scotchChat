// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// load the auth variables
var configAuth = require('./auth');


var bcrypt   = require('bcrypt-nodejs');
var mysql = require('mysql');
var async = require('async');



var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
//    app.use(express.static(path.join(__dirname, 'public')));
    var client = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'tangent90'
    });
}
else {
    var client = mysql.createConnection({
                host: process.env.RDS_HOSTNAME,
                user: process.env.RDS_USERNAME,
                password: process.env.RDS_PASSWORD,
                port: process.env.RDS_PORT
    });
}


async.series([
    function connect(callback) {
        client.connect(callback);
    },
    function clear(callback) {
        client.query('DROP DATABASE IF EXISTS rum', callback);
    },
    function create_db(callback) {
        client.query('CREATE DATABASE rum', callback);
    },
    function use_db(callback) {
        client.query('USE rum', callback);
    },
    function create_table(callback) {

        client.query('CREATE TABLE IF NOT EXISTS `users` (' +
            '`id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,' +
            '`email` VARCHAR(150) DEFAULT NULL,' +
            '`password` VARCHAR(140) DEFAULT NULL,' +
            '`fb_id` VARCHAR(140) DEFAULT NULL,' +
            '`fb_token` VARCHAR(340) DEFAULT NULL,' +
            '`fb_name` VARCHAR(140) DEFAULT NULL,' +
            '`fb_email` VARCHAR(140) DEFAULT NULL,' +
            'PRIMARY KEY(ID))', callback);
    },
    function insert_default(callback) {
        var person = {
            EMAIL: 'neophyte-1234@gmail.com',
            PASSWORD: 'neo'};
        client.query('INSERT INTO users set ?', person, callback);
    }
], function (err, results) {
    if (err) {
        console.log('Exception initializing database.');
        throw err;
    } else {
        console.log('Database initialization complete.');
        //        init();
    }
});



//client.query('USE scotch'); // scotch is the name of the database


// define the function directly
generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// define the function directly
validPassword = function(password, db_password) {
    return bcrypt.compareSync(password, db_password);
};


// expose this function to our app using module.exports
module.exports = function(passport) {


    function mysql_findById(id, fn) {
        client.query("select * from users where users.id = ?", id, function(err,rows){
            if (err) {
                fn(new Error('User ' + id + ' does not exist'));

            } else {
                fn(null, rows[0]);
            }
        });
    }

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        mysql_findById(id, function(err, user) {
            done(err, user);
        });
    });

    // LOCAL sign-up
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                client.query("select * from users where email = '" + email + "'", function(err,rows){

                    // if there are any errors, return the error
                    if (err) {
                        return done(err);
                    }

                    // check to see if there's already a user with that email
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // if there is no user with that email
                        // create the user
                        var newUserMysql = {};
                        newUserMysql.email    = email;
                        newUserMysql.password = generateHash(password);

                        client.query('INSERT INTO users set ?', newUserMysql , function(err,rows){
                            console.log("inserted a new user with id: " + rows.insertId);
                            newUserMysql.id = rows.insertId;
                            return done(null, newUserMysql);
                        });
                    }
                });



            });

        }));


    // Local login
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            client.query("select * from users where email = '" + email + "'",function(err,rows){
                // if there are any errors, return the error before anything else
                if (err) {
//                    console.log("major error here");
                    return done(err);
                }

                // if no user is found, return the message
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if user is found, but the password is wrong
                if ( !validPassword(password, rows[0].password)) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                }

                // all is well, return successful user
                return done(null, rows[0]);

            });


        }));


    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

            // pull in our app id and secret from our auth.js file
            clientID        : configAuth.facebookAuth.clientID,
            clientSecret    : configAuth.facebookAuth.clientSecret,
            callbackURL     : configAuth.facebookAuth.callbackURL

        },

        // facebook will send back the token and profile
        function(token, refreshToken, profile, done) {

            // asynchronous
            process.nextTick(function() {

                // find the user in the database based on their facebook id
                client.query("select * from users where fb_id = '" + profile.id + "'",function(err,rows){

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err) {
                        return done(err);
                    }

                    // if user found, then log them in
                    if (rows.length) {
                        return done(null, rows[0]); // user found, return that user
                    } else {

                        // if there is no user found with that facebook id, create them
                        var newUserMysql = {};

                        newUserMysql.fb_id    =  profile.id; // set the users facebook id
                        newUserMysql.fb_token =  token; // we will save the token that facebook provides to the user
                        newUserMysql.fb_name  =  profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                        newUserMysql.fb_email =  profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                        client.query('INSERT INTO users set ?', newUserMysql , function(err,rows){

                            if (err) {
                                throw err;
                            }

                            // if successful, return the new user
                            newUserMysql.id = rows.insertId;
                            return done(null, newUserMysql);
                        });
                    }

                });
            });

        }));







};


