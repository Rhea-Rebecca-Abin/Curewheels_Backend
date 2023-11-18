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
  password: "rhea123",
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

/*app.get("/profile/:Cus_ID", (req, res) => {
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
*/
app.get("/profile", (req, res) => {
  // Retrieve the Cus_ID from the session
  const cus_id = req.session.userid;

  // Check if the user is logged in
  if (!cus_id) {
    return res.status(401).json({
      status: "error",
      error: "Unauthorized - User not logged in",
    });
  }

  // Fetch user profile using the cus_id from the session
  db.query(
    "SELECT Cus_ID, Name, DOB, Address, ContactNo, Email, CreditPoints FROM Customers WHERE Cus_ID = ?",
    [cus_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (result.length > 0) {
        const userProfile = result[0];
        res.json({
          status: "ok",
          userProfile: userProfile,
        });
      } else {
        res.status(404).json({
          status: "error",
          error: "No profile data found for this Customer",
        });
      }
    }
  );
});

app.get("/pharmacies", (req, res) => {
  db.query("SELECT Name FROM pharmacy", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        status: "error",
        error: "Database error",
      });
    }

    if (result.length > 0) {
      const pharmacyNames = result.map((pharmacy) => pharmacy.Name);
      console.log("Pharmacy Names:", pharmacyNames);
      return res.json({
        status: "ok",
        pharmacyNames: pharmacyNames,
      });
    } else {
      return res.status(404).json({
        status: "error",
        error: "No pharmacies found",
      });
    }
  });
});

/*app.get("/pharmacy/medicines/:pharmacyName", (req, res) => {
  const pharmacyName = req.params.pharmacyName;

  // Step 1: Select PH_ID corresponding to the given pharmacyName
  db.query(
    "SELECT PH_ID FROM pharmacy WHERE Name = ?",
    [pharmacyName],
    (err, resultPharmacy) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (resultPharmacy.length > 0) {
        const phId = resultPharmacy[0].PH_ID;

        // Step 2: Select M_ID details corresponding to the PH_ID from the Med_pharmacy table
        db.query(
          "SELECT M_ID, Qty_available FROM Med_pharmacy WHERE PH_ID = ?",
          [phId],
          (err, resultMedPharmacy) => {
            if (err) {
              console.error(err);
              return res.status(500).json({
                status: "error",
                error: "Database error",
              });
            }

            if (resultMedPharmacy.length > 0) {
              // Step 3: Use the M_ID values to fetch medicine details from the medicine table
              const medicineDetails = resultMedPharmacy.map((med) => {
                return {
                  M_ID: med.M_ID,
                  Qty_available: med.Qty_available,
                };
              });

              const mIds = medicineDetails.map((med) => med.M_ID);

              db.query(
                "SELECT * FROM medicine WHERE M_ID IN (?)",
                [mIds],
                (err, resultMedicine) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).json({
                      status: "error",
                      error: "Database error",
                    });
                  }

                  const medicineDetailsWithInfo = medicineDetails.map((med) => {
                    const medicineInfo = resultMedicine.find(
                      (info) => info.M_ID === med.M_ID
                    );
                    return {
                      ...med,
                      Name: medicineInfo.Name,
                      Price: medicineInfo.Price,
                      Mfg_date: medicineInfo.Mfg_date,
                      Exp_date: medicineInfo.Exp_date,
                      Manufacturer: medicineInfo.Manufacturer,
                    };
                  });

                  return res.json({
                    status: "ok",
                    medicineDetails: medicineDetailsWithInfo,
                  });
                }
              );
            } else {
              return res.status(404).json({
                status: "error",
                error: "No medicines found for this pharmacy",
              });
            }
          }
        );
      } else {
        return res.status(404).json({
          status: "error",
          error: "Pharmacy not found",
        });
      }
    }
  );
});
*/

