// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        clientID: '584905071551247',
        clientSecret: '466282c16cced1b52b195b4c1a380894',
//        'callbackURL' 	: 'http://localhost:8080/auth/facebook/callback'
        'callbackURL' 	: 'http://elb-env-zbtykgwvjp.elasticbeanstalk.com/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey' 		: '0lqPUWqVoQrnXw8WCENLnoklT',
        'consumerSecret' 	: '99n5g0s2dAFHyYCkJjENLnV5TEr5E5h7ngfUttUVdVtem7u6zW',
        'callbackURL' 		: 'http://127.0.0.1:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID' 		: '73235073607-j763j82gsean3dh66nghbtlso2nluctk.apps.googleusercontent.com',
        'clientSecret' 	: '3gIIxJQ99QgE_kN9D1cMTPUx',
        'callbackURL' 	: 'http://127.0.0.1:8080/auth/google/callback'
    }

};