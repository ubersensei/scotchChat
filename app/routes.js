// app/routes.js
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
//    app.get('/', function(req, res) {
//        console.log(" New sessionid: " + req.sessionID + " and jsessionid: " + req.cookies['jsessionid']);
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



//    app.get('/regenerateSession', function(req, res) {
//
//        var temp_user = req.user;
//
//        //Regenerate new session & store user from previous session (if it exists)
//        req.session.regenerate(function (err) {
//            req.user = temp_user;
//            console.log(" Regenerated sessionid: " + req.sessionID + " and jsessionid: " + req.cookies['jsessionid']);
//            // We do this addition check in case the server restarts
//            // and if the browser is not closed, then if the user is loggedin
//            // then you'd want to show the profile page
//            if (req.isAuthenticated()) {
//                res.redirect('/profile');
//            } else {
//                res.render('index.ejs'); // load the index.ejs file
//            }
//        });
//
//    });





    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });


    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) { return next(err) }
            if (!user) {
                req.flash('error', info.message);
                return res.redirect('/login')
            }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/profile'); // can send js payload too
            });
        })(req, res, next);
    });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });



    app.post('/signup', function(req, res, next) {

        passport.authenticate('local-signup', function(err, user, info) {
            if (err) { return next(err) }
            if (!user) {
                req.flash('error', info.message);
                return res.redirect('/signup')
            }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/profile'); // can send js payload too
            });
        })(req, res, next);
    });


    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });


    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