app.get("/:pharmacyName", (req, res) => {
  const pharmacyName = req.params.pharmacyName;

  // Step 1: Select PH_ID corresponding to the given pharmacyName
  db.query(
    "SELECT PH_ID FROM pharmacy WHERE Name = ?",
    [pharmacyName],
    (err, resultPharmacy) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (resultPharmacy.length > 0) {
        const phId = resultPharmacy[0].PH_ID;

        // Step 2: Select M_ID details corresponding to the PH_ID from the Med_pharmacy table
        db.query(
          "SELECT M_ID, Qty_available FROM Med_pharmacy WHERE PH_ID = ?",
          [phId],
          (err, resultMedPharmacy) => {
            if (err) {
              console.error(err);
              return res.status(500).json({
                status: "error",
                error: "Database error",
              });
            }

            if (resultMedPharmacy.length > 0) {
              // Step 3: Use the M_ID values to fetch medicine details from the medicine table
              const medicineDetails = resultMedPharmacy.map((med) => {
                return {
                  M_ID: med.M_ID,
                  Qty_available: med.Qty_available,
                };
              });

              const mIds = medicineDetails.map((med) => med.M_ID);

              db.query(
                "SELECT * FROM medicine WHERE M_ID IN (?)",
                [mIds],
                (err, resultMedicine) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).json({
                      status: "error",
                      error: "Database error",
                    });
                  }

                  const medicineDetailsWithInfo = medicineDetails.map((med) => {
                    const medicineInfo = resultMedicine.find(
                      (info) => info.M_ID === med.M_ID
                    );
                    return {
                      ...med,
                      Name: medicineInfo.Name,
                      Price: medicineInfo.Price,
                      Mfg_date: medicineInfo.Mfg_date,
                      Exp_date: medicineInfo.Exp_date,
                      Manufacturer: medicineInfo.Manufacturer,
                    };
                  });

                  return res.json({
                    status: "ok",
                    medicineDetails: medicineDetailsWithInfo,
                  });
                }
              );
            } else {
              return res.status(404).json({
                status: "error",
                error: "No medicines found for this pharmacy",
              });
            }
          }
        );
      } else {
        return res.status(404).json({
          status: "error",
          error: "Pharmacy not found",
        });
      }
    }
  );
});

