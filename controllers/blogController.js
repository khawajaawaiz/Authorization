import blogModel from '../models/blogModel.js';

const blogController = {
    // 1. Create Post
    async createPost(req, res) {
        try {
            const { title, content, status } = req.body;
            
            // Validate input
            if (!title || !content) {
                return res.status(400).send('Title and content are required');
            }

            // Create post (author_id comes from req.user set by auth middleware)
            const newPost = await blogModel.create(
                title, 
                content, 
                req.user.id, 
                status || 'draft'
            );

            // Redirect to my-posts page
            res.redirect('/blog/my-posts');

        } catch (error) {
            console.error('Create Post Error:', error);
            res.status(500).send('Error creating post');
        }
    },

    // 2. Get All Public Posts
    async getAllPosts(req, res) {
        try {
            // Fetch only published posts for public view
            const posts = await blogModel.findAll({ status: 'published' });
            
            res.render('blogs/index', { 
                posts: posts,
                user: req.user, // Pass user for header logic 
                title: 'All Blog Posts'
            });

        } catch (error) {
            console.error('Get All Posts Error:', error);
            res.status(500).send('Error fetching posts');
        }
    },

    // 3. Get My Posts (Author Dashboard)
    async getMyPosts(req, res) {
        try {
            // Fetch all posts by this author (drafts + published)
            const posts = await blogModel.findAll({ author_id: req.user.id });
            
            res.render('blogs/my-posts', { 
                posts: posts,
                user: req.user
            });

        } catch (error) {
            console.error('Get My Posts Error:', error);
            res.status(500).send('Error fetching your posts');
        }
    },

    // 4. Get Single Post
    async getPostById(req, res) {
        try {
            const post = await blogModel.findById(req.params.id);

            if (!post) {
                return res.status(404).send('Post not found');
            }

            // Authorization Check for Drafts
            // If post is draft, ONLY author or admin can view
            if (post.status === 'draft') {
                // If user not logged in -> Deny
                if (!req.user) {
                    return res.status(403).send('Access Denied');
                }
                
                // If logged in but not author AND not admin -> Deny
                if (post.author_id !== req.user.id && req.user.role !== 'admin') {
                    return res.status(403).send('Access Denied: Private Draft');
                }
            }

            res.render('blogs/show', { 
                post: post,
                user: req.user
            });

        } catch (error) {
            console.error('Get Post Error:', error);
            res.status(500).send('Error fetching post');
        }
    },

    // 5. Update Post
    async updatePost(req, res) {
        try {
            // Ownership check is likely handled by middleware 'checkOwnership'
            // But we can double check or rely on middleware.
            // Assuming middleware passed 'req.resource' or checked it.
            
            // If checkOwnership middleware is used, we proceed safe.
            const { title, content, status } = req.body;
            
            await blogModel.update(req.params.id, {
                title,
                content,
                status
            });

            res.redirect('/blog/my-posts');

        } catch (error) {
            console.error('Update Post Error:', error);
            res.status(500).send('Error updating post');
        }
    },

    // 6. Delete Post
    async deletePost(req, res) {
        try {
            // Ownership check handled by middleware
            await blogModel.delete(req.params.id);
            res.redirect('/blog/my-posts');

        } catch (error) {
            console.error('Delete Post Error:', error);
            res.status(500).send('Error deleting post');
        }
    },

    // 7. Publish Post (Quick Action)
    async publishPost(req, res) {
        try {
            await blogModel.update(req.params.id, { status: 'published' });
            res.redirect('/blog/my-posts');

        } catch (error) {
            console.error('Publish Post Error:', error);
            res.status(500).send('Error publishing post');
        }
    },

    // 8. Render Create Form
    renderCreateForm(req, res) {
        res.render('blogs/create', { user: req.user });
    },

    // 9. Render Edit Form
    async renderEditForm(req, res) {
        try {
            // Assuming middleware checks ownership, so we can just fetch
            // But we need to fetch to populate the form
            // Middleware checkOwnership fetches it too... 
            // If middleware attaches to req.resource, use that.
            
            let post = req.resource;
            if (!post) {
                post = await blogModel.findById(req.params.id);
            }

            res.render('blogs/edit', { 
                post: post,
                user: req.user
            });
        } catch (error) {
            res.status(500).send('Error loading form');
        }
    }
};

export default blogController;
