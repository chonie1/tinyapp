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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});