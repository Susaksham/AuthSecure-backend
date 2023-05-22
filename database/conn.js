import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as dotenv from "dotenv";
dotenv.config();

async function connect() {
  try {
    const mongo = await MongoMemoryServer.create();
    const getUri = mongo.getUri();
    mongoose.set("strictQuery", true);
    // const db = await mongoose.connect(getUri)

    const db = await mongoose.connect(
      `mongodb+srv://saksham:${process.env.ATLAS_PASS}@cluster0.y3iucbq.mongodb.net/?retryWrites=true&w=majority`
    );
    console.log("Database connected");
    return db;
  } catch (err) {
    console.log(err);
  }
}
export default connect;
