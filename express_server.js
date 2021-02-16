const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {generateRandomString, getUserByEmail} = require('./helpers');
const app = express();
const PORT = 8080;

//Databases for testing
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userId: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userId: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync('password', 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk",10)
  }
};

function urlForUser(id) {
  const userURLs = {};
  
  for (let url in urlDatabase) {
    if (urlDatabase[url]['userId'] === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
}

//setting up view engine and style sheets
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// middleware
app.use(morgan('dev')); //(req,res,next) => {}
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));

// get requests
app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render('register', templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render('login', templateVars);
});

app.get("/urls", (req, res) => {
  
  const userId = req.session.user_id;

  if (!userId) {
    res.status;
    res.redirect('/login');
  }

  const userURLs = urlForUser(userId);
  
  const templateVars = {
    user: users[userId],
    urls: userURLs
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  

  if (!req.session.user_id) {
    res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  
  const userId = req.session.user_id;

  if (!req.session.user_id) {
    res.redirect('/login');
  }
  
  const templateVars = {
    user: users[userId],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]['longURL']
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]['longURL']);
});

app.post('/urls',(req,res)=>{

  const userId = req.session.user_id;

  if (!userId) {
    res.status(403).send('Must be logged in!');
    res.redirect('/login');
  }
  
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    'longURL': req.body.longURL,
    'userId': userId
  };

  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete',(req,res)=>{

  if (!req.session.user_id) {
    res.status(403).send('Must be logged in!');
    res.redirect('/login');
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
  
});

app.post('/urls/:shortURL',(req,res)=>{

  if (!req.session.user_id) {
    res.status(403).send('Must be logged in!');
    res.redirect('/login');
  }

  urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post('/login',(req, res)=>{
  let email = req.body.email;
  let password = req.body.password;

  if (!password || !email) {
    res.status(400);
    res.send('Missing email/password field(s)!');
    res.redirect('/login');
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    res.status(403);
    res.send('Email not found!');
  }

  const hashedPass = user['password'];

  if (!bcrypt.compareSync(password, hashedPass)) {
    res.status(403);
    res.send('Wrong password!');
  }

  req.session.user_id = user.id;
  res.redirect('urls');
});

app.post('/logout',(req, res)=>{
  req.session.user_id = null;
  res.redirect('urls');
});

app.post('/register',(req, res)=>{

  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, 10);

  if (!password || !email) {
    res.status(400);
    res.send('Missing email/password field(s)!');
    res.redirect('register');
  }

  if (getUserByEmail(email, users)) {
    res.status(400);
    res.send('Email already in use!');
    res.redirect('register');
  }

  let userId = generateRandomString();
  users[userId] = {
    'id': userId,
    'email': email,
    'password': password
  };

  req.session.user_id =  userId;
  res.redirect('urls');
});


app.listen(PORT, () => {
  console.log(`Server connect ${PORT}!`);
});