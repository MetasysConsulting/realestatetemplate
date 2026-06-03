import Link from "next/link";
import type { Property } from "@/lib/properties";

type PropertyCardProps = {
  property: Property;
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="box-house hover-img">
      <div className="image-wrap">
        <Link href={`/properties/${property.id}`}>
          <img src={property.image} alt={property.title} />
        </Link>
        <ul className="box-tag flex gap-8">
          {property.tags.map((tag) => (
            <li
              key={tag}
              className={`flat-tag text-4 fw-6 text_white ${
                tag === "Featured" ? "bg-main" : "bg-3"
              }`}
            >
              {tag}
            </li>
          ))}
        </ul>
        <div className="list-btn flex gap-8">
          <a href="#" className="btn-icon save hover-tooltip" aria-label="Save">
            <i className="icon-save" />
            <span className="tooltip">Add Favorite</span>
          </a>
          <Link
            href={`/properties/${property.id}`}
            className="btn-icon find hover-tooltip"
            aria-label="Quick view"
          >
            <i className="icon-find-plus" />
            <span className="tooltip">Quick View</span>
          </Link>
        </div>
      </div>
      <div className="content">
        <h5 className="title">
          <Link href={`/properties/${property.id}`}>{property.title}</Link>
        </h5>
        <p className="location text-1 line-clamp-1">
          <i className="icon-location" /> {property.location}
        </p>
        <ul className="meta-list flex">
          <li className="text-1 flex">
            <span>{property.beds}</span>Beds
          </li>
          <li className="text-1 flex">
            <span>{property.baths}</span>Baths
          </li>
          <li className="text-1 flex">
            <span>{property.sqft.toLocaleString()}</span>Sqft
          </li>
        </ul>
        <div className="bot flex justify-between items-center">
          <h5 className="price">{property.price}</h5>
          <div className="wrap-btn flex">
            <a href="#" className="compare flex gap-8 items-center text-1">
              <i className="icon-compare" />
              Compare
            </a>
            <Link
              href={`/properties/${property.id}`}
              className="tf-btn style-border pd-4"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