// Route to add medicine to Order_med_details table
app.post("/order/addmedicine/:PH_ID/:M_ID", (req, res) => {
  const PH_ID = req.params.PH_ID; // Get PH_ID from route parameters
  const M_ID = req.params.M_ID; // Get M_ID from route parameters
  const Qty = req.body.Qty; // Get Qty from request body
  const Cus_ID = req.session.userid; // Assuming  session variable for customer ID

  if (Qty === null || isNaN(Qty)) {
    return res.status(400).json({
      status: "error",
      error: "Invalid quantity. Please provide a valid quantity.",
    });
  }
  // Step 1: Check if the requested quantity is less than or equal to the available quantity
  db.query(
    "SELECT Qty_available FROM Med_pharmacy WHERE PH_ID = ? AND M_ID = ?",
    [PH_ID, M_ID],
    (err, resultQty) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (resultQty.length > 0) {
        const availableQty = resultQty[0].Qty_available;

        if (Qty > availableQty) {
          return res.status(400).json({
            status: "error",
            error: "Requested quantity exceeds available quantity",
          });
        }

        // Step 2: Retrieve additional information from pharmacy and medicine tables
        db.query(
          "SELECT pharmacy.Name AS PharmacyName, medicine.Name AS MedicineName, medicine.Price FROM pharmacy, medicine WHERE pharmacy.PH_ID = ? AND medicine.M_ID = ?",
          [PH_ID, M_ID],
          (err, resultInfo) => {
            if (err) {
              console.error(err);
              return res.status(500).json({
                status: "error",
                error: "Database error",
              });
            }

            if (resultInfo.length > 0) {
              const PharmacyName = resultInfo[0].PharmacyName;
              const MedicineName = resultInfo[0].MedicineName;
              const Price = resultInfo[0].Price;

              // Step 3: Insert the order details into the Order_med_details table with additional information
              db.query(
                "INSERT INTO Order_Med_details (Cus_ID, PH_ID, M_ID, PharmacyName, MedicineName, Price, Quantity) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [Cus_ID, PH_ID, M_ID, PharmacyName, MedicineName, Price, Qty],
                (err, result) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).json({
                      status: "error",
                      error: "Database error",
                    });
                  }

                  return res.json({
                    status: "ok",
                    message: "Medicine added to order successfully",
                  });
                }
              );
            } else {
              return res.status(404).json({
                status: "error",
                error: "Pharmacy or Medicine not found",
              });
            }
          }
        );
      } else {
        return res.status(404).json({
          status: "error",
          error: "Pharmacy or Medicine not found",
        });
      }
    }
  );
});
app.post("/order/deletemedicine/:PH_ID/:M_ID", (req, res) => {
  const PH_ID = req.params.PH_ID; // Get PH_ID from route parameters
  const M_ID = req.params.M_ID; // Get M_ID from route parameters
  const QtyToDelete = req.body.QtyToDelete; // Get Qty to delete from request body
  const Cus_ID = req.session.userid; // Assuming you have a session variable for customer ID

  // Check if QtyToDelete is a valid number
  if (isNaN(QtyToDelete)) {
    return res.status(400).json({
      status: "error",
      error: "QtyToDelete must be a valid number",
    });
  }

  // Fetch current quantity from the Order_Med_details table
  db.query(
    "SELECT Quantity FROM Order_Med_details WHERE Cus_ID = ? AND PH_ID = ? AND M_ID = ?",
    [Cus_ID, PH_ID, M_ID],
    (err, resultQty) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (resultQty.length > 0) {
        const currentQty = resultQty[0].Quantity;

        // Check if both currentQty and QtyToDelete are valid numbers
        if (isNaN(currentQty) || isNaN(QtyToDelete)) {
          return res.status(400).json({
            status: "error",
            error: "Invalid quantity values",
          });
        }

        // Calculate the new quantity after deletion
        let newQty = currentQty - QtyToDelete;

        // Check if newQty is a valid number
        if (isNaN(newQty)) {
          newQty = 0; // Set a default value if newQty is not a number
        }

        // Debugging: Print the value of newQty to the console
        console.log("New Quantity:", newQty);

        if (newQty <= 0) {
          // If the new quantity is zero or negative, remove the row
          db.query(
            "DELETE FROM Order_Med_details WHERE Cus_ID = ? AND PH_ID = ? AND M_ID = ?",
            [Cus_ID, PH_ID, M_ID],
            (err, result) => {
              if (err) {
                console.error(err);
                return res.status(500).json({
                  status: "error",
                  error: "Database error",
                });
              }

              return res.json({
                status: "ok",
                message: "Medicine deleted from order successfully",
              });
            }
          );
        } else {
          // Update the quantity in the Order_Med_details table
          db.query(
            "UPDATE Order_Med_details SET Quantity = ? WHERE Cus_ID = ? AND PH_ID = ? AND M_ID = ?",
            [newQty, Cus_ID, PH_ID, M_ID],
            (err, result) => {
              if (err) {
                console.error(err);
                return res.status(500).json({
                  status: "error",
                  error: "Database error",
                });
              }

              return res.json({
                status: "ok",
                message: "Medicine quantity updated in order successfully",
              });
            }
          );
        }
      } else {
        return res.status(404).json({
          status: "error",
          error: "Medicine not found in the order",
        });
      }
    }
  );
});
/*app.get("/order/status", (req, res) => {
  const Cus_ID = req.session.userid;

  // Step 1: Fetch order details for the specified customer
  db.query(
    "SELECT MedicineName, Quantity, PH_ID, PharmacyName, Price FROM order_med_details WHERE Cus_ID = ?",
    [Cus_ID],
    (err, orderDetails) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (orderDetails.length === 0) {
        return res.status(404).json({
          status: "error",
          error: "No order details found for the specified customer",
        });
      }

      // Step 2: Calculate total price and credit points
      let totalPrice = 0;
      let creditPoints = 0;

      for (const orderItem of orderDetails) {
        totalPrice += orderItem.Quantity * orderItem.Price;
      }

      if (totalPrice > 1000) {
        creditPoints = 10;
      } else if (totalPrice >= 500) {
        creditPoints = 5;
      }

      // Step 3: Generate a random order ID
      const orderID = Math.floor(1000 + Math.random() * 9000);

      // Step 4: Insert order confirmation details into order_confirm_med table
      db.query(
        "INSERT INTO order_confirm_med (Cus_ID, Order_ID, Total_Price, Credit_Points) VALUES (?, ?, ?, ?)",
        [Cus_ID, orderID, totalPrice, creditPoints],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              status: "error",
              error: "Database error",
            });
          }

          // Step 5: Send the order confirmation details to the frontend
          return res.json({
            status: "ok",
            orderDetails,
            total: totalPrice,
            creditPoints,
            orderID,
          });
        }
      );
    }
  );
});*/

