import HeroSection from "@/components/ui/hero-section-with-smooth-bg-shader";
import Navbar from "@/components/Navbar";
import UserGrid from "@/components/UserGrid";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Navbar overlays the hero */}
      <Navbar />

      {/* Hero Section with Gradient Background */}
      <HeroSection />

      {/* Online Users Section */}
      <section className="py-16 px-4 lg:px-6 bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
              People Online Now
            </h2>
            <p className="text-lg text-muted-foreground">
              Connect with users from around the world
            </p>
          </div>
          <UserGrid />
        </div>
      </section>

      <ScrollReveal>
        <FeaturesSection />
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <FAQSection />
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default Index;
