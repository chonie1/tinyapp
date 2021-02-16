function generateRandomString() {
  return Math.random().toString(36).substr(2,6);
}

function getUserByEmail(email, database) {
  for (const user of Object.values(database)) {
    if (user.email === email) {
      return user;
    }
  }
}

function urlForUser(id) {
  const userURLs = {};
  
  for (let url in urlDatabase) {
    if (urlDatabase[url]['userId'] === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
}

module.exports = {
  generateRandomString,
  getUserByEmail,
};