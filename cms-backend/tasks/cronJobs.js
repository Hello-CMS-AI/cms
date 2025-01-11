const cron = require('node-cron');
const Post = require('../models/Post'); // Import the Post model
const dayjs = require('dayjs');

// Define your cron job to check for posts that need to be published
const schedulePostPublish = () => {
  cron.schedule('*/1 * * * *', async () => {  // Runs every minute
    const now = dayjs().toISOString();
    
    try {
      // Find posts that are scheduled for publishing and haven't been published yet
      const postsToPublish = await Post.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
        publishedAt: null
      });

      if (postsToPublish.length > 0) {
        postsToPublish.forEach(async (post) => {
          post.status = 'published';    // Set status to 'published'
          post.publishedAt = now;       // Set the current time as published time
          await post.save();            // Save the post
          console.log(`Post "${post.title}" published at ${now}`);
        });
      } else {
        console.log('No posts to publish at this time.');
      }
    } catch (error) {
      console.error('Error publishing posts:', error);
    }
  });
};

// Start the cron job
schedulePostPublish();
