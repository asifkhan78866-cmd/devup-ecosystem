import JsonLd from "@/components/seo/JsonLd";
import { seoConfig, canonicalUrl } from "@/lib/seo";

export interface BreadcrumbItem {
  name: string;
  /** Path relative to baseUrl, e.g. "/ecosystem" */
  path: string;
}

/**
 * BreadcrumbJsonLd — Generic BreadcrumbList structured data.
 * Generates the JSON-LD that shows breadcrumb trails in Google SERPs.
 *
 * Usage:
 *   <BreadcrumbJsonLd
 *     items={[
 *       { name: "Ventures", path: "/ecosystem" },
 *       { name: "Zappy", path: "/ecosystem/abc123" },
 *     ]}
 *   />
 *
 * The "Home" breadcrumb is always prepended automatically.
 */
export default function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    ...items,
  ];

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };

  return <JsonLd data={data} />;
}
