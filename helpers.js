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