const GoogleStrategy = require('passport-google-oauth20/lib').Strategy;
const keys = require('../config/keys');
const User = require('../data/models/user.model');

const googleStrategy = new GoogleStrategy(
  {
    // options for google strategy
    clientID: keys.google.clientID,
    clientSecret: keys.google.clientSecret,
    callbackURL: '/api/auth/google/redirect',
  },
  (accessToken, refreshToken, email, done) => {
    // passport callback function
    // check if user already exists in our own db
    User.findOne({ googleId: email.id }).then(currentUser => {
      if (currentUser) {
        // already have this user
        console.log('user is: ', currentUser);
        done(null, currentUser);
      } else {
        // if not, create user in our db
        console.log('email', email);
        new User({
          _id: email.emails[0].value,
          googleId: email.id,
          name: email.displayName,
          avatar: email.photos[0].value,
          email: email.emails[0].value,
        })
          .save()
          .then(newUser => {
            console.log('created new user: ', newUser);
            done(null, newUser);
          });
      }
    });
  },
);

module.exports = googleStrategy;