app.get("/order/status", (req, res) => {
  const Cus_ID = req.session.userid;

  // Step 1: Fetch order details for the specified customer
  db.query(
    "SELECT MedicineName, Quantity, PH_ID, PharmacyName, Price FROM order_med_details WHERE Cus_ID = ?",
    [Cus_ID],
    (err, orderDetails) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (orderDetails.length === 0) {
        return res.status(404).json({
          status: "error",
          error: "No order details found for the specified customer",
        });
      }

      // Step 2: Calculate total price and credit points
      let totalPrice = 0;
      let creditPoints = 0;

      for (const orderItem of orderDetails) {
        totalPrice += orderItem.Quantity * orderItem.Price;
      }

      if (totalPrice > 1000) {
        creditPoints = 10;
      } else if (totalPrice >= 500) {
        creditPoints = 5;
      }

      // Step 3: Generate a random order ID
      const orderID = Math.floor(1000 + Math.random() * 9000);

      // Step 4: Insert order confirmation details into order_confirm_med table
      db.query(
        "INSERT INTO order_confirm_medi (Cus_ID, Order_ID, Total_Price, Credit_Points) VALUES (?, ?, ?, ?)",
        [Cus_ID, orderID, totalPrice, creditPoints],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              status: "error",
              error: "Database error",
            });
          }

          // Step 5: Send the order confirmation details to the frontend
          return res.json({
            status: "ok",
            orderDetails,
            total: totalPrice,
            creditPoints,
            orderID,
          });
        }
      );
    }
  );
});

