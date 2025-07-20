import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { PricingSection } from "@/components/sections/pricing-section";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, Download, Camera, Video } from "lucide-react";

const additionalServices = [
  {
    icon: Camera,
    title: "Additional Hours",
    price: "R750/hour",
    description: "Extend your coverage beyond the package duration"
  },
  {
    icon: Video,
    title: "Videography Add-on",
    price: "From R3,500",
    description: "Add professional videography to any photography package"
  },
  {
    icon: Download,
    title: "Rush Delivery",
    price: "R1,500",
    description: "Get your edited photos within 48 hours"
  }
];

const faqs = [
  {
    question: "What's included in all packages?",
    answer: "All packages include professional editing, online gallery access, high-resolution downloads, and print release rights."
  },
  {
    question: "How long does editing take?",
    answer: "Standard delivery is 2-3 weeks for photography and 3-4 weeks for videography. Rush delivery is available for an additional fee."
  },
  {
    question: "Do you travel outside Cape Town?",
    answer: "Yes! We love destination shoots. Travel costs are calculated based on distance and accommodation requirements."
  },
  {
    question: "Can I customize a package?",
    answer: "Absolutely! We're happy to create custom packages that perfectly fit your needs and budget."
  },
  {
    question: "What happens if it rains on my shoot day?",
    answer: "We monitor weather closely and will work with you to reschedule if necessary. We also have indoor backup plans for most shoots."
  },
  {
    question: "Do you offer payment plans?",
    answer: "Yes, we offer flexible payment plans for bookings over R5,000. Contact us to discuss options."
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Photography & Videography Pricing Cape Town | SlyFox Studios</title>
      <meta name="description" content="Transparent pricing for professional photography and videography services in Cape Town. Wedding, corporate, portrait, and event packages available. Download our detailed price guide." />
      <meta name="keywords" content="Cape Town photography prices, wedding photography cost, corporate photography rates, videography pricing, photography packages South Africa" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-violet-900/40 via-background to-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl mb-6">
              Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Professional photography and videography services with clear, honest pricing. No hidden fees, no surprises—just exceptional value for your investment.
            </p>
            <Button className="bg-gold text-black px-8 py-4 rounded-full text-lg hover:bg-gold-muted transition-all duration-300">
              <Download className="w-5 h-5 mr-2" />
              Download Full Price Guide
            </Button>
          </div>
        </div>
      </section>

      {/* Photography Pricing */}
      <PricingSection />

      {/* Videography Pricing */}
      <section className="py-20 bg-gradient-to-br from-blue-900/40 via-background to-indigo-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              Videography Packages
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cinematic videography services with professional editing and delivery in multiple formats.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Wedding Videography */}
            <div className="studio-card">
              <div className="text-center mb-8">
                <h3 className="studio-card-title">Wedding Films</h3>
                <div className="studio-card-price">R12,500</div>
                <p className="studio-card-duration">Cinematic wedding videography</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>6-8 hour coverage</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Highlight reel (3-5 minutes)</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Full ceremony footage</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Reception highlights</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Professional color grading</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Multiple format delivery</span>
                </li>
              </ul>

              <Link href="/contact">
                <button className="studio-card-button">
                  Choose Wedding Films
                </button>
              </Link>
            </div>

            {/* Corporate Video */}
            <div className="studio-card-premium relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-salmon text-black px-6 py-2 rounded-full text-sm">Popular</span>
              </div>

              <div className="text-center mb-8">
                <h3 className="studio-card-title">Corporate Video</h3>
                <div className="studio-card-price">R8,500</div>
                <p className="studio-card-duration">Professional business videos</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Full day production</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>3-5 minute final video</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Professional interviews</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Company profile content</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Motion graphics package</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Multi-platform optimization</span>
                </li>
              </ul>

              <Link href="/contact">
                <button className="studio-card-button-premium">
                  Choose Corporate Video
                </button>
              </Link>
            </div>

            {/* Social Media Content */}
            <div className="studio-card">
              <div className="text-center mb-8">
                <h3 className="studio-card-title">Social Content</h3>
                <div className="studio-card-price">R2,500</div>
                <p className="studio-card-duration">Social media video package</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Half day shoot</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>10-15 short videos</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Platform-specific editing</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Instagram Reels & TikTok</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Trending formats</span>
                </li>
                <li className="studio-card-feature">
                  <Check className="studio-card-feature-icon" />
                  <span>Quick turnaround</span>
                </li>
              </ul>

              <Link href="/contact">
                <button className="studio-card-button">
                  Choose Social Content
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-gradient-to-br from-emerald-900/35 via-background to-cyan-900/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-salmon">
              Additional Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Enhance your package with these additional services and options.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {additionalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="bg-black rounded-2xl p-8 text-center hover:bg-gold/10 transition-colors duration-300">
                  <Icon className="w-12 h-12 text-gold mx-auto mb-6" />
                  <h3 className="text-xl text-gold mb-2">{service.title}</h3>
                  <div className="text-2xl mb-4">{service.price}</div>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-rose-900/30 via-background to-pink-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 h2-cyan">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Common questions about our pricing and services.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-charcoal rounded-2xl p-8">
                <h3 className={`text-xl mb-4 ${index % 2 === 0 ? 'h3-salmon' : 'h3-cyan'}`}>{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-violet-900/35 via-background to-indigo-900/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-salmon">
            Ready to Book Your Session?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Contact us for a personalized quote or to discuss custom packages that fit your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300">
                Get Custom Quote
              </Button>
            </Link>
            <Button variant="outline" className="border-2 border-white text-white px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-white hover:text-black transition-all duration-300">
              <Download className="w-5 h-5 mr-2" />
              Download Full Price Guide
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
