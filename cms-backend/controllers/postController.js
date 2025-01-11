// controllers/postController.js

const mongoose = require('mongoose');
const Post = require('../models/Post');

/**
 * Convert a raw string (any script) to a slug that supports combining marks,
 * letters (\p{L}), marks (\p{M}), and digits (\p{N}).
 * Replaces everything else with '-' and strips leading/trailing dashes.
 */
function formatSlug(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a date suffix in YYYYMMDD format (e.g. "20241226").
 */
function getDateSuffix() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * stripDateSuffix:
 * If the slug already ends with '-YYYYMMDD', remove that part.
 * e.g., "my-post-20241226" => "my-post"
 */
function stripDateSuffix(slug) {
  return slug.replace(/-\d{8}$/, '');
}

/**
 * createPost:
 * - If user typed `slug`, we sanitize it; otherwise we sanitize `title`.
 * - We strip any existing date suffix, then append a new date suffix (e.g., "-20241226").
 * - Convert metaKeywords from comma-separated string to an array if present.
 * - Store the entire `featureImage` object, plus `category`, `tags`, **and `authorName`**.
 */
const createPost = async (req, res) => {
  try {
    // Include authorName from req.body if you're capturing the user’s name
    const {
      authorName,
      title,
      slug,
      summary,
      metaTitle,
      metaDescription,
      metaKeywords,
      content,
      featureImage,
      status,
      category,
      tags,
    } = req.body;

    // Slug logic
    const base = slug || title;
    let finalSlug = formatSlug(base);
    // Remove old date suffix if present
    finalSlug = stripDateSuffix(finalSlug);
    // Append today's date suffix
    finalSlug = `${finalSlug}-${getDateSuffix()}`;

    // Optional check for duplicate slugs
    const existingPost = await Post.findOne({ slug: finalSlug });
    if (existingPost) {
      return res.status(400).json({
        message: 'A post with this slug already exists. Please modify title/slug.'
      });
    }

    // Convert metaKeywords if present
    let keywordsArr = [];
    if (typeof metaKeywords === 'string') {
      keywordsArr = metaKeywords.split(',').map((kw) => kw.trim());
    } else if (Array.isArray(metaKeywords)) {
      keywordsArr = metaKeywords;
    }

    // Build the new post document
    const newPost = new Post({
      authorName,
      title,
      slug: finalSlug,
      summary,
      metaTitle,
      metaDescription,
      metaKeywords: keywordsArr,
      content,
      featureImage,
      status: status || 'draft',
      category: category || null,
      // Save tags (array of ObjectIds). If "tags" not provided, default to [].
      tags: Array.isArray(tags) ? tags : [],
    });

    await newPost.save();
    return res.status(201).json({
      message: 'Post created successfully!',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Failed to create post.' });
  }
};

/**
 * publishPost:
 * - If `id` is provided, update that post; otherwise create a new one.
 * - We handle `scheduledAt` if status === 'scheduled' or immediate publish if status === 'published'.
 * - Also handle `category`, `tags`, **and `authorName`** if needed.
 */
const publishPost = async (req, res) => {
  try {
    const {
      id,
      authorName,
      content,
      title,
      metaTitle,
      metaDescription,
      metaKeywords,
      summary,
      status,
      scheduledAt,
      slug,
      featureImage,
      category,
      tags,
    } = req.body;

    if (!content || !title || !status) {
      return res
        .status(400)
        .json({ message: 'Title, content, and status are required.' });
    }

    // Slug logic
    const base = slug || title;
    let finalSlug = formatSlug(base);
    finalSlug = stripDateSuffix(finalSlug);
    finalSlug = `${finalSlug}-${getDateSuffix()}`;

    let post;

    if (id) {
      // =========== Update existing post ===========
      post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      // Basic updates
      post.authorName = authorName || post.authorName;
      post.title = title;
      post.content = content;
      post.metaTitle = metaTitle;
      post.metaDescription = metaDescription;
      post.summary = summary;
      post.status = status;
      post.slug = finalSlug;
      post.featureImage = featureImage;
      post.category = category || null;

      // Convert metaKeywords
      if (typeof metaKeywords === 'string') {
        post.metaKeywords = metaKeywords.split(',').map((kw) => kw.trim());
      } else if (Array.isArray(metaKeywords)) {
        post.metaKeywords = metaKeywords;
      }

      // Save tags
      post.tags = Array.isArray(tags) ? tags : [];

      // Handle status
      if (status === 'published') {
        post.publishedAt = new Date();
        post.scheduledAt = null;
      } else if (status === 'scheduled') {
        if (!scheduledAt) {
          return res.status(400).json({ message: 'Scheduled date/time required.' });
        }
        const chosenTime = new Date(scheduledAt);
        const now = new Date();
        if (chosenTime < now) {
          return res.status(400).json({ message: 'Cannot schedule a post in the past!' });
        }
        post.scheduledAt = chosenTime;
        post.publishedAt = null;
      }

    } else {
      // =========== Create new post ===========
      let keywordsArr = [];
      if (typeof metaKeywords === 'string') {
        keywordsArr = metaKeywords.split(',').map((kw) => kw.trim());
      } else if (Array.isArray(metaKeywords)) {
        keywordsArr = metaKeywords;
      }

      const newScheduledAt = status === 'scheduled' && scheduledAt ? new Date(scheduledAt) : null;
      if (status === 'scheduled' && newScheduledAt) {
        const now = new Date();
        if (newScheduledAt < now) {
          return res.status(400).json({ message: 'Cannot schedule a post in the past!' });
        }
      }

      post = new Post({
        authorName,
        title,
        content,
        metaTitle,
        metaDescription,
        metaKeywords: keywordsArr,
        summary,
        status,
        slug: finalSlug,
        featureImage,
        category: category || null,
        tags: Array.isArray(tags) ? tags : [],
        publishedAt: status === 'published' ? new Date() : null,
        ...(status === 'scheduled' && newScheduledAt
          ? { scheduledAt: newScheduledAt }
          : {}),
      });
    }

    await post.save();
    return res.status(200).json({
      message: 'Post processed successfully.',
      post,
    });
  } catch (error) {
    console.error('Error handling post:', error);
    return res.status(500).json({
      message: 'An error occurred while processing the post.'
    });
  }
};

/**
 * updatePost:
 * Handles general updates, including changing status to 'trash'.
 */
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      authorName,
      title,
      slug,
      summary,
      metaTitle,
      metaDescription,
      metaKeywords,
      content,
      featureImage,
      status,
      scheduledAt,
      category,
      tags,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID.' });
    }

    // 1) Find existing post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // 2) If user is moving post to trash, skip title/content check
    if (status === 'trash') {
      post.status = 'trash';
      // Clear any published/scheduled fields if desired
      post.publishedAt = null;
      post.scheduledAt = null;
      post.updatedAt = Date.now();

      // Optionally store trash date or reason
      // post.trashedAt = new Date();

      await post.save();
      return res.status(200).json({
        message: 'Post moved to trash!',
        post,
      });
    }

    // 2a) If user is restoring from trash to draft, also skip title/content check
    //     (i.e., post already has status "trash", and we're setting "draft")
    if (post.status === 'trash' && status === 'draft') {
      post.status = 'draft';
      post.publishedAt = null;
      post.scheduledAt = null;
      post.updatedAt = Date.now();

      await post.save();
      return res.status(200).json({
        message: 'Post restored from trash to draft!',
        post,
      });
    }

    // 3) Otherwise, we still require title/content (for normal edits)
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: 'Title and content are required.' });
    }

    // ---------------- SLUG LOGIC ----------------
    const base = slug || title;
    let finalSlug = formatSlug(base);
    finalSlug = stripDateSuffix(finalSlug);
    finalSlug = `${finalSlug}-${getDateSuffix()}`;

    // ---------------- BASIC UPDATES ----------------
    post.authorName = authorName || post.authorName;
    post.title = title;
    post.slug = finalSlug;
    post.summary = summary;
    post.metaTitle = metaTitle;
    post.metaDescription = metaDescription;
    post.content = content;
    post.featureImage = featureImage;
    post.updatedAt = Date.now();
    post.category = category || null;

    // Convert metaKeywords if needed
    if (typeof metaKeywords === 'string') {
      post.metaKeywords = metaKeywords.split(',').map((kw) => kw.trim());
    } else if (Array.isArray(metaKeywords)) {
      post.metaKeywords = metaKeywords;
    }

    // If tags is an array, store it
    post.tags = Array.isArray(tags) ? tags : [];

    // ---------------- STATUS HANDLING ----------------
    if (status) {
      post.status = status;

      if (status === 'published') {
        post.publishedAt = new Date();
        post.scheduledAt = null;
      } else if (status === 'scheduled') {
        if (!scheduledAt) {
          return res
            .status(400)
            .json({ message: 'Scheduled date/time required.' });
        }
        const chosenTime = new Date(scheduledAt);
        const now = new Date();
        if (chosenTime < now) {
          return res
            .status(400)
            .json({ message: 'Cannot schedule a post in the past!' });
        }
        post.scheduledAt = chosenTime;
        post.publishedAt = null;
      } else if (status === 'draft') {
        post.publishedAt = null;
        post.scheduledAt = null;
      }
    }

    await post.save();

    return res.status(200).json({
      message: 'Post updated successfully!',
      post,
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ message: 'Failed to update post.' });
  }
};

