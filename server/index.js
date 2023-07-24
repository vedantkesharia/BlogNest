
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './models/User.js';
import Post from './models/Post.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cloudinary from 'cloudinary';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const uploadMiddleware = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const salt = bcrypt.genSaltSync(10);

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(`${__dirname}/uploads`));

mongoose.connect(process.env.REACT_APP_MONGO_URL);

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({ username, id: userDoc._id }, process.env.REACT_APP_SECRET, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.REACT_APP_SECRET, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, process.env.REACT_APP_SECRET, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;

    try {
      // Upload the image to Cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload(newPath, {
        resource_type: 'auto',
        public_id: `post_${Date.now()}`,
        format: ext,
      });

      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: uploadResult.secure_url, // Store the Cloudinary public URL
        author: info.id,
      });

      res.json(postDoc);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to upload the image to Cloudinary' });
    } finally {
      // Remove the local file after upload (optional)
      fs.unlinkSync(newPath);
    }
  });
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  let ext = null; // Declare ext variable outside the if block
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    ext = parts[parts.length - 1]; // Assign value to ext inside the if block
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  jwt.verify(token, process.env.REACT_APP_SECRET, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const filter = { _id: id };
    const update = {
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    };
    const options = { new: true }; // Return the updated document

    try {
      if (newPath) {
        // Upload the image to Cloudinary
        const uploadResult = await cloudinary.v2.uploader.upload(newPath, {
          resource_type: 'auto',
          public_id: `post_${Date.now()}`,
          format: ext,
        });

        update.cover = uploadResult.secure_url; // Store the Cloudinary public URL
      }

      const updatedPost = await Post.findByIdAndUpdate(filter, update, options);

      if (!updatedPost) {
        return res.status(400).json('Post not found');
      }

      res.json(updatedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to upload the image to Cloudinary' });
    } finally {
      // Remove the local file after upload (optional)
      if (newPath) {
        fs.unlinkSync(newPath);
      }
    }
  });
});


app.get('/post', async (req, res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
});

app.listen(4000);
// app.listen(`https://blognest-6go9.onrender.com`);











// import express from 'express';
// import cors from 'cors';
// import mongoose from 'mongoose';
// import User from './models/User.js';
// import Post from './models/Post.js';
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import cookieParser from 'cookie-parser';
// import multer from 'multer';
// import fs from 'fs';
// // import path from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);


// const uploadMiddleware = multer({dest:'uploads/'});

// const app = express();
// dotenv.config();

// const salt = bcrypt.genSaltSync(10);

// app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
// app.use(express.json());
// app.use(cookieParser());
// // app.use('/uploads', express.static(__dirname + '/uploads'));
// app.use('/uploads', express.static(`${__dirname}/uploads`));

// mongoose.connect(process.env.REACT_APP_MONGO_URL);

// app.post('/register', async (req,res) => {
//   const {username,password} = req.body;
//   try{
//     const userDoc = await User.create({
//       username,
//       password:bcrypt.hashSync(password,salt),
//     });
//     res.json(userDoc);
//   } catch(e) {
//     console.log(e);
//     res.status(400).json(e);
//   }
// });

// app.post('/login', async (req,res) => {
//   const {username,password} = req.body;
//   const userDoc = await User.findOne({username});
//   const passOk = bcrypt.compareSync(password, userDoc.password);
//   if (passOk) {
//     // logged in
//     jwt.sign({username,id:userDoc._id}, process.env.REACT_APP_SECRET, {}, (err,token) => {
//       if (err) throw err;
//       res.cookie('token', token).json({
//         id:userDoc._id,
//         username,
//       });
//     });
//   } else {
//     res.status(400).json('wrong credentials');
//   }
// });

// app.get('/profile', (req,res) => {
//   const {token} = req.cookies;
//   jwt.verify(token, process.env.REACT_APP_SECRET, {}, (err,info) => {
//     if (err) throw err;
//     res.json(info);
//   });
// });

// app.post('/logout', (req,res) => {
//   res.cookie('token', '').json('ok');
// });




// app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
//   const {originalname,path} = req.file;
//   const parts = originalname.split('.');
//   const ext = parts[parts.length - 1];
//   const newPath = path+'.'+ext;
//   fs.renameSync(path, newPath);

