import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
}

const SEO = ({ title, description }: SEOProps) => {
  const defaultTitle = "DG MITRA FOR ALL | Premium Eco-Luxury Customization";
  const defaultDescription = "Sustainable upcycling for your favorite clothes. Give your wardrobe a second life with AI-powered design and premium craftsmanship.";

  const finalTitle = title ? `${title} | DG MITRA FOR ALL` : defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
    </Helmet>
  );
};

export default SEO;
