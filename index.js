const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9isdf3i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  const serviceCollection = client.db("geniusCar").collection("services");
  const orderCollection = client.db("geniusCar").collection("orders");

  const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
      if (error) {
        return res.status(401).send("Unauthorized Access");
      }
      req.decoded = decoded;
    });
    next();
  };

  // const verifyToken = (req, res, next) => {
  //   const authHeader = req.headers.authorization;
  //   if (!authHeader) {
  //     res.status(401).send({ message: "Unauthorized Access" });
  //   }
  //   const token = authHeader.split(" ")[1];
  //   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
  //     if (err) {
  //       res.status(401).send({ message: "Unauthorized Access" });
  //     }
  //     res.decoded = decoded;
  //   });
  //   next();
  // };
  try {
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ price: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    app.get("/orders", verifyToken, async (req, res) => {
      const decoded = req.decoded;

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "Frobidden Access" });
      }
      // if (decoded.email !== req.query.email) {
      //   return res.status(403).send({ message: " Forbidden access" });
      // }
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const status = req.body.status;
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await orderCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = orderCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "2days",
      });
      res.send({ token });
    });

    // app.post("/jwt", (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
    //     expiresIn: "1d",
    //   });
    //   res.send({ token });
    // });
  } finally {
  }
}

run().catch((err) => {
  console.error(err);
});

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(port, (req, res) => {
  console.log("API is running on port", port);
});
