const connectToDatabase = require("./db");
const app = require("./app");
const Port = process.env.PORT || 5000;
const dotenv = require("dotenv");
dotenv.config();

connectToDatabase();

app.listen(Port, () => {
  console.log(`listening on port ${Port}`);
});
