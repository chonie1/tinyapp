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
  b6UTxQ: { longURL: "https://www.tsn.ca", userId: "userRandomID"},
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

const urlAnalytics = {
  b6UTxQ: [{visitorId: 123, time:'some time'}, {visitorId:123, time:'some other time'}],
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

  if (!urlDatabase[shortURL]) {
    res.status('404').send('Page does not exist!');
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

  const shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL]['longURL'];

  if (!longURL) {
    res.status(404).send('Invalid URL');
    return;
  }

  //appends https protocol if protocol is not specified 
  const splitURL = longURL.split('/:///');
  if (splitURL.length < 2) {
    longURL = 'https://' + longURL;
  }

  //updates analytics
  const timestamp = new Date()
  timestamp.toLocaleString;

  if(!req.session.visitor_id){
    req.session.visitor_id = generateRandomString();
  }
  
  urlAnalytics[shortURL].push({
    visitorId: req.session.visitor_id,
    time: timestamp
  })

  console.log(urlAnalytics)
  
  res.redirect(301, longURL);
});

// post requests
// generates a new short URL in the urlDatabase
app.post('/urls',(req,res)=>{

  const userId = req.session.user_id;
  
  if (!userId) {
    res.status(403).send('Must be logged in!');
    return;
  }
  
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    'longURL': req.body.longURL,
    'userId': userId
  };

  urlAnalytics[shortURL] = [];

  res.redirect(`/urls/${shortURL}`);
});


app.post('/login',(req, res)=>{
  const { email, password } = req.body;
  
  if (!password || !email) {
    res.status(400).send('Missing email/password field(s)!');
    return;
  }
  
  const user = getUserByEmail(email, users);
  
  if (!user) {
    res.status(403).send('Email not found!');
    return;
  }
  
  const hashedPass = user['password'];
  
  if (!bcrypt.compareSync(password, hashedPass)) {
    res.status(403).send('Wrong password!');
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
  
  let email = req.body.email;
  let password = bcrypt.hashSync(req.body.password, 10);
  
  if (!password || !email) {
    res.status(400).send('Missing email/password field(s)!');
    res.redirect('register');
    return;
  }
  
  if (getUserByEmail(email, users)) {
    res.status(400).send('Email already in use!');
    res.redirect('register');
    return;
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

//put & delete requests
app.delete('/urls/:shortURL',(req,res)=>{

  if (!req.session.user_id) {
    res.status(403).send('Must be logged in!');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
  
});

app.put('/urls/:shortURL',(req,res)=>{

  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userId || urlDatabase[shortURL]['id'] !== userId) {
    res.status(403).send('Must be logged in!');
    return;
  }

  urlDatabase[shortURL]['longURL'] = req.body.longURL;

  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Server connect ${PORT}!`);
});