// Creating server, listening for incoming requests, handling errors

const app = require('./app');
const PORT = process.env.PORT || 3300;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});