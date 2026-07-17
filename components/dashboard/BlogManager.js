import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit, Trash2, Eye, Clock } from 'lucide-react';
import axios from 'axios';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
];

export default function BlogManager({ user }) {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingBlog, setEditingBlog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const isAdmin = ['superadmin', 'admin', 'hr_admin', 'developer'].includes(user?.role?.toLowerCase());

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    featuredImageType: 'url',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    ogImage: '',
    category: '',
    tags: [],
    status: 'draft',
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const config = {
        withCredentials: true,
      };
      
      // Only add Authorization header if token exists in localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await axios.get(`/api/blogs?${params.toString()}`, config);

      if (response.data.success) {
        setBlogs(response.data.data.blogs || []);
        setPagination(response.data.data.pagination || pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch blogs');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/blogs/categories');
      if (response.data.success) {
        setCategories(response.data.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [fetchBlogs, fetchCategories]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData((prev) => ({
          ...prev,
          featuredImage: base64String,
          featuredImageType: 'upload',
        }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() && !formData.metaKeywords.includes(keywordInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  };

  // Remove keyword
  const removeKeyword = (keyword) => {
    setFormData((prev) => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter((k) => k !== keyword),
    }));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      featuredImageType: 'url',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
      ogImage: '',
      category: '',
      tags: [],
      status: 'draft',
    });
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Open edit modal
  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      featuredImage: blog.featuredImage || '',
      featuredImageType: blog.featuredImageType || 'url',
      metaTitle: blog.metaTitle || '',
      metaDescription: blog.metaDescription || '',
      metaKeywords: blog.metaKeywords || [],
      ogImage: blog.ogImage || '',
      category: blog.category || '',
      tags: blog.tags || [],
      status: blog.status || 'draft',
    });
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  // Save blog
  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.excerpt.trim()) {
      setError('Excerpt is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }
    if (!formData.category.trim()) {
      setError('Category is required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const url = editingBlog ? `/api/blogs/${editingBlog.id}` : '/api/blogs';
      const method = editingBlog ? 'put' : 'post';
      const payload = { ...formData };

      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Only add Authorization header if token exists in localStorage
      // Otherwise, rely on cookies for authentication
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios[method](url, payload, config);

      if (response.data.success) {
        setSuccess(editingBlog ? 'Blog updated successfully' : 'Blog created successfully');
        setIsModalOpen(false);
        fetchBlogs();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save blog';
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete blog
  const handleDelete = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const config = {
        withCredentials: true,
      };

      // Only add Authorization header if token exists in localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      await axios.delete(`/api/blogs/${blogId}`, config);
      setSuccess('Blog deleted successfully');
      fetchBlogs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete blog';
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(errorMessage);
      }
    }
  };

  // Publish blog
  const handlePublish = async (blogId) => {
    try {
      const config = {
        withCredentials: true,
      };

      // Only add Authorization header if token exists in localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await axios.patch(
        `/api/blogs/${blogId}`,
        { action: 'publish' },
        config
      );
      if (response.data.success) {
        setSuccess('Blog published successfully');
        fetchBlogs();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to publish blog';
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(errorMessage);
      }
    }
  };

  // Filter change
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="blog-manager">
      <div className="manager-header">
        <div>
          <h2>Blog Management</h2>
          <p>Create, manage, and publish SEO-optimized blog posts.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="icon-inline" size={18} />
          Create New Blog
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {/* Filters */}
      <div className="blog-filters">
        <input
          type="text"
          placeholder="Search blogs..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="filter-input"
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Blog List */}
      {isLoading ? (
        <div className="loading">Loading blogs...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">
          <p>No blogs found. Start by creating one!</p>
        </div>
      ) : (
        <div className="blogs-grid">
          {blogs.map((blog) => (
            <div key={blog.id} className={`blog-card ${blog.status === 'published' ? 'published' : ''}`}>
              <div className="card-header">
                <span className={`status-badge status-${blog.status}`}>
                  {blog.status}
                </span>
                <div className="card-actions">
                  <button onClick={() => openEditModal(blog)} className="icon-btn" title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="icon-btn delete" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3>{blog.title}</h3>
              {blog.excerpt && <p className="blog-excerpt">{blog.excerpt}</p>}
              
              <div className="card-footer">
                <div className="blog-meta">
                  <span className="category-tag">{blog.category || 'Uncategorized'}</span>
                  <span className="meta-item">
                    <Eye size={14} className="icon-inline" />
                    {blog.views || 0}
                  </span>
                  {blog.readingTime && (
                    <span className="meta-item">
                      <Clock size={14} className="icon-inline" />
                      {blog.readingTime} min
                    </span>
                  )}
                </div>
                {isAdmin && blog.status !== 'published' && (
                  <button onClick={() => handlePublish(blog.id)} className="btn-publish">
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBlog ? 'Edit Blog' : 'Create New Blog'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Blog title"
                />
              </div>

              <div className="form-group">
                <label>Excerpt *</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Short description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Blog content"
                  rows="10"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Technology, Business"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>Featured Image</label>
                <select
                  name="featuredImageType"
                  value={formData.featuredImageType}
                  onChange={handleInputChange}
                >
                  <option value="url">Image URL</option>
                  <option value="upload">Upload Image</option>
                </select>
                {formData.featuredImageType === 'url' ? (
                  <input
                    type="url"
                    name="featuredImage"
                    value={formData.featuredImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                )}
                {formData.featuredImage && (
                  <img
                    src={formData.featuredImage}
                    alt="Preview"
                    className="image-preview"
                  />
                )}
              </div>

              <div className="form-group">
                <label>Meta Title (SEO)</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="SEO title (max 60 chars)"
                  maxLength={60}
                />
                <small>{formData.metaTitle.length}/60</small>
              </div>

              <div className="form-group">
                <label>Meta Description (SEO)</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  placeholder="SEO description (max 160 chars)"
                  rows="3"
                  maxLength={160}
                />
                <small>{formData.metaDescription.length}/160</small>
              </div>

              <div className="form-group">
                <label>Meta Keywords</label>
                <div className="keyword-input">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add keyword and press Enter"
                  />
                  <button type="button" onClick={addKeyword}>Add</button>
                </div>
                <div className="keyword-tags">
                  {formData.metaKeywords.map((keyword) => (
                    <span key={keyword} className="tag">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="tag-remove-btn">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tag-input">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag and press Enter"
                  />
                  <button type="button" onClick={addTag}>Add</button>
                </div>
                <div className="tag-list">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="tag-remove-btn">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {!isAdmin && formData.status === 'published' && (
                  <small className="warning">
                    You don't have permission to publish. Status will be set to "Pending Review".
                  </small>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                {isSaving ? 'Saving...' : editingBlog ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .blog-manager {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
          padding: 2rem;
          border-radius: 1.5rem;
          border: 2px solid rgba(139, 92, 246, 0.2);
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .manager-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.25rem;
        }
        .manager-header p {
          color: #6366f1;
          font-weight: 500;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
          background: linear-gradient(135deg, #7c3aed, #2563eb);
        }
        .icon-inline {
          display: inline-block;
          vertical-align: middle;
        }

        .blog-filters {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-input,
        .filter-select {
          padding: 0.875rem 1.125rem;
          border: 2px solid rgba(139, 92, 246, 0.2);
          border-radius: 0.75rem;
          font-size: 0.95rem;
          background: white;
          color: #1e293b;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
        }
        .filter-input:hover,
        .filter-select:hover {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .filter-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b5cf6' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
        .filter-input {
          flex: 1;
          min-width: 200px;
        }

        .blogs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.75rem;
        }

        .blog-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
          padding: 1.75rem;
          border-radius: 1.25rem;
          border: 2px solid rgba(139, 92, 246, 0.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.12), 0 2px 4px rgba(59, 130, 246, 0.08);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(139, 92, 246, 0.2), 0 4px 8px rgba(59, 130, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .blog-card.published {
          background: linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 250, 0.95));
          border-color: rgba(16, 185, 129, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .card-actions {
          display: flex;
          gap: 0.5rem;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 0.5rem;
          border-radius: 0.375rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        .icon-btn.delete:hover {
          color: #ef4444;
          background: #fef2f2;
        }

        .status-badge {
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
        }
        .status-draft {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.1));
          color: #6b7280;
          border-color: rgba(107, 114, 128, 0.3);
        }
        .status-pending {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.1));
          color: #92400e;
          border-color: rgba(245, 158, 11, 0.3);
        }
        .status-published {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.1));
          color: #065f46;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .blog-card h3 {
          margin: 0 0 0.5rem 0;
          color: #0f172a;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .blog-excerpt {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }
        .blog-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .category-tag {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15));
          color: #6366f1;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        .meta-item {
          font-size: 0.85rem;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .btn-publish {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        .btn-publish:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .alert {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        .alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .alert.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
          border-radius: 1.25rem;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3), 0 8px 24px rgba(59, 130, 246, 0.2);
          border: 2px solid rgba(139, 92, 246, 0.2);
          animation: slideDown 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid rgba(139, 92, 246, 0.1);
        }
        .modal-header h3 {
          margin: 0;
          color: #6366f1;
          font-weight: 700;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #f3f4f6;
          color: #111;
        }
        .tag-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 0.125rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.125rem;
          transition: all 0.2s;
          margin-left: 0.25rem;
        }
        .tag-remove-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #dc2626;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.65rem;
          font-weight: 600;
          color: #4f46e5;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.875rem 1.125rem;
          border: 2px solid rgba(139, 92, 246, 0.2);
          border-radius: 0.75rem;
          font-family: inherit;
          font-size: 0.95rem;
          background: #ffffff;
          color: #1e293b;
          transition: all 0.3s ease;
        }
        .form-group input:hover,
        .form-group textarea:hover,
        .form-group select:hover {
          border-color: rgba(139, 92, 246, 0.4);
          background: #fefefe;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
          background: #ffffff;
        }
        .form-group select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b5cf6' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #94a3b8;
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #666;
        }

        .keyword-input,
        .tag-input {
          display: flex;
          gap: 0.5rem;
        }

        .keyword-input input,
        .tag-input input {
          flex: 1;
        }

        .keyword-tags,
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: #e5e7eb;
          border-radius: 12px;
          font-size: 0.875rem;
        }

        .tag button {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
        }

        .image-preview {
          max-width: 200px;
          max-height: 200px;
          margin-top: 0.5rem;
          border-radius: 4px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 2px solid rgba(139, 92, 246, 0.1);
        }
        .btn-secondary {
          background: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          font-weight: 500;
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem;
          background: white;
          border-radius: 1rem;
          border: 2px dashed #cbd5e1;
          color: #64748b;
        }
        .empty-state p {
          margin: 0;
          font-size: 1.1rem;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .blogs-grid {
            grid-template-columns: 1fr;
          }
          .blog-filters {
            flex-direction: column;
          }
          .filter-input {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}






