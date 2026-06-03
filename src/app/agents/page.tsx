import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";

const agents = [
  {
    name: "Kai Nakamura",
    role: "Senior Agent — Oahu",
    image: "/images/avatar/avatar-1.jpg",
  },
  {
    name: "Leilani Cruz",
    role: "Luxury Specialist — Maui",
    image: "/images/avatar/avatar-2.jpg",
  },
  {
    name: "Noah Williams",
    role: "Investment Properties",
    image: "/images/avatar/avatar-3.jpg",
  },
];

export const metadata = { title: "Agents" };

export default function AgentsPage() {
  return (
    <SiteLayout>
      <div className="page-title style-1">
        <div className="tf-container">
          <h1 className="title">Our agents</h1>
          <p className="text-1">Meet the team behind Proty Hawaii.</p>
        </div>
      </div>
      <section className="tf-spacing-1">
        <div className="tf-container">
          <div className="row tf-layout-mobile-md md-col-2 lg-col-3 g-30">
            {agents.map((agent) => (
              <div key={agent.name} className="col-md-6 col-lg-4">
                <div className="box-agent hover-img text-center p-20">
                  <div className="avatar mb-12">
                    <img src={agent.image} alt={agent.name} width={120} height={120} />
                  </div>
                  <h5 className="title">
                    <Link href="/contact">{agent.name}</Link>
                  </h5>
                  <p className="text-1">{agent.role}</p>
                  <Link href="/contact" className="tf-btn style-border pd-4 mt-12">
                    Contact
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
