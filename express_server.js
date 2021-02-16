const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { response } = require('express');
const app = express();
const PORT = 8080;

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userId: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userId: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "password"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//functions
function generateRandomString() {
  return Math.random().toString(36).substr(2,6);
}

function checkEmail(email) {
  for (const user of Object.values(users)) {
    if (user.email === email) {
      return user.id;
    }
  }
  return false;
}

function urlForUser(id) {
  const userURLs = {}
  
  for(let url in urlDatabase) {
    if (urlDatabase[url]['userId'] === id) {
      userURLs[url] = urlDatabase[url]
    }
  }
  return userURLs
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
  };
  res.render('register', templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']]
  };
  res.render('login', templateVars);
});

app.get("/urls", (req, res) => {
  
  const userId = req.cookies['userId']

  if(!userId) {
    res.status
    res.redirect('/login')
  }

  const userURLs = urlForUser(userId)
  
  const templateVars = {
    user: userId,
    urls: userURLs
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.cookies['userId']],
  };
  

  if (!req.cookies['userId']) {
    res.redirect('/login')
  }

  res.render('urls_new', templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  
  const userId = req.cookies['userId']

  if (!req.cookies['userId']) {
    res.redirect('/login')
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

  const userId = req.cookies['userId']

  if(!userId) {
    res.status(403).send('Must be logged in!')
    res.redirect('/login')
  }
  
  console.log(req.body)
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    'longURL': req.body.longURL,
    'userId': userId
  }

  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete',(req,res)=>{

  if(!req.cookies['userId']) {
    res.status(403).send('Must be logged in!')
    res.redirect('/login')
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
  

});

app.post('/urls/:shortURL',(req,res)=>{

  if(!req.cookies['userId']) {
    res.status(403).send('Must be logged in!')
    res.redirect('/login')
  }

  urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/login',(req, res)=>{
  let email = req.body.email;
  let password = req.body.password;

  if (!password || !email) {
    res.status(400);
    res.send('Missing email/password field(s)!');
    res.redirect('/login');
  }

  const userId = checkEmail(email);

  if (!userId) {
    res.status(403);
    res.send('Email not found!');
  }

  if (users[userId]['password'] !== password) {
    res.status(403);
    res.send('Wrong password!');
  }

  res.cookie('userId', userId);
  res.redirect('urls');
});

app.post('/logout',(req, res)=>{
  res.clearCookie('userId');
  res.redirect('urls');
});

app.post('/register',(req, res)=>{

  let email = req.body.email;
  let password = req.body.password;

  if (!password || !email) {
    res.status(400);
    res.send('Missing email/password field(s)!');
    res.redirect('register');
  }

  if (checkEmail(email)) {
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

  res.cookie('userId', userId);
  res.redirect('urls');
});


app.listen(PORT, () => {
  console.log(`Server connect ${PORT}!`);
});