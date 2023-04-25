const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (error) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(error.name, error.message);

  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DATABASE connection successful!"));

// const testTour = new Tour({
//   name: "The Park Camper",
//   price: 997,
// });

// testTour
//   .save()
//   .then((document) => console.log(document))
//   .catch((error) => console.log(`ERROR: ${error}`));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (error) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(error.name, error.message);

  server.close(() => process.exit(1));
});
