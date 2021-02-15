const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//functions
function generateRandomString() {
  return Math.random().toString(36).substr(2,6)
}

//view engine
app.set('view engine', 'ejs')

// middleware
app.use(morgan('dev')) //(req,res,next) => {}
app.use(bodyParser.urlencoded({extended: true}))

// get requests
// app.get("/", (req, res) => {
//   res.send("Hello!"); 
// });

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase
  }
  // console.log(req.body)
  // res.send('ok')
  res.render('urls_index', templateVars)
});

app.get('/urls/new', (req,res) => {
  res.render('urls_new')
})

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] 
  };
  res.render("urls_show", templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL])
})

app.post('/urls',(req,res)=>{
  let shortURL = generateRandomString()
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`/urls/${shortURL}`)
})

app.post('/urls/:shortURL/delete',(req,res)=>{
  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls`)
})

app.post('/urls/:shortURL',(req,res)=>{
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect(`/urls`)
})

app.listen(PORT, () => {
  console.log(`Server connect ${PORT}!`);
});