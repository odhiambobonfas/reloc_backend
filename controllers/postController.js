const Post = require('../models/Post.model');

exports.createPost = async (req, res) => {
  try {
    console.log('📝 Creating post with data:', {
      body: req.body,
      file: req.file ? req.file.filename : 'No file',
      headers: req.headers
    });

    const { uid, content, type } = req.body;
    
    // Validate required fields
    if (!uid) {
      console.error('❌ Missing uid');
      return res.status(400).json({ error: "uid is required" });
    }
    
    if (!content && !req.file) {
      console.error('❌ Missing content and media');
      return res.status(400).json({ error: "Content or media is required" });
    }

    if (!type) {
      console.error('❌ Missing type');
      return res.status(400).json({ error: "Post type is required" });
    }

    let media_url = null;

    if (req.file) {
      media_url = `/uploads/${req.file.filename}`;
      console.log('📁 Media file uploaded:', media_url);
    }

    console.log('💾 Saving post to database:', {
      uid,
      content: content || '',
      type,
      media_url
    });

    const post = await Post.create({
      uid,
      content: content || '',
      type,
      media_url,
    });

    console.log('✅ Post created successfully:', post);

    res.status(201).json({ 
      success: true, 
      post,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Send more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Server error occurred while creating post';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    console.log('📖 Fetching posts with query:', req.query);
    
    const { limit, offset, type } = req.query;
    const posts = await Post.findAll(limit, offset, type);

    console.log(`✅ Fetched ${posts.length} posts`);
    res.json({ data: posts });
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    console.error("❌ Error stack:", error.stack);
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Server error occurred while fetching posts';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
