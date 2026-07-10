import Link from "next/link";

type SearchPagerProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function SearchPager({ page, totalPages, buildHref }: SearchPagerProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav className="reovana-search-pager" aria-label="Search results pages">
      <p className="reovana-search-pager__meta">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </p>
      <div className="reovana-search-pager__controls">
        {prevDisabled ? (
          <span className="reovana-search-pager__btn is-disabled" aria-disabled="true">
            Previous
          </span>
        ) : (
          <Link className="reovana-search-pager__btn" href={buildHref(page - 1)} prefetch>
            Previous
          </Link>
        )}
        {nextDisabled ? (
          <span className="reovana-search-pager__btn reovana-search-pager__btn--primary is-disabled" aria-disabled="true">
            Next
          </span>
        ) : (
          <Link
            className="reovana-search-pager__btn reovana-search-pager__btn--primary"
            href={buildHref(page + 1)}
            prefetch
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
