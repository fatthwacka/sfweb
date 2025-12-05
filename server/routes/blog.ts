import { Router } from 'express';
import { db } from '../db';
import {
  blogPosts,
  blogCategories,
  blogTags,
  blogPostTags,
  insertBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogTagSchema
} from '@shared/schema';
import { eq, desc, and, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Get all blog posts with filtering
router.get('/posts', async (req, res) => {
  try {
    const { status, category, search, limit = '20', offset = '0' } = req.query;
    
    let query = db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        coverImage: blogPosts.coverImage,
        postImage1: blogPosts.postImage1,
        postImage2: blogPosts.postImage2,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        viewCount: blogPosts.viewCount,
        aiGenerated: blogPosts.aiGenerated,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        categoryId: blogPosts.categoryId,
        authorId: blogPosts.authorId,
        seoTitle: blogPosts.seoTitle,
        seoDescription: blogPosts.seoDescription
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));

    // Apply filters
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(blogPosts.status, status as string));
    }
    
    if (category) {
      conditions.push(eq(blogPosts.categoryId, category as string));
    }
    
    if (search) {
      conditions.push(ilike(blogPosts.title, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.limit(limitNum).offset(offsetNum);

    const posts = await query;
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get single blog post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count
    await db
      .update(blogPosts)
      .set({ viewCount: post.viewCount + 1 })
      .where(eq(blogPosts.id, id));

    res.json({ ...post, viewCount: post.viewCount + 1 });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Helper: Generate concise slug from title
const generateSlug = (title: string): string => {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'your', 'our', 'their', 'his', 'her', 'its', 'my', 'this', 'that',
    'these', 'those', 'what', 'which', 'who', 'whom', 'how', 'why', 'when',
    'where', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'about', 'just', 'only', 'very', 'also', 'well', 'back', 'even',
    'still', 'way', 'take', 'make', 'get', 'got', 'getting', 'tips', 'guide'
  ]);

  const words = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Take first 3-4 meaningful words for a concise slug
  return words.slice(0, 4).join('-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'untitled';
};

// Create new blog post
router.post('/posts', async (req, res) => {
  try {
    // TODO: Get authenticated user from session - for now use admin as fallback
    const adminProfileId = '070dae19-d4ce-4fe0-b3d4-a090fa3ece3a'; // admin@slyfox.co.za

    // Generate slug from title if not provided
    const slug = req.body.slug?.trim() || generateSlug(req.body.title || 'untitled');

    const postData = {
      ...req.body,
      slug,
      authorId: req.body.authorId || adminProfileId
    };

    const validatedData = insertBlogPostSchema.parse(postData);

    // Handle publishedAt field separately (not in schema validation)
    let publishedAt = null;
    if (req.body.publishedAt) {
      if (typeof req.body.publishedAt === 'string') {
        publishedAt = new Date(req.body.publishedAt);
      } else if (req.body.publishedAt instanceof Date) {
        publishedAt = req.body.publishedAt;
      }
    }

    // Set published date if status is published and no custom date provided
    if (validatedData.status === 'published' && !publishedAt) {
      publishedAt = new Date();
    }

    // Add publishedAt to validated data if we have one
    if (publishedAt) {
      validatedData.publishedAt = publishedAt;
    }

    const [newPost] = await db
      .insert(blogPosts)
      .values(validatedData)
      .returning();

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Update blog post
router.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertBlogPostSchema.partial().parse(req.body);

    // Handle publishedAt field separately (not in schema validation)
    let publishedAt = undefined;
    if (req.body.publishedAt !== undefined) {
      if (typeof req.body.publishedAt === 'string') {
        publishedAt = new Date(req.body.publishedAt);
      } else if (req.body.publishedAt instanceof Date) {
        publishedAt = req.body.publishedAt;
      }
    }

    // Update slug if title changed and no custom slug provided
    if (validatedData.title && !validatedData.slug) {
      validatedData.slug = generateSlug(validatedData.title);
    }

    // Set/update published date if changing to published and no custom date provided
    if (validatedData.status === 'published' && publishedAt === undefined) {
      const [currentPost] = await db
        .select({ publishedAt: blogPosts.publishedAt })
        .from(blogPosts)
        .where(eq(blogPosts.id, id));
      
      if (!currentPost?.publishedAt) {
        publishedAt = new Date();
      }
    }

    // Add publishedAt to validated data if we have one
    if (publishedAt !== undefined) {
      validatedData.publishedAt = publishedAt;
    }

    validatedData.updatedAt = new Date();

    const [updatedPost] = await db
      .update(blogPosts)
      .set(validatedData)
      .where(eq(blogPosts.id, id))
      .returning();

    if (!updatedPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedPost] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();

    if (!deletedPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.isActive, true))
      .orderBy(blogCategories.displayOrder, blogCategories.name);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const validatedData = insertBlogCategorySchema.parse(req.body);
    
    // Generate slug if not provided
    if (!validatedData.slug) {
      validatedData.slug = validatedData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    const [newCategory] = await db
      .insert(blogCategories)
      .values(validatedData)
      .returning();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Get all tags with usage count
router.get('/tags', async (req, res) => {
  try {
    const { popular } = req.query;
    
    let query = db
      .select()
      .from(blogTags)
      .orderBy(desc(blogTags.usageCount), blogTags.name);

    if (popular) {
      query = query.limit(10);
    }

    const tags = await query;
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create or get tag
router.post('/tags', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

    // Check if tag exists
    const [existingTag] = await db
      .select()
      .from(blogTags)
      .where(eq(blogTags.slug, slug));

    if (existingTag) {
      return res.json(existingTag);
    }

    // Create new tag
    const [newTag] = await db
      .insert(blogTags)
      .values({ name, slug })
      .returning();

    res.status(201).json(newTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

export default router;