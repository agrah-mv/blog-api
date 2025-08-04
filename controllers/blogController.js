const Blog = require('../models/Blog');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isDeleted: false }).populate('author', 'name email');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get one blog
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false }).populate('author', 'name email');
    if (!blog) return res.status(404).json({ message: 'Not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a blog
exports.createBlog = async (req, res) => {
  const { title, content } = req.body;
  try {
    const blog = await Blog.create({
      title,
      content,
      author: req.user.id, // from authMiddleware
    });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a blog
exports.updateBlog = async (req, res) => {
  const { title, content } = req.body;
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Not found' });

    // Optional: Check if current user is the author
    if (blog.author.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    await blog.save();
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a blog
const mongoose = require('mongoose');

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Blog ID' });
    }

    const blog = await Blog.findById(id);
    if (!blog || blog.isDeleted) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    blog.isDeleted = true;
    await blog.save();

    res.json({ message: 'Blog soft deleted' });
  } catch (err) {
    console.error('Delete Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadBlogImage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.isDeleted)
      return res.status(404).json({ message: 'Blog not found' });

    if (blog.author.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    blog.image = req.file.path;
    await blog.save();

    res.json({ message: 'Image uploaded', imagePath: req.file.path });
  } catch (err) {
    console.error('Upload Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBlogImage = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.isDeleted || !blog.image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/${blog.image}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error('Image fetch error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaginatedBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email');

    const total = await Blog.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(total / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalItems: total,
      blogs,
    });
  } catch (err) {
    console.error('Pagination Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
