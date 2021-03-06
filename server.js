import express from 'express';
import mongoose from 'mongoose';
import data from './data.js';
import userRouter from './routers/userRouter.js';
import productRouter from './routers/productRouter.js';
import categoryRouter from './routers/categoryRouter.js';
import { } from 'dotenv/config.js';

const app = express();
try {
  mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  console.log('db connected.')
} catch (err) {
  console.log(error.reason)
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested, Content-Type, Accept Authorization"
  )
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Methods",
      "POST, PUT, PATCH, GET, DELETE"
    )
    return res.status(200).json({})
  }
  next()
})


// app.get("/api/products", (req, res) => {
//   res.send(data.products);
// });

// app.get("/api/sections", (req, res) => {
//   res.send(data.sections);
// });

// ROUTES MIDDLEWARE
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/category', categoryRouter);

app.get("/", (req, res) => {
  res.send('Server is ready');
});

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
})

const port = process.env.PORT || 5600;

app.listen(port, () => {
  console.log(`server started at localhost:${port}`)
});