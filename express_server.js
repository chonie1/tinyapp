const express = require('express')
const morgan = require('morgan')
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//view engine
app.set('view engine', 'ejs')

// middleware
app.use(morgan('dev')) //(req,res,next) => {}

// get requests
app.get("/", (req, res) => {
  res.send("Hello!"); 
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase
  }
  res.render('urls_index', templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[this.shortURL] 
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});