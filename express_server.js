const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { response } = require('express');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//functions
function generateRandomString() {
  return Math.random().toString(36).substr(2,6);
}

function checkEmail(email) {
  for(const user of Object.values(users)){
    if (user.email === email) {
      return true;
    } 
  }
  return false;
}

//view engine
app.set('view engine', 'ejs');

// middleware
app.use(morgan('dev')); //(req,res,next) => {}
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// get requests
app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']]
  }
  res.render('register', templateVars)
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']]
  }
  res.render('login', templateVars)
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']],
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post('/urls',(req,res)=>{
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete',(req,res)=>{
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post('/urls/:shortURL',(req,res)=>{
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post('/login',(req, res)=>{
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});

app.post('/logout',(req, res)=>{
  res.clearCookie('userId');
  res.redirect('urls');
});

app.post('/register',(req, res)=>{

  let email = req.body.email;
  let password = req.body.password;

  if (!password || !email) {
    res.status(400)
    res.send('Missing email/password field!')
    res.redirect('register')
  }

  if (checkEmail(email)) {
    res.status(400)
    res.send('Email already in use!')
    res.redirect('register')
  }

  let userId = generateRandomString();
  users[userId] = {
    'id': userId,
    'email': email, 
    'password': password
  }
  console.log(users)
  res.cookie('userId', userId)
  res.redirect('urls')
})


app.listen(PORT, () => {
  console.log(`Server connect ${PORT}!`);
});