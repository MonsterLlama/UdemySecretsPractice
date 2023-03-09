//jshint esversion:6
require('dotenv').config();

const express    = require('express');
const bodyParser = require('body-parser');
const ejs        = require('ejs');

// Database Backend access
const mongoose   = require('mongoose');

const session               = require('express-session');
const passport              = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const findOrCreate          = require('mongoose-findorcreate');

// From: https://www.passportjs.org/packages/passport-google-oauth20/#configure-strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Tell express.js to use our session package
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false}
  }));

// Tell express.js to use passport and to use passport to deal with the sessions
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://${process.env.AUTH_LOGIN}:${process.env.AUTH_PW}@${process.env.MONGO_DB_CLUSTER}.mongodb.net/userDB`,
                {useNewUrlParser: true});

const userSchema = mongoose.Schema({
    email:    String,
    password: String
});

// Setup the Passport-Local-Mongoose
// passportLocalMongoose is what we're going to use to hash and salt our passwords
// and to save our users into our MongoDB database.
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

const userModel = mongoose.model('User', userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// From: https://www.passportjs.org/packages/passport-google-oauth20/#configure-strategy
passport.use(new GoogleStrategy({
    clientID:     OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    callbackURL:  "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/secrets', (req, res) => {

  if (req.isAuthenticated()){
    res.render('secrets');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {

  req.logout(function(err) {
    if (err) {
      res.send(err);
   }
   else
   {
      res.redirect('/');
   }
  });
});

app.post('/register', (req, res) => {
    // let email = req.body.username;
    // let pw    = req.body.password;
    //
    // console.log(`${email}, ${pw}`);
    userModel
      .register({
                  username:req.body.username
                },
                req.body.password
      )
      .then(user => {
        passport
          .authenticate('local')(req, res, () => {
            console.log('username: ', user.username);
            res.redirect('/secrets');
          });
      })
      .catch(error => {
        res.send(error);
      });
});

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  (req, res) => {

    let user = new userModel({
      username: req.body.username,
      password: req.body.password
    });

    console.log(user);

    req.login(
      user,
      error => {
        if (error) {
          res.send('<h1>Error logging in!</h1><br />' +  error);
        }
        else
        {
          passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
        });
      }
    });
});


const PORT = process.env.PORT | 3000;

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}.`);
});
