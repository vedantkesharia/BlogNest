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
// import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {GridFSBucket, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const uploadMiddleware = multer({dest:'uploads/'});

const app = express();
dotenv.config();

const salt = bcrypt.genSaltSync(10);

app.use(cors({ credentials: true, origin: 'https://theblognest.netlify.app' }));
app.use(express.json());
app.use(cookieParser());
// app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/uploads', express.static(`${__dirname}/uploads`));

mongoose.connect(process.env.REACT_APP_MONGO_URL);

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, process.env.REACT_APP_SECRET, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  jwt.verify(token, process.env.REACT_APP_SECRET, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});


const bucket = new GridFSBucket(mongoose.connection.db, {
  bucketName: 'uploads',
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];

  const uploadStream = bucket.openUploadStream(`${req.file.filename}.${ext}`);
  const readStream = fs.createReadStream(path);
  readStream.pipe(uploadStream);

  uploadStream.on('error', (error) => {
    fs.unlinkSync(path); // Delete the local file if an error occurs during upload
    return res.status(500).json('Failed to upload file to MongoDB');
  });

  uploadStream.on('finish', async (file) => {
    fs.unlinkSync(path); // Delete the local file after successful upload

    const { token } = req.cookies;
    jwt.verify(token, process.env.REACT_APP_SECRET, {}, async (err, info) => {
      if (err) throw err;

      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: file._id, // Store the GridFS file ID as the cover value
        author: info.id,
      });

      res.json(postDoc);
    });
  });
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let fileId = null;

  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];

    const uploadStream = bucket.openUploadStream(`${req.file.filename}.${ext}`);
    const readStream = fs.createReadStream(path);
    readStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      fs.unlinkSync(path); // Delete the local file if an error occurs during upload
      return res.status(500).json('Failed to upload file to MongoDB');
    });

    uploadStream.on('finish', (file) => {
      fs.unlinkSync(path); // Delete the local file after successful upload
      fileId = file._id; // Store the GridFS file ID for later use

      updatePost(req, res, fileId);
    });
  } else {
    updatePost(req, res, fileId);
  }
});

async function updatePost(req, res, fileId) {
  const { token } = req.cookies;
  jwt.verify(token, process.env.REACT_APP_SECRET, {}, async (err, info) => {
    if (err) throw err;

    const { id, title, summary, content } = req.body;
    const filter = { _id: id };
    const update = {
      title,
      summary,
      content,
    };

    if (fileId) {
      update.cover = fileId; // Update the cover field with the new GridFS file ID
    }

    const options = { new: true }; // Return the updated document

    const updatedPost = await Post.findByIdAndUpdate(filter, update, options);

    if (!updatedPost) {
      return res.status(400).json('Post not found');
    }

    res.json(updatedPost);
  });
}

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




app.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})

app.listen(4000);








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

