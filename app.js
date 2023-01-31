//jshint esversion:6
require('dotenv').config();

const express    = require('express');
const bodyParser = require('body-parser');
const ejs        = require('ejs');

// Database Backend access
const mongoose   = require('mongoose');
//const encrypt    = require('mongoose-encryption');

// MD5 Hashing
//const md5        = require('md5');

const bcrypt       = require('bcrypt');

const saltRounds   = parseInt(process.env.SALT_ROUNDS);



mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://${process.env.AUTH_LOGIN}:${process.env.AUTH_PW}@${process.env.MONGO_DB_CLUSTER}.mongodb.net/userDB`,
                {useNewUrlParser: true});

const userSchema = mongoose.Schema({
  email: String,
  password: String
});

//  Set up the Mongoose encryption..
//userSchema.plugin(encrypt, {secret: process.env.DB_Secret, encryptedFields:['password']});

const userModel = mongoose.model('User', userSchema);

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
    // let email = req.body.username;
    // let pw    = req.body.password;
    //
    // console.log(`${email}, ${pw}`);
    bcrypt
      .hash(req.body.password, saltRounds)
      .then(hash => {
          // Store hash in your password DB.
          let newUser = new userModel({
            email:    req.body.username,
            password: hash
          });

          newUser
            .save()
            .then(doc => {
              res.render('secrets');
            })
            .catch(error => {
              res.send(error);
            });
      })
      .catch(error => {
        res.send(error);
      });
});

app.post('/login', (req, res) => {

    userModel
      .findOne({email: req.body.username})
      .then(foundDocument => {
        if (foundDocument)
        {
            bcrypt
              .compare(req.body.password, foundDocument.password)
              .then(result => {
                if (result === true)
                {
                  res.render('secrets');
                }
                else {
                  // Do something else when the password is incorrect..
                  res.send('<h1>No User with that Email/Password found!</h1>');
                }
              })
              .catch(error => {
                  res.send('<h1>No User with that Email/Password found!</h1>');
              });
        }
        else
        {
            res.send('<h1>No User with that Email/Password found!</h1>');
        }
      })
      .catch(error => {
          res.send(error);
      });

});


const PORT = process.env.PORT | 3000;

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}.`);
});
