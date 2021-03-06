// used to generate random user id, visitor id and shortURL
function generateRandomString() {
  return Math.random().toString(36).substr(2,6);
}

// verify user exists in database
function getUserByEmail(email, database) {
  return Object.values(database).find(user => user.email === email);
}

// returns that user's URLs in a new object
function getUsersURLs(id, database) {
  const userURLs = {};
  
  for (let url in database) {
    if (database[url]['userId'] === id) {
      userURLs[url] = database[url];
    }
  }
  return userURLs;
}

module.exports = {
  generateRandomString,
  getUserByEmail,
  getUsersURLs
};