import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";

const posts = [
  {
    slug: "hawaii-luxury-market-2026",
    title: "Hawaii luxury market outlook 2026",
    date: "Mar 1, 2026",
    image: "/images/blog/blog-grid-1.jpg",
  },
  {
    slug: "oceanfront-buying-guide",
    title: "Guide to buying oceanfront property",
    date: "Feb 12, 2026",
    image: "/images/blog/blog-grid-2.jpg",
  },
];

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <SiteLayout>
      <div className="page-title style-1">
        <div className="tf-container">
          <h1 className="title">Blog</h1>
          <p className="text-1">News and insights from the Hawaii real estate market.</p>
        </div>
      </div>
      <section className="tf-spacing-1">
        <div className="tf-container">
          <div className="row g-30">
            {posts.map((post) => (
              <div key={post.slug} className="col-md-6">
                <article className="box-blog hover-img">
                  <Link href="/blog">
                    <img src={post.image} alt={post.title} />
                  </Link>
                  <div className="content p-20">
                    <span className="text-2">{post.date}</span>
                    <h5 className="title mt-8">
                      <Link href="/blog">{post.title}</Link>
                    </h5>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
