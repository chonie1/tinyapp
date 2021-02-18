const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const {generateRandomString, getUserByEmail, getUsersURLs} = require('./helpers');
const app = express();
const PORT = 8080;

//Databases for testing
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userId: "userRandomID", timeCreated: "Thu Feb 18 2021 17:52:47 GMT+0000"},
  i3BoGr: { longURL: "https://www.google.ca", userId: "userRandomID", timeCreated: "Thu Feb 19 2021 17:52:47 GMT+0000" }
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

const urlAnalytics = {
  b6UTxQ: [{visitorId: 123, time:'Thu Feb 18 2021 17:52:47 GMT+0000'}, {visitorId:123, time:'Thu Feb 20 2021 17:52:47 GMT+0000'}],
  i3BoGr: [{visitorId: 456, time:'some time'}]
};

//setting up view engine and style sheets
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));

// override for put and delete methods
app.use(methodOverride('_method'));

// getting ip addresses
app.set('trust proxy', true);

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

//home page displaying user's urls
app.get("/urls", (req, res) => {
  
  const userId = req.session.user_id;

  if (!userId) {
    res.status(403).redirect('/login');
    return;
  }

  const userURLs = getUsersURLs(userId, urlDatabase);
  
  const templateVars = {
    user: users[userId],
    urls: userURLs
  };

  res.render('urls_index', templateVars);
});

//create a new short URL
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }

  res.render('urls_new', templateVars);
});

//short URL display page
app.get("/urls/:shortURL", (req, res) => {
  
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userId) {
    res.redirect('/login');
    return;
  }

  if (urlDatabase[shortURL]['userId'] !== userId) {
    req.session.error = 'Invalid User';
    req.session.status = 403;
    res.status(403).redirect('/apology');
  }

  if (!urlDatabase[shortURL]) {
    res.status(404).redirect('/apology');
    return;
  }

  const templateVars = {
    user: users[userId],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]['longURL'],
    urlData: urlAnalytics[shortURL],
  };

  res.render("urls_show", templateVars);
});

// short URL to long URL redirect page
app.get('/u/:shortURL', (req, res) => {

  const shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL]['longURL'];

  if (!longURL) {
    req.session.error = 'Invalid URL';
    req.session.status = 404;
    res.status(404).redirect('/apology');
    return;
  }

  //updates analytics
  const timestamp = new Date();
  const time = timestamp.toString().split('(')[0];

  if (!req.session.visitor_id) {
    req.session.visitor_id = generateRandomString();
  }
  
  urlAnalytics[shortURL].push({
    visitorId: req.ip,
    time: time
  });

  res.redirect(302, longURL);
});

//In case there is an error
app.get('*', function(req, res) {

  const templateVars = {
    error: req.session.error,
    status: req.session.status
  };
  
  delete req.session.error;
  delete req.session.status;

  res.render('apology', templateVars);
});

// post requests
// generates a new short URL in the urlDatabase
app.post('/urls',(req,res)=>{

  const userId = req.session.user_id;
  
  if (!userId) {
    req.session.error = 'Must be logged in';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }
  
  const shortURL = generateRandomString();
  const timestamp = new Date();
  const time = timestamp.toString().split('(')[0];

  urlDatabase[shortURL] = {
    'longURL': req.body.longURL,
    'userId': userId,
    'timeCreated': time
  };

  urlAnalytics[shortURL] = [];

  res.redirect(`/urls/${shortURL}`);
});


app.post('/login',(req, res)=>{
  const { email, password } = req.body;
  
  if (!password || !email) {
    req.session.error = 'Missing email or password field(s)';
    req.session.status = 400;
    res.status(400).redirect('/apology');
    return;
  }
  
  const user = getUserByEmail(email, users);
  
  if (!user) {
    req.session.error = 'Email not found';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }
  
  const hashedPass = user['password'];
  
  if (!bcrypt.compareSync(password, hashedPass)) {
    req.session.error = 'Wrong password';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }
  
  req.session.user_id = user.id;
  res.redirect('urls');
});

app.post('/logout',(req, res)=>{
  req.session.user_id = null;
  res.redirect('urls');
});

app.post('/register',(req, res)=>{
  
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  
  if (!password || !email) {
    req.session.error = 'Missing email or password field(s)';
    req.session.status = 400;
    res.status(400).redirect('/apology');
    return;
  }
  
  if (getUserByEmail(email, users)) {
    req.session.error = 'Email already in use';
    req.session.status = 400;
    res.status(400).redirect('/apology');
    return;
  }
  
  const userId = generateRandomString();
  users[userId] = {
    'id': userId,
    'email': email,
    'password': password
  };
  
  req.session.user_id =  userId;
  res.redirect('urls');
});

//put & delete requests
app.delete('/urls/:shortURL',(req,res)=>{

  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userId) {
    req.session.error = 'Must be logged in';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }

  if (urlDatabase[shortURL]['userId'] !== userId) {
    req.session.error = 'Wrong User';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
  
});

app.put('/urls/:shortURL',(req,res)=>{

  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userId || urlDatabase[shortURL]['userId'] !== userId) {
    req.session.error = 'Must be logged in';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }
  
  if (urlDatabase[shortURL]['userId'] !== userId) {
    req.session.error = 'Wrong User';
    req.session.status = 403;
    res.status(403).redirect('/apology');
    return;
  }

  urlDatabase[shortURL]['longURL'] = req.body.longURL;
  urlAnalytics[shortURL] = [];

  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Server connect ${PORT}!`);
});