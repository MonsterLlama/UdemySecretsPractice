//jshint esversion:6
const express    = require('express');
const bodyParser = require('body-parser');
const ejs        = require('ejs');

// Database Backend access
const mongoose   = require('mongoose');
const encrypt    = require('mongoose-encryption');

require('dotenv').config();


mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://MonsterLlama:qiacI8ZHXLfxAJrU@cluster0.4umfurm.mongodb.net/userDB',
                {useNewUrlParser: true});

const userSchema = mongoose.Schema({
  email: String,
  password: String
});

//  Set up the Mongoose encryption..
userSchema.plugin(encrypt, {secret: process.env.DB_Secret, encryptedFields:['password']});

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

    let newUser = new userModel({
      email:    req.body.username,
      password: req.body.password
    });

    newUser
      .save()
      .then(doc => {
        console.log(doc);
        res.render('secrets');
      })
      .catch(error => {
        console.log(error);
      });
});

app.post('/login', (req, res) => {

    userModel
      .findOne({email: req.body.username})
      .then(foundDocument => {

        console.log(foundDocument);

        if (foundDocument)
        {
            if(req.body.password === foundDocument.password){
              res.render('secrets');
            }
            else {
              console.log('Wrong Password!');
            }
        }
        else
        {
            console.log('No User with that Email/Password found!');
        }
      })
      .catch(error => {
          console.log(error);
      });

});


const PORT = process.env.PORT | 3000;

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}.`);
});
