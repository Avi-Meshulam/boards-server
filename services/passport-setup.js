const passport = require('passport/lib');
const User = require('../data/models/user.model');
const googleStrategy = require('./googleStrategy');
const localStrategy = require('./localStrategy');

passport.use(googleStrategy);
// passport.use('register',localStrategy);
