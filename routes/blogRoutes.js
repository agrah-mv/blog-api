const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/', authMiddleware, blogController.createBlog);
router.put('/:id', authMiddleware, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.post('/:id/upload-image', authMiddleware, upload.single('image'), blogController.uploadBlogImage);
router.get('/:id/image', blogController.getBlogImage);
router.get('/paginated/all', blogController.getPaginatedBlogs);

module.exports = router;
