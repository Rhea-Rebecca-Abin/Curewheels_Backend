const express = require("express");
const mysql = require("mysql");
const sessions = require("express-session");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(
  sessions({
    secret: "pancakesandbreadandbutter@$9977885",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);
//create connection

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "Medical_Care_System",
});
//connect
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Mysql connected");
});
var session;
//Register
app.post("/register", (req, res) => {
  const name = req.body.name;
  const dob = req.body.dob;
  const address = req.body.address;
  const contactNo = req.body.contactNo;
  const email = req.body.email;
  const storedPassword = req.body.password;

  db.query(
    "SELECT Email FROM customers WHERE Email =?",
    [email],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          status: "ERROR",
          error: "Database Error",
        });
      }

      if (result.length > 0) {
        return res.status(409).json({
          status: "Error",
          error: "user already exists!",
        });
      } else {
        db.query(
          "INSERT INTO Customers (Name, DOB, Address,ContactNo,Email,Password) VALUES(?,?,?,?,?,?)",
          [name, dob, address, contactNo, email, req.body.password],
          (err, result) => {
            if (err) {
              console.log(err);
              return res.status(500).json({
                status: "Error",
                error: "Database Error, could not insert the given data",
              });
            } else {
              console.log("Successfull");
              return res.status(200).json({
                status: "Sucessfully enetered user details",
                error: "No error!!Good Job!!",
              });
            }
          }
        );
      }
    }
  );
});

//Login user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query(
    "SELECT Cus_ID, Password FROM Customers WHERE Email = ?",
    [email],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (result.length > 0) {
        const storedPassword = result[0].Password;
        const userId = result[0].Cus_ID;

        if (password === storedPassword) {
          req.session.userid = userId;
          return res.json({
            status: "ok",
            error: "",
          });
        } else {
          return res.status(400).json({
            status: "error",
            error: "Wrong email or password!",
          });
        }
      } else {
        return res.status(400).json({
          status: "error",
          error: "Not a registered user",
        });
      }
    }
  );
});

app.get("/profile/:Cus_ID", (req, res) => {
  const cus_id = req.params.Cus_ID;
  db.query(
    "SELECT * FROM Customers WHERE Cus_ID= ?",
    [cus_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .send("An error occurred while fetching the profile data.");
      }

      if (result.length > 0) {
        console.log(result);
        res.json(result);
      } else {
        res.status(404).send("No profile data for this Customer");
      }
    }
  );
});
app.listen("3000", () => {
  console.log("Server running on port 3000");
});
