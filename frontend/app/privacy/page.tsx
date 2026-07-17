import type { Metadata } from "next";
import { buildOgMetadata, buildTwitterMetadata, canonicalUrl, seoConfig } from "@/lib/seo";
import ContentPage, { H2, P, UL } from "@/components/seo/ContentPage";

const title = "Privacy Policy";
const description =
  "How DevUp Ecosystem and DEVTHON collect, use, and protect your personal data. Read our privacy policy covering registration data, cookies, third-party services, and your rights.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("/privacy") },
  openGraph: buildOgMetadata({ title, description, path: "/privacy" }),
  twitter: buildTwitterMetadata({ title, description }),
};

export default function PrivacyPage() {
  return (
    <ContentPage
      kicker="LEGAL"
      title="Privacy Policy"
      intro={`How ${seoConfig.siteName} handles your data across DEVTHON and our platform.`}
      breadcrumb={[{ name: "Privacy Policy", path: "/privacy" }]}
      lastUpdated="18 July 2026"
    >
      <P>
        {seoConfig.siteName} (&quot;we&quot;, &quot;us&quot;) operates devupecosystem.com and the
        DEVTHON hackathon. This policy explains what data we collect, why, and how we protect it.
        By using our website and registering for our events, you agree to this policy.
      </P>

      <H2>Information we collect</H2>
      <UL
        items={[
          "Registration details you provide — name, email, phone, college, and team information",
          "Profile and submission content you upload when participating in hackathons",
          "Technical data such as device, browser, and anonymized usage analytics",
          "Cookies and similar technologies used to keep you signed in and improve the site",
        ]}
      />

      <H2>How we use your information</H2>
      <UL
        items={[
          "To operate DEVTHON — manage registrations, teams, submissions, and results",
          "To communicate event updates, schedules, and opportunities you opted into",
          "To connect standout participants with internships, placements, and incubation",
          "To improve our website, security, and services",
        ]}
      />

      <H2>Third-party services</H2>
      <P>
        We use trusted third-party providers for authentication, hosting, and analytics. These
        providers process data only as needed to deliver their service and under their own privacy
        commitments. We do not sell your personal data.
      </P>

      <H2>Data retention & security</H2>
      <P>
        We retain personal data only as long as necessary for the purposes described here or as
        required by law, and we apply reasonable technical and organizational measures to protect
        it. No method of transmission or storage is completely secure, but we work continuously to
        safeguard your information.
      </P>

      <H2>Your rights</H2>
      <P>
        You may request access to, correction of, or deletion of your personal data, and you may
        opt out of non-essential communications at any time. To exercise these rights, contact us
        at devupecosystem@gmail.com.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about this policy? Email devupecosystem@gmail.com. We are based in Hyderabad,
        Telangana, India.
      </P>
    </ContentPage>
  );
}
