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
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl mb-6">
              Transparent <span className="text-gold">Pricing</span>
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
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Videography <span className="text-gold">Packages</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cinematic videography services with professional editing and delivery in multiple formats.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Wedding Videography */}
            <div className="bg-charcoal rounded-2xl p-8 border border-border hover:border-gold transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-saira font-bold text-gold mb-4">Wedding Films</h3>
                <div className="text-4xl font-saira font-black mb-2">R12,500</div>
                <p className="text-muted-foreground">Cinematic wedding videography</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">6-8 hour coverage</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Highlight reel (3-5 minutes)</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Full ceremony footage</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Reception highlights</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Professional color grading</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Multiple format delivery</span>
                </li>
              </ul>

              <Link href="/contact">
                <Button className="w-full bg-transparent border-2 border-cyan text-cyan py-3 rounded-full font-barlow font-semibold hover:bg-cyan hover:text-black transition-all duration-300">
                  Choose Wedding Films
                </Button>
              </Link>
            </div>

            {/* Corporate Video */}
            <div className="bg-charcoal rounded-2xl p-8 border-2 border-salmon relative scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-salmon text-black px-6 py-2 rounded-full font-barlow font-semibold text-sm">Popular</span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-quicksand font-bold text-salmon mb-4">Corporate Video</h3>
                <div className="text-4xl font-saira font-black mb-2">R8,500</div>
                <p className="text-muted-foreground">Professional business videos</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Full day production</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">3-5 minute final video</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Professional interviews</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Company profile content</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Motion graphics package</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Multi-platform optimization</span>
                </li>
              </ul>

              <Link href="/contact">
                <Button className="w-full bg-gold text-black py-3 rounded-full font-barlow font-semibold hover:bg-gold-muted transition-all duration-300">
                  Choose Corporate Video
                </Button>
              </Link>
            </div>

            {/* Social Media Content */}
            <div className="bg-charcoal rounded-2xl p-8 border border-border hover:border-gold transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-saira font-bold text-gold mb-4">Social Content</h3>
                <div className="text-4xl font-saira font-black mb-2">R2,500</div>
                <p className="text-muted-foreground">Social media video package</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Half day shoot</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">10-15 short videos</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Platform-specific editing</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Instagram Reels & TikTok</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Trending formats</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold mr-3" />
                  <span className="text-sm">Quick turnaround</span>
                </li>
              </ul>

              <Link href="/contact">
                <Button className="w-full bg-transparent border-2 border-gold text-gold py-3 rounded-full font-barlow font-semibold hover:bg-gold hover:text-black transition-all duration-300">
                  Choose Social Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
              Additional <span className="text-gold">Services</span>
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
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6">
              Frequently Asked <span className="text-gold">Questions</span>
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
      <section className="py-20 bg-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-saira font-black mb-6">
            Ready to Book Your <span className="text-gold">Session?</span>
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
