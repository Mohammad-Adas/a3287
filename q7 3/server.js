const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');

// This is the path to your pet information file
const petsFilePath = path.join(__dirname, 'pets.txt'); 
const app = express();

// app.use((req, res, next) => {
//   if (!req.session.loggedIn && req.path !== '/login' && req.path !== '/signup' && req.path !== '/logout') {
//       return res.redirect('/login');
//   }
//   next();
// });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with a secure secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // For development; set to true if using HTTPS
}));

const usersFile = path.join(__dirname, 'users.txt');

// Render Signup Page
app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

app.post('/submit-pet', (req, res) => {
  if (!req.session.loggedIn) {
      return res.redirect('/login');
  }

  const username = req.session.username;
  const { Type, breed, age, Gender, suitability, comment, first_name, last_name, email } = req.body;

  // Read the existing pet information file to find the next ID
  fs.readFile(petsFilePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading pets file:', err);
          return res.status(500).send('Server error');
      }

      // Calculate the next ID
      let nextId = 1;
      if (data.trim()) {
          const lastLine = data.trim().split('\n').pop();
          const lastId = parseInt(lastLine.split(':')[0]);
          nextId = lastId + 1;
      }

      // Format the pet information
      const petInfo = [
          nextId,
          username,
          Type,
          breed,
          age,
          Gender,
          suitability || '',
          comment,
          first_name,
          last_name,
          email
      ].join(':');

      // Append the new pet info to the file
      fs.appendFile(petsFilePath, petInfo + '\n', (err) => {
          if (err) {
              console.error('Error writing to pets file:', err);
              return res.status(500).send('Server error');
          }

          res.send('Pet information submitted successfully!');
      });
  });
});


// Handle Signup Form Submission
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('signup', { error: 'Username and password are required!', success: null });
    }
    if (password.length < 4) {
        return res.render('signup', { error: 'Password must be at least 4 characters long!', success: null });
    }

    const users = fs.readFileSync(usersFile, 'utf-8').split('\n');
    if (users.some(user => user.split(':')[0] === username)) {
        return res.render('signup', { error: 'Username already exists!', success: null });
    }

    fs.appendFileSync(usersFile, `${username}:${password}\n`);
    res.render('login', { success: 'Account created successfully! Please log in.', error: null });
});

// Render Login Page
app.get('/login', (req, res) => {
  res.render('login', { message: null, success: null, error: null });
});


// Handle Login Form Submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const users = fs.readFileSync(usersFile, 'utf-8').split('\n');
    const user = users.find(user => user === `${username}:${password}`);

    if (user) {
        req.session.loggedIn = true;
        req.session.username = username;
        res.redirect('/index.html');
    } else {
        res.render('login', { error: 'Invalid username or password!', success: null });
    }
});

// Render Home Page
app.get('/', (req, res) => {
    res.render('index', { message: null });
});

app.get('/giveaway', (req, res) => {
  if (!req.session.loggedIn) {
      return res.redirect('/login');
  }
  res.render('giveaway', {
      username: req.session.username,
      currentTime: new Date().toLocaleTimeString()
  });
});


// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          return res.status(500).send('Error logging out');
      }

      // Clear the session cookie to fully log out the user
      res.clearCookie('connect.sid', { path: '/' });

      // Render the login page with a logout confirmation message
      res.render('login', { message: 'You have been successfully logged out.', error: null, success: null });
  });
});

app.get('/find', (req, res) => {
  const { Type, breed, age, Gender } = req.query;
  const petsFilePath = path.join(__dirname, 'pets.txt');
  let submitted = false;
  let matchingPets = [];

  // Check if the form has been submitted with search criteria
  if (Type || breed || age || Gender) {
      submitted = true;
      fs.readFile(petsFilePath, 'utf8', (err, data) => {
          if (err) {
              console.error('Error reading pets file:', err);
              return res.status(500).send('Server error');
          }

          const lines = data.trim().split('\n');
          matchingPets = lines.filter(line => {
              const [id, username, petType, petBreed, petAge, petGender] = line.split(':');

              return (!Type || petType === Type) &&
                     (!breed || petBreed.toLowerCase().includes(breed.toLowerCase())) &&
                     (!age || petAge === age) &&
                     (!Gender || petGender === Gender);
          });

          res.render('find', { submitted, pets: matchingPets });
      });
  } else {
      // If no search criteria were submitted, render the page with the form visible
      res.render('find', { submitted, pets: [] });
  }
});
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Error logging out');
      }

      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('/logged-out');
  });
});

app.get('/logged-out', (req, res) => {
  res.render('login', { message: 'You have been successfully logged out.', error: null, success: null });
});


app.get('/test-message', (req, res) => {
  res.render('login', { message: 'This is a test message.', error: null, success: null });
});



// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
