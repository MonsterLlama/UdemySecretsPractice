//jshint esversion:6
require('dotenv').config();

const express    = require('express');
const bodyParser = require('body-parser');
const ejs        = require('ejs');


// Database Backend access
const mongoose   = require('mongoose');
//const encrypt    = require('mongoose-encryption');

// MD5 Hashing
// const md5          = require('md5');

// const bcrypt       = require('bcrypt');
// const saltRounds   = parseInt(process.env.SALT_ROUNDS);

const session               = require('express-session');
const passport              = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

// console.log(typeof(express)); // function
// console.log(typeof(app));     // function
// console.log(app);
// console.log(express.static);
// console.log(express.static('public'));

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

// Tell express.js to use passport and use passport to deal with the sessions
app.use(passport.initialize());
app.use(passport.session());

//console.log(typeof(mongoose));

mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://${process.env.AUTH_LOGIN}:${process.env.AUTH_PW}@${process.env.MONGO_DB_CLUSTER}.mongodb.net/userDB`,
                {useNewUrlParser: true});

const userSchema = mongoose.Schema({
    email:    String,
    password: String
});

//  Set up the Mongoose encryption..
//userSchema.plugin(encrypt, {secret: process.env.DB_Secret, encryptedFields:['password']});

// Setup the Passport-Local-Mongoose
// passportLocalMongoose is what we're going to use to hash and salt our passwords
// and to save our users into our MongoDB database.
userSchema.plugin(passportLocalMongoose);

const userModel = mongoose.model('User', userSchema);

passport.use(userModel.createStrategy());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());



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

app.post('/login', (req, res) => {

  let user = new userModel({
    username: req.body.username,
    password: req.body.password
  });

  console.log(user);

  req.login(user, error => {
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

//console.log(app);

// app.post('/register', (req, res) => {
    //    - - - Example of using node.js.bcrypt - - -
    // bcrypt
    //   .hash(req.body.password, saltRounds)
    //   .then(hash => {
    //       // Store hash in your password DB.
    //       let newUser = new userModel({
    //         email:    req.body.username,
    //         password: hash
    //       });
    //
    //       newUser
    //         .save()
    //         .then(doc => {
    //           res.render('secrets');
    //         })
    //         .catch(error => {
    //           res.send(error);
    //         });
    //   })
    //   .catch(error => {
    //     res.send(error);
    //   });
    // });

    // app.post('/login', (req, res) => {
    //
    //     userModel
    //       .findOne({email: req.body.username})
    //       .then(foundDocument => {
    //         if (foundDocument)
    //         {
        //    - - - Example of using node.js.bcrypt - - -
    // bcrypt
    //   .compare(req.body.password, foundDocument.password)
    //   .then(result => {
    //     if (result === true)
    //     {
    //       res.render('secrets');
    //     }
    //     else {
    //       // Do something else when the password is incorrect..
    //       res.send('<h1>No User with that Email/Password found!</h1>');
    //     }
    //   })
    //   .catch(error => {
    //       res.send('<h1>No User with that Email/Password found!</h1>');
    //   });
//     }
//     else
//     {
//         res.send('<h1>No User with that Email/Password found!</h1>');
//     }
//   })
//   .catch(error => {
//       res.send(error);
//   });
//
// });


    // userModel
      // .findOne({email: req.body.username})
      // .then(foundDocument => {
      //   if (foundDocument)
      //   {
      //   }
      //   else
      //   {
      //       res.send('<h1>No User with that Email/Password found!</h1>');
      //   }
      // })
      // .catch(error => {
      //     res.send(error);
      // });
