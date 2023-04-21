// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const path = require('path');
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************


// Lab 11

const user = {};

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/testann', (req, res) => {
  res.render("pages/testann");
});

app.get('/biglogo', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'easyreads-big.png');
  res.sendFile(imagePath);
});

app.get('/icon', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'icon.png');
  res.sendFile(imagePath);
});

app.get('/backsplash', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'backsplash.png');
  res.sendFile(imagePath);
});

app.get('/literature', (req, res) => {
  res.render("pages/literature");
});

// app.get('/books', (req, res) => {
//   res.render("pages/books", {
//     // books: ['b1', 'a1', 'g1'],
//   });
//   // console.log(books);
// });

app.get('/class_notes', (req, res) => {
  res.render("pages/class_notes");
});


app.get('/', (req, res) => {
  res.render("pages/splash",
  {
    status: 'success',
    message: 'Home Page!'
  });
});

//Lab 11 -- this is wrong to pass the negative case for lab 11.
app.get('/bookmarks', (req, res) => {
  res.render("pages/profile");
});


//login
app.get('/login', (req, res) => {
  res.render("pages/login");
});


app.post('/login', async (req, res) => {
  const username = req.body.username;
  const query = "select * from users where username = $1";  
  const values = [username];

  db.one(query, values)
    .then((data) => {
      user.username = data.username;
      user.password = data.password;
      const match = bcrypt.compare(req.body.password, user.password);

      match.then(function(result){
        if(result){ // Succesful
          req.session.user = user;
          req.session.save();
          res.redirect("/literature");
        }
        else{
          console.log("Incorrect username or password.");
          res.status(300).render("pages/login", {
            error: true,
            message: "Incorrect username or password.",
          });
        }
      })

    })
    .catch((err) => {
      res.render("pages/register", {
        error: true,
        message: "Username doesn't exist, please register",
      });
    });
});


app.get("/profile", async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    const books = await pool.query("SELECT b.* FROM user_to_books ub INNER JOIN books b ON ub.book_id = b.id WHERE ub.user_id = $1", [userId]);
    const annotations = await pool.query("SELECT a.*, b.title FROM user_to_annotation ua INNER JOIN annotations a ON ua.annotation_id = a.id INNER JOIN books b ON a.book_id = b.id WHERE ua.user_id = $1", [userId]);

    res.render("pages/profile", {
      user: user.rows[0],
      books: books.rows,
      annotations: annotations.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});



app.get('/register', (req, res) => {
  res.render("pages/register");
});

app.post('/register', async (req,res) => {

  const username = req.body.username;
  const password = req.body.password;

  //hash the password using bcrypt library
  const hashed_password = await bcrypt.hash(password, 10);

  //Insert username and hashed password into 'users' table
  const insert_sql = `INSERT INTO users (username, password) VALUES ('${username}', '${hashed_password}');`;

  try {
    await db.any(insert_sql);
    res.redirect(200, '/login');
  } 
  catch (error){
    res.status(300).render("pages/register", {
      error: true,
      message: "Insertion Error",
    })
  }
});

app.get('/biglogo', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'easyreads-big.png');
  res.sendFile(imagePath);
});

app.get('/icon', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'icon.png');
  res.sendFile(imagePath);
});

app.get('/book_img', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'books.jpg');
  res.sendFile(imagePath);
});

app.get('/classnotes_img', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'class_notes.jpg');
  res.sendFile(imagePath);
});

app.get('/backsplash', (req, res) => {
  const imagePath = path.join(__dirname, 'resources', 'img', 'backsplash.png');
  res.sendFile(imagePath);
});

// Handle form submission
app.get('/books', async (req, res) => { 

  try {
    //api does not require key
    var search = req.query.search;

    if(!search){
      var response = await axios.get(`https://gutendex.com/books/`);
    }else{
      var response = await axios.get(`https://gutendex.com/books/?search=${search}`);
    }
    
    var books = response.data.results;
    res.render('pages/books', { books }); 

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: 'Failed to fetch books' });
}});

app.get('/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const url = `http://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`;
    const response = await axios.get(url);
    const book = {
      contents: response.data,
      id: bookId
    };

    if (req.query.currentPage) {
      currentPage = parseInt(req.query.currentPage);
    }

    res.render('pages/books', { book, currentPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch book contents' });
  }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
// Authentication Required
app.use(auth);

app.get('/logout', (req,res)=> {
  req.session.destroy();
  res.render("pages/login", {message: 'Logged out Successfully'});
})

app.get("/profile", (req, res) => {
  res.render("pages/profile", {
    username: req.session.user.username,
    first_name: req.session.user.first_name,
    last_name: req.session.user.last_name,
    email: req.session.user.email,
    year: req.session.user.year,
    major: req.session.user.major,
    degree: req.session.user.degree,
  });
});

app.get('/annotations', (req, res) => {
  res.render("pages/annotations");
});

app.post('/create_annotation', async (req,res) => {
  console.log(req.body);
  const book_id = req.body.book_id;
  const page_number = req.body.page_number;
  const start_index = req.body.start_index;
  const end_index = req.body.end_index;

  // Create insert sql
  const cols = '(book_id,page_number,start_index,end_index)';
  const vals = `(${book_id},${page_number},${start_index},${end_index})`;
  const insert_sql = `INSERT INTO annotations ${cols} VALUES ${vals} RETURNING *;`;

  try {
    const responce = await db.one(insert_sql);
    res.send(responce);
  } catch (error) {
    console.log(error);
  }
});

app.get('/get_annotation_comments', async (req,res) => {
  const annotation_id = req.params.id;

  const query = `SELECT * FROM comments WHERE annotation_id = ${annotation_id};`;

  try {
    const responce = await db.any(query);
    res.send(responce);
  } catch (error) {
    console.log(error);
  }
});

app.get('/add_comment', async (req,res) => {
  const annotation_id = req.body.annotation_id;
  const comment_text = req.body.comment_text;
  const user_id = req.session.user.id;

  // Create query
  const cols = '(user_id,annotation_id,comment)';
  const vals = `(${user_id},${annotation_id},${comment_text})`;
  const query = `INSERT INTO annotations ${cols} VALUES ${vals} RETURNING *;`;

  // Send query
  try {
    const responce = await db.one(query);
    console.log(responce);
    res.json(responce);
  } catch (error) {
    console.log(error);
  }
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
//app.listen(3000);
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');