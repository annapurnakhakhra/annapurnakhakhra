import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, BookOpen } from 'lucide-react';
import { cmsService } from '../services/cms';
import { hasHtml } from '../utils/text';

export const BlogPostDetail: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) {
      setLoading(true);
      cmsService
        .getBlogPostByHandle(handle)
        .then((data) => {
          setPost(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching blog post:', err);
          setLoading(false);
        });
    }
  }, [handle]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="h-96 bg-amber-50/50 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Article Not Found</h2>
        <Link to="/blog" className="text-[#7d4b0e] font-semibold underline">Back to All Articles</Link>
      </div>
    );
  }

  const title = post.title || 'Annapurna Blog Article';
  const image = post.image?.url || post.featured_image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80';
  const content = post.body || post.content || post.description || 'Full article content coming soon...';
  const date = post.published_at || post.created_at ? new Date(post.published_at || post.created_at).toLocaleDateString() : 'Annapurna Journal';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Journal</span>
      </Link>

      {/* Article Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            {date}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4 text-amber-600" />
            {post.author || 'Annapurna Kitchen'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif leading-tight">
          {title}
        </h1>
      </div>

      {/* Featured Image */}
      <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-amber-50 border border-orange-100 shadow-md">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      {hasHtml(content) ? (
        <div
          className="rich-article-content prose prose-amber max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-4 [&_img]:rounded-2xl [&_img]:max-w-full [&_img]:h-auto [&_img]:my-6 [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#7d4b0e] [&_h2]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#7d4b0e] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="prose prose-amber max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-4">
          {content.split('\n').map((paragraph: string, i: number) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPostDetail;
