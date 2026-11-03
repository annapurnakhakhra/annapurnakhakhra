import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { cmsService } from '../services/cms';
import { stripHtml } from '../utils/text';

export const Blog: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlogHandle, setSelectedBlogHandle] = useState('news');

  useEffect(() => {
    cmsService.getBlogs().then((data) => {
      setBlogs(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    cmsService.getBlogPosts(selectedBlogHandle).then((res) => {
      const postList = Array.isArray(res) ? res : res?.posts || [];
      setPosts(postList);
      setLoading(false);
    });
  }, [selectedBlogHandle]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="bg-amber-100 text-[#7d4b0e] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-block">
          Annapurna Stories & Recipes
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#7d4b0e] font-serif">
          Khakhra Heritage & Health Articles
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Discover authentic Gujarati snacking traditions, health benefits of roasted khakhra, ghee crafting, and recipe ideas!
        </p>
      </div>

      {/* Blog Selector Tabs */}
      {blogs.length > 1 && (
        <div className="flex justify-center gap-3 border-b border-amber-200/60 pb-4">
          {blogs.map((b) => (
            <button
              key={b.id || b.handle}
              onClick={() => setSelectedBlogHandle(b.handle)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedBlogHandle === b.handle
                ? 'bg-[#7d4b0e] text-white shadow-md'
                : 'bg-amber-50 text-slate-700 hover:bg-amber-100'
                }`}
            >
              {b.title || b.name || 'News & Articles'}
            </button>
          ))}
        </div>
      )}

      {/* Blog Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 bg-amber-50/50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto">
          <BookOpen className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#7d4b0e]">No Articles Found</h3>
          <p className="text-xs text-slate-500">Check back soon for new recipes and heritage stories!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => {
            const handle = post.handle || post.slug || `post-${idx}`;
            const title = post.title || 'Authentic Khakhra Secrets';
            const image = post.image?.image_url || post.image_url || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';
            const rawContent = post.summary || post.excerpt || post.content || '';
            const cleanText = stripHtml(rawContent);
            const excerpt = cleanText ? (cleanText.length > 130 ? cleanText.slice(0, 130) + '...' : cleanText) : 'Learn about traditional roasting methods and spices...';
            const date = post.published_at || post.created_at ? new Date(post.published_at || post.created_at).toLocaleDateString() : 'Annapurna Journal';

            return (
              <article
                key={post.id || handle || idx}
                className="bg-white border border-orange-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="aspect-[16/10] overflow-hidden bg-amber-50">
                    <img
                      src={image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        Annapurna Craftsmen
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 font-serif leading-snug group-hover:text-[#7d4b0e] transition-colors">
                      {title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <Link
                    to={`/blog/${handle}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7d4b0e] hover:text-orange-600 transition-colors"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Blog;