/*Update qty - v1
app.post("/update/quantity", (req, res) => {
  const Cus_ID = req.session.userid;

  // Step 1: Fetch order details for the specified customer
  db.query(
    "SELECT MedicineName, Quantity, PH_ID FROM order_med_details WHERE Cus_ID = ?",
    [Cus_ID],
    (err, orderDetails) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (orderDetails.length === 0) {
        return res.status(404).json({
          status: "error",
          error: "No order details found for the specified customer",
        });
      }

      // Step 2: Update quantity in the med_pharmacy table
      orderDetails.forEach((orderItem) => {
        const { PH_ID, MedicineName, Quantity: orderedQuantity } = orderItem;

        db.query(
          "UPDATE med_pharmacy SET Qty_available = Qty_available - ? WHERE PH_ID = ? AND M_ID = (SELECT M_ID FROM medicine WHERE Name = ?)",
          [orderedQuantity, PH_ID, MedicineName],
          (updateErr, updateResult) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({
                status: "error",
                error: "Database error",
              });
            }
          }
        );
      });

      // Step 3: Display success message
      return res.json({
        status: "ok",
        message: "Your order is successful. Medicine quantities updated.",
      });
    }
  );
});
*/
/*Update qty_V2
app.post("/update/quantity", (req, res) => {
  const Cus_ID = req.session.userid;

  // Step 1: Fetch order details for the specified customer
  db.query(
    "SELECT MedicineName, Quantity, PH_ID FROM order_med_details WHERE Cus_ID = ?",
    [Cus_ID],
    (err, orderDetails) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (orderDetails.length === 0) {
        return res.status(404).json({
          status: "error",
          error: "No order details found for the specified customer",
        });
      }

      // Step 2: Update quantity in the med_pharmacy table
      orderDetails.forEach((orderItem, index) => {
        const { PH_ID, MedicineName, Quantity: orderedQuantity } = orderItem;

        db.query(
          "UPDATE med_pharmacy SET Qty_available = Qty_available - ? WHERE PH_ID = ? AND M_ID = (SELECT M_ID FROM medicine WHERE Name = ?)",
          [orderedQuantity, PH_ID, MedicineName],
          (updateErr, updateResult) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({
                status: "error",
                error: "Database error",
              });
            }

            // Check if it's the last iteration of the loop
            if (index === orderDetails.length - 1) {
              // Step 3: Delete corresponding rows from order_med_details table
              db.query(
                "DELETE FROM order_med_details WHERE Cus_ID = ?",
                [Cus_ID],
                (deleteErr, deleteResult) => {
                  if (deleteErr) {
                    console.error(deleteErr);
                    return res.status(500).json({
                      status: "error",
                      error: "Database error",
                    });
                  }

                  // Step 4: Display success message after deletion
                  return res.json({
                    status: "ok",
                    message:
                      "Your order is successful. Medicine quantities updated successfully.",
                  });
                }
              );
            }
          }
        );
      });
    }
  );
});
*/
app.post("/update/quantity", (req, res) => {
  const Cus_ID = req.session.userid;

  // Step 1: Fetch order details for the specified customer
  db.query(
    "SELECT MedicineName, Quantity, PH_ID FROM order_med_details WHERE Cus_ID = ?",
    [Cus_ID],
    (err, orderDetails) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          status: "error",
          error: "Database error",
        });
      }

      if (orderDetails.length === 0) {
        return res.status(404).json({
          status: "error",
          error: "No order details found for the specified customer",
        });
      }

      // Step 2: Update quantity in the med_pharmacy table
      orderDetails.forEach((orderItem, index) => {
        const { PH_ID, MedicineName, Quantity: orderedQuantity } = orderItem;

        db.query(
          "UPDATE med_pharmacy SET Qty_available = Qty_available - ? WHERE PH_ID = ? AND M_ID = (SELECT M_ID FROM medicine WHERE Name = ?)",
          [orderedQuantity, PH_ID, MedicineName],
          (updateErr, updateResult) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({
                status: "error",
                error: "Database error",
              });
            }

            // Check if it's the last iteration of the loop
            if (index === orderDetails.length - 1) {
              // Step 3: Delete corresponding rows from order_med_details table
              db.query(
                "DELETE FROM order_med_details WHERE Cus_ID = ?",
                [Cus_ID],
                (deleteErr, deleteResult) => {
                  if (deleteErr) {
                    console.error(deleteErr);
                    return res.status(500).json({
                      status: "error",
                      error: "Database error",
                    });
                  }

                  // Step 4: Update Qty_available to 0 if it's less than or equal to 0
                  db.query(
                    "UPDATE med_pharmacy SET Qty_available = CASE WHEN Qty_available <= 0 THEN 0 ELSE Qty_available END WHERE PH_ID IN (SELECT DISTINCT PH_ID FROM order_med_details WHERE Cus_ID = ?)",
                    [Cus_ID],
                    (updateQtyErr, updateQtyResult) => {
                      if (updateQtyErr) {
                        console.error(updateQtyErr);
                        return res.status(500).json({
                          status: "error",
                          error: "Database error",
                        });
                      }

                      // Step 5: Display success message after update
                      return res.json({
                        status: "ok",
                        message:
                          "Your order is successful. Medicine quantities updated successfully.",
                      });
                    }
                  );
                }
              );
            }
          }
        );
      });
    }
  );
});

app.listen("3000", () => {
  console.log("Server running on port 3000");
});
