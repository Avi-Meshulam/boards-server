const LocalStrategy = require('passport-local').Strategy;
const User = require('../data/models/user.model');

const localStrategy = {};
// const localStrategy = new LocalStrategy({}
// {
//   usernameField: 'username',
//   passwordField: 'password',
//   passReqToCallback: true,
//   session: false,
// },
// (req, username, password, done) => {
//   console.log(username);
//   console.log(req.body.email);
//
//   try {
//     User.findOne({
//       where: {
//         [Op.or]: [
//           {
//             username,
//           },
//           { email: req.body.email },
//         ],
//       },
//     }).then(user => {
//       if (user != null) {
//         console.log('username or email already taken');
//         return done(null, false, {
//           message: 'username or email already taken',
//         });
//       }
//       bcrypt.hash(password, BCRYPT_SALT_ROUNDS).then(hashedPassword => {
//         User.create({
//           username,
//           password: hashedPassword,
//           email: req.body.email,
//         }).then(user => {
//           console.log('user created');
//           return done(null, user);
//         });
//       });
//     });
//   } catch (err) {
//     return done(err);
//   }
// },
// );

module.exports = localStrategy;
