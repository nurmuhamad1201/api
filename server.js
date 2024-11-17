const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = 3010;

// Middleware for parsing JSON data
app.use(express.json());

// Enable CORS for all routes
app.use(cors());  
 // Allow all origins or specify your frontend URL as explained above

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Post Management API',
            version: '1.0.0',
            description: 'API for managing posts with images and videos',
        },
        servers: [
            {
                url: 'http://localhost:3010',
            },
        ],
    },
    apis: ['./server.js'], // Path to the API docs
};

// Initialize Swagger Docs
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = file.mimetype.startsWith('video') ? 'videos' : 'images';
        const dirPath = `uploads/${fileType}`;
        fs.mkdirSync(dirPath, { recursive: true }); // Ensure the directory exists
        cb(null, dirPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`);
    }
});


const upload = multer({ storage });

// Dummy data storage
let posts = [];

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new post with an image or video and includes actress information. The post also includes an ID.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The unique numeric ID of the post
 *               title:
 *                 type: string
 *                 description: The title of the post
 *               description:
 *                 type: string
 *                 description: The description of the post
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file for the post (file input)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: The video file for the post (file input)
 *               actress:
 *                 type: string
 *                 description: The name of the actress associated with the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     image:
 *                       type: string
 *                     video:
 *                       type: string
 *                     actress:
 *                       type: string
 *       400:
 *         description: Bad request
 */
app.post('/posts', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
    const { id, title, description, actress } = req.body;

    // Check if id is provided and valid
    if (id && isNaN(id)) {
        return res.status(400).json({ message: 'ID must be a valid number' });
    }

    // If id is not provided, generate a new one
    const postId = id || uuidv4(); // Using uuid as fallback if no ID is provided

    // Extract image and video file paths if they exist
    const image = req.files['image'] ? `/uploads/images/${req.files['image'][0].filename}` : null;
    const video = req.files['video'] ? `/uploads/videos/${req.files['video'][0].filename}` : null;

    // Create new post
    const newPost = {
        id: postId,
        title,
        description,
        image,
        video,
        actress,
    };

    // Store the new post in the posts array (you may use a database in real-world apps)
    posts.push(newPost);

    // Return a success message with the created post data
    res.status(201).json({
        message: 'Post created successfully',
        post: newPost,
    });
});


/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieves all the posts.
 *     responses:
 *       200:
 *         description: A list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   image:
 *                     type: string
 *                   video:
 *                     type: string
 *                   actress:
 *                     type: string
 */
app.get('/posts', (req, res) => {
    res.status(200).json(posts);
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     description: Retrieves a specific post by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The post data
 *       404:
 *         description: Post not found
 */
app.get('/posts/:id', (req, res) => {
    const post = posts.find(p => p.id === req.params.id);
    if (post) {
        res.status(200).json(post);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     description: Updates the post data by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               video:
 *                 type: string
 *               actress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
app.put('/posts/:id', (req, res) => {
    const { title, description, actress } = req.body;
    const post = posts.find(p => p.id === req.params.id);

    if (post) {
        post.title = title || post.title;
        post.description = description || post.description;
        post.actress = actress || post.actress;
        res.status(200).json({ message: 'Post updated successfully', post });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     description: Deletes a post by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
app.delete('/posts/:id', (req, res) => {
    const postIndex = posts.findIndex(p => p.id === req.params.id);

    if (postIndex !== -1) {
        posts.splice(postIndex, 1);
        res.status(200).json({ message: 'Post deleted successfully' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger docs are available at http://localhost:${PORT}/docs`);
});
