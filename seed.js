// seed.js
const bcrypt = require('bcryptjs');

// The plain text password we want to use for testing
const plainPassword = 'Password123'; 

// Generate the hash (10 is the standard security salt rounds)
bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) throw err;
  console.log('--- COPY THIS HASH BELOW ---');
  console.log(hash);
  console.log('----------------------------');
});