/**
 * getAllPosts:
 * Returns posts filtered by status, authorName, category, month, or search.
 */
// controllers/postController.js
const getAllPosts = async (req, res) => {
  try {
    const { status, status_ne, authorName, month, search, categoryIn } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (status_ne) {
      query.status = { $ne: status_ne };
    }
    if (authorName) {
      query.authorName = { $regex: authorName, $options: 'i' };
    }
    if (month) {
      const [year, monthStr] = month.split('-');
      const start = new Date(+year, +monthStr - 1, 1);
      const end = new Date(+year, +monthStr, 1);
      query.createdAt = { $gte: start, $lt: end };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // NEW: if categoryIn is passed (comma-separated IDs)
    if (categoryIn) {
      const catArr = categoryIn.split(',');
      query.category = { $in: catArr };
    }

    const posts = await Post.find(query)
      .populate({
        path: 'category',
        populate: { path: 'parentCategory' },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
};


/**
 * getPostById:
 * Returns a single post by its _id.
 */
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID.' });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (post.status === 'trash') {
      return res.status(403).json({
        message: 'This post is in the trash and cannot be edited.',
      });
    }
    return res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ message: 'Failed to fetch post.' });
  }
};

/**
 * deletePost:
 * Removes a post by ID (permanently from the DB).
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID.' });
    }
    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    return res.status(200).json({ message: 'Post deleted successfully!' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Failed to delete post.' });
  }
};

module.exports = {
  createPost,
  publishPost,
  updatePost,
  getAllPosts,
  getPostById,
  deletePost,
};