//   const {token} = req.cookies;
//   jwt.verify(token, process.env.REACT_APP_SECRET, {}, async (err,info) => {
//     if (err) throw err;
//     const {title,summary,content} = req.body;
//     const postDoc = await Post.create({
//       title,
//       summary,
//       content,
//       cover:newPath,
//       author:info.id,
//     });
//     res.json(postDoc);
//   });

// });

// app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
//   let newPath = null;
//   if (req.file) {
//     const { originalname, path } = req.file;
//     const parts = originalname.split('.');
//     const ext = parts[parts.length - 1];
//     newPath = path + '.' + ext;
//     fs.renameSync(path, newPath);
//   }

//   const { token } = req.cookies;
//   jwt.verify(token, process.env.REACT_APP_SECRET, {}, async (err, info) => {
//     if (err) throw err;
//     const { id, title, summary, content } = req.body;
//     const filter = { _id: id };
//     const update = {
//       title,
//       summary,
//       content,
//       cover: newPath ? newPath : postDoc.cover,
//     };
//     const options = { new: true }; // Return the updated document

//     const updatedPost = await Post.findByIdAndUpdate(filter, update, options);

//     if (!updatedPost) {
//       return res.status(400).json('Post not found');
//     }

//     res.json(updatedPost);
//   });
// });




// app.get('/post', async (req,res) => {
//   res.json(
//     await Post.find()
//       .populate('author', ['username'])
//       .sort({createdAt: -1})
//       .limit(20)
//   );
// });

// app.get('/post/:id', async (req, res) => {
//   const {id} = req.params;
//   const postDoc = await Post.findById(id).populate('author', ['username']);
//   res.json(postDoc);
// })

// app.listen(4000);








// import express from 'express';
// // const cors = require('cors');
// import cors from 'cors';
// import mongoose from 'mongoose';
// import User from './models/User.js';
// import Post from './models/Post.js';
// // const Post = require('./models/Post');
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import cookieParser from 'cookie-parser';
// import multer from 'multer';
// import fs from 'fs';       
// const uploadMiddleware = multer({dest:'uploads/'});
// const app = express();
// dotenv.config();

// const salt = bcrypt.genSaltSync(10);


// app.use(cors({credentials:true,origin:'http://localhost:3000'}));
// app.use(express.json());
// app.use(cookieParser());

//  mongoose.connect(process.env.REACT_APP_MONGO_URL);

// app.post('/register',async (req,res)=>{
//     const {username,password} = req.body;
//     try{
//     const userDoc = await User.create({username,password:bcrypt.hashSync(password,salt)});
//     res.json(userDoc);
//     }
//     catch(e){
//         res.status(400).json(e);
//     }


// })


// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const userDoc = await User.findOne({ username });
//   const passOk = bcrypt.compareSync(password, userDoc.password);
  
//   if (passOk) {
//     // logged in
//     jwt.sign({ username, id: userDoc._id }, process.env.REACT_APP_process.env.REACT_APP_SECRET, {}, (err, token) => {
//       if (err) throw err;
//       res.cookie('token', token).json({
//         id: userDoc._id,
//         username,
//       });
//     });
//   } else {
//     res.status(400).json('wrong credentials');
//   }
// });

// app.get('/profile', (req,res) => {
//   const {token} = req.cookies;
//   jwt.verify(token, process.env.REACT_APP_process.env.REACT_APP_SECRET, {}, (err,info) => {
//     if (err) throw err;
//     res.json(info);
//   });
// });

// app.post('/logout', (req,res) => {
//   res.cookie('token', '').json('ok');
// });

// app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
//   const {originalname,path} = req.file;
//   const parts = originalname.split('.');
//   const ext = parts[parts.length - 1];
//   const newPath = path+'.'+ext;
//   fs.renameSync(path, newPath);

//   const {token} = req.cookies;
//   jwt.verify(token, process.env.REACT_APP_process.env.REACT_APP_SECRET, {}, async (err,info) => {
//     if (err) throw err;
//     const {title,summary,content} = req.body;
//     const postDoc = await Post.create({
//       title,
//       summary,
//       content,
//       cover:newPath,
//       author:info.id,
//     });
//     res.json(postDoc);
//   });

// });


// app.listen(4000);

