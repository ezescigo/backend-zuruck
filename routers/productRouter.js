import express from 'express';
import expressAsyncHandler from 'express-async-handler';
// import data from '../data.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import ProductList from '../controllers/productController.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

const productRouter = express.Router();

productRouter.get('/preview', expressAsyncHandler(async (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 5;
  let sortBy = req.query.sortBy ? req.query.sortBy : { price: -1 }; // later: add sold param to items and sort by most sold.

  try {
    const products = await Product.find({})
      .sort(sortBy)
      .populate('categoryIds', '_id name')
      .limit(limit)
    res.send(products);
  } catch (err) {
    return res.status(500).send({
      message: err.message,
      comment: ' in Product.find'
    })
  }
}));


//  Products by number of sell or by creation/arrival date
//  /products?sortBy=sold&order=desc&limit=4
//  /products?sortBy=createdAt&order=desc&limit=4
//  if no query params are sent, then 10 Products are returned. => <<<< Will change to a few of each categories. >>>>
// http://localhost:5600/api/products/beers/accesories?&limit=2&params=...

// query params: limit, name, min, max, order
// ?query=string will search products with name/description/brand where 'string' is included
// also, will search for categories with name 'string' or included.
// it returns an object with the results like so:
// { products: [], categories: []}
productRouter.get('/', expressAsyncHandler(async (req, res) => {
  if (req.query.query) {

    const regExp = new RegExp('.*' + req.query.query + '.*', 'i');

    try {
      let product = await Product.find({ $text: { $search: regExp } });
      let category = await Category.find({ name: regExp })
      res.send({
        'products': product,
        'categories': category
      });
    } catch (err) {
      console.log(err.message);
      return res.status(500).send({
        message: err.message
      });
    }
  }

}))

productRouter.get('/related/:productId', expressAsyncHandler(async (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 10;
  // let categories = [ObjectId(req.params.id), '604676094750f24af0cbda16'];
  // console.log(categories);

  try {
    let product = await Product.findById(req.params.productId);
    console.log(product);
    req.productCategories = product.categoryIds.map(s => ObjectId(s));

  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      message: err.message
    });
  };

  try {
    const products = await Product.find({ categoryIds: { $elemMatch: { $in: req.productCategories } } })
      .limit(limit)
      .populate('categoryIds', '_id name')
    res.send(products);
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      message: err.message
    })
  }
}));

productRouter.get('/:category?/:subcategory?', expressAsyncHandler(async (req, res) => {
  const limit = req.query.limit;
  const name = req.query.name || '';
  const subcategory = req.params.subcategory;
  let category = '';
  category = subcategory || req.params.category;

  // We first get _id of category or subcategory
  try {
    req.category = await Category.findOne({ slug: category })
  } catch (err) {
    return res.status(500).send({
      message: err.message,
      comment: ' in Category.findOne'
    })
  };

  const categoryFilter = category ? { categoryIds: ObjectId(req.category.id) } : {};
  const min =
    req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
  const max =
    req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
  const priceFilter =
    min && max
      ? {
        price: { $gte: Number(min), $lte: Number(max) },
      }
      : max
        ? {
          price: { $lte: Number(max) }
        }
        : min
          ? {
            price: { $gte: Number(min) }
          }
          : {};
  const nameFilter = name
    ? {
      name: {
        $regex: `.*${name}.*`,
        $options: 'si',
      },
    }
    : {};
  const order = req.query.order
    ? req.query.order === 'lowest'
      ? { price: 1 }
      : req.query.order === 'highest'
        ? { price: -1 }
        : req.query.order === 'newest'
          ? { _id: -1 }
          : { rating: -1 }
    : { _id: -1 };
  // add more useful params for pagination


  console.log('category: ', category);
  console.log('sub: ', subcategory);
  console.log('limit', limit);

  try {
    let products = await Product.find({
      ...categoryFilter,
      ...priceFilter,
      ...nameFilter
    })
      .populate('categoryIds', '_id name slug')
      .sort(order);
    res.send(products);
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      message: err.message,
      comment: ' in Product.find'
    })
  }

}));

///////////////////////////////////////////////////////////////////////////////////
// Product finder based on the requested product's category.
// Will return any Product that shares at least one category with Product queried.
// /api/products/related/{product-id}








// Seed
// productRouter.get('/seed',
//   expressAsyncHandler(async (req, res) => {
//     // await Product.remove({});
//     const createdProducts = await Product.insertMany(data.products);
//     res.send({ createdProducts });
//   }));

// Get Product details by id
// /api/products/{product-id}
productRouter.get('/:id', expressAsyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Product not found.' });
  }
}));

///////////////////// QUERY ////////////////////////////////////////////
// /api/products?category={category-name}&subcategory={subcategory-name}

// productRouter.get('/', expressAsyncHandler(async (req, res) => {
//   let limit = req.query.limit ? parseInt(req.query.limit) : 6;
//   let order = req.query.order ? req.query.order : 'asc';
//   let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
//   let category = req.query.category;
//   let subcategory = req.query.subcategory;

//   const categoryFilter = category ? { category } : {};

//   if (category === 'undefined') {
//     category = ''
//   }
//   // .distinct('categoryIds');
//   try {
//     const categories = await Product.findOne({ 'wines' })
//     const promises = await Promise.all(categories.map(async category => Product.find({ categoryIds: ObjectId(category.id) })))
//     console.log(promises);
//   } catch (err) {
//     return res.status(500).send({
//       message: err.message,
//       comment: ' in Category.findOne'
//     })
//   }
//   try {
//     // const products = await Product.find({ categoryIds: ObjectId(req.category.id) })
//     // .limit(limit);
//     // res.send(products);
//   } catch (err) {
//     return res.status(500).send({
//       message: err.message,
//       comment: ' in Product.find'
//     })
//   }

// subcategory !== 'undefined'
//   ? category = subcategory
//   : null


// if (category !== 'undefined') {
//   try {
//     req.category = await Category.findOne({ slug: category })
//   } catch (err) {
//     return res.status(500).send({
//       message: err.message,
//       comment: ' in Category.findOne'
//     })
//   }

//   try {
//     const products = await Product.find({ categoryIds: ObjectId(req.category.id) })
//       .limit(limit)
//       .populate('categoryIds', '_id name slug')
//       .sort([[sortBy, order]])
//     res.send(products);
//   } catch (err) {
//     return res.status(500).send({
//       message: err.message,
//       comment: ' in Product.find'
//     })
//   }
// } else {
//   try {
//     const products = await Product.find({})
//       .limit(limit)
//       .populate('categoryIds', '_id name slug')
//       .sort([[sortBy, order]])
//     res.send(products);
//   } catch (err) {
//     return res.status(500).send({
//       message: err.message
//     })
//   }
// }



// }))

export default productRouter;