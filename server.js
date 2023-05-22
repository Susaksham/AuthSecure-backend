import express from "express";
const app = express();
import cors from "cors";
import morgan from "morgan";
import connect from "./database/conn.js";
import router from "./Routes/route.js";
import * as dotenv from "dotenv";
dotenv.config();

/*---- */
app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(morgan("tiny"));
app.disable("x-powered-by");
const port = 8080;

/*HTTP GET Request */
app.get("/", (req, res) => {
  res.status(201).json("Home Get Request");
});
/* api routes */

app.use("/api", router);
/* start server only when have valid connection */

connect()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server connected to http://localhost:${port}`);
      });
    } catch (err) {
      console.log("Cannot connnect to the server");
    }
  })
  .catch((err) => {
    console.log("Invalid database connection");
  });
