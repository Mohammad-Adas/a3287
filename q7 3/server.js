const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');

const petsFilePath = path.join(__dirname, 'pets.txt'); 
const usersFile = path.join(__dirname, 'users.txt');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Render Signup Page
app.get('/signup', (req, res) => {
    res.render('signup', { error: null, success: null });
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
    res.render('login', { success: 'Account created successfully! Please log in.', error: null, message: null });
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
        res.redirect('/index.html');  // Redirect to the index.html page
    } else {
        res.render('login', { error: 'Invalid username or password!', success: null, message: null });
    }
});


// Render Home Page
app.get('/dashboard', (req, res) => {
    res.render('index', { isAuthenticated: req.session.loggedIn, username: req.session.username });
});

app.get('/', (req, res) => {
    res.render('index', { isAuthenticated: req.session.loggedIn, username: req.session.username });
});

// Handle Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.render('login', { message: 'You have been successfully logged out.', error: null, success: null });
    });
});

// Render Giveaway Page (Protected Route)
app.get('/giveaway', isAuthenticated, (req, res) => {
    res.render('giveaway', {
        username: req.session.username,
        currentTime: new Date().toLocaleTimeString()
    });
});

// Handle Pet Submission (Protected Route)
app.post('/submit-pet', isAuthenticated, (req, res) => {
    const username = req.session.username;
    const { Type, breed, age, Gender, suitability, comment, first_name, last_name, email } = req.body;

    fs.readFile(petsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading pets file:', err);
            return res.status(500).send('Server error');
        }

        let nextId = 1;
        if (data.trim()) {
            const lastLine = data.trim().split('\n').pop();
            const lastId = parseInt(lastLine.split(':')[0]);
            nextId = lastId + 1;
        }

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

        fs.appendFile(petsFilePath, petInfo + '\n', (err) => {
            if (err) {
                console.error('Error writing to pets file:', err);
                return res.status(500).send('Server error');
            }

            res.send('Pet information submitted successfully!');
        });
    });
});

// Handle Pet Search
app.get('/find', (req, res) => {
    const { Type, breed, age, Gender } = req.query;
    let submitted = false;
    let matchingPets = [];

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
        res.render('find', { submitted, pets: [] });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
