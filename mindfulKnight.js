//establish the connection

const pgp = require('pg-promise')();

const db = pgp({
  host: process.env.DB_SERVER,
  port: process.env.DB_PORT,
  database: process.env.DB_USER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Configure the server and its routes.

const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());


router.get('/', readHelloMessage);

router.post('/users', createUser);

router.get('/users/email/:email', readUserFromEmail);


router.get('/users/:email', readUser);


router.get('/users', readUsers);
router.get('/fidget_toys', readFidgetToys);
router.get('/user_activity', readUserActivity);
router.get('/user_activity/:id', readUserActivityById);
//router.post('/user_activity', createUserActivity);
router.put('/user_activity/:id', updateUserActivity);
router.delete('/user_activity/:id', deleteUserActivity);

app.use(router);
app.listen(port, () => console.log(`Listening on port ${port}`));


// create the crud functions

function returnDataOr404(res, data) {
  if (data == null) {
    res.sendStatus(404);
  } else {
    res.send(data);
  }
}


function readHelloMessage(req, res) {
  res.send('Welcome to the Mindful Knight webservice!');
}


function readUsers(req, res, next) {
  db.many('SELECT * FROM users') // Updated query to select from the "users" table
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


// function createUser(req, res, next) {
//   const { name, email, password } = req.body;
//   db.one('INSERT INTO users(name, emailAddress, password_hash, registration_date) VALUES (${name}, ${email}, ${password}, CURRENT_TIMESTAMP) RETURNING *', {
//       name,
//       email,
//       password,
//     })
//     .then((data) => {
//       res.send(data);
//     })
//     .catch((err) => {
//       next(err);
//     });
// }




function createUser(req, res, next) {
  console.log('Received data from client:', req.body);

  db.one('INSERT INTO users(username, email, password_hash, registration_date) VALUES (${username}, ${email}, ${password_hash}, NOW()) RETURNING user_id', req.body)
    .then((data) => {
      console.log('Inserted user with ID:', data.user_id);
      res.send(data);
    })
    .catch((err) => {
      console.error('Error inserting user:', err);
      next(err);
    });
}






function readUserFromEmail(req, res, next) {
  db.oneOrNone("SELECT * FROM Users WHERE email='" + req.params.email + "'", req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}










function readUser(req, res, next) {
  const email = req.params.email.toLowerCase(); // Convert the email to lowercase

  db.oneOrNone('SELECT * FROM Users WHERE LOWER(email) = $1', [email])
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}









function readFidgetToys(req, res, next) {
  db.many('SELECT * FROM fidget_toys')
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}


function readUserActivity(req, res, next) {
  db.many('SELECT * FROM user_activity')
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

function readUserActivityById(req, res, next) {
  db.oneOrNone('SELECT * FROM user_activity WHERE activity_id=${id}', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function createUserActivity(req, res, next) {
  console.log('Request Body:', req.body);  // Log the request body

  db.one('INSERT INTO user_activity(user_id, toy_id, start_time, end_time) VALUES (${user_id}, ${toy_id}, ${start_time}, ${end_time}) RETURNING activity_id', req.body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      next(err);
    });
}

function updateUserActivity(req, res, next) {
  db.oneOrNone('UPDATE user_activity SET user_id=${user_id}, toy_id=${toy_id}, start_time=${start_time}, end_time=${end_time} WHERE activity_id=${params.id} RETURNING activity_id', req)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

function deleteUserActivity(req, res, next) {
  db.oneOrNone('DELETE FROM user_activity WHERE activity_id=${id} RETURNING activity_id', req.params)
    .then((data) => {
      returnDataOr404(res, data);
    })
    .catch((err) => {
      next(err);
    });
}

// Add a new route for updating time spent on the app
router.put('/update_time', updateTimeSpent);

function updateTimeSpent(req, res, next) {
  const { userId, elapsedTime } = req.body;

  // Update the user's time spent on the app
  db.none('UPDATE users SET time_spent = time_spent + $1 WHERE user_id = $2', [elapsedTime, userId])
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      next(err);
    });
}
