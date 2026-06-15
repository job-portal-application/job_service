import app from "./app.js";

const PORT = process.env.SERVER_PORT || 3003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});