import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { ContactSection } from "@/components/sections/contact-section";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

const contactMethods = [
  {
    icon: Phone,
    title: "Call Us",
    details: ["+27 12 345 6789", "Available Mon-Fri 9AM-6PM"],
    action: "tel:+27123456789"
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["info@slyfox.co.za", "We respond within 24 hours"],
    action: "mailto:info@slyfox.co.za"
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    details: ["+27 12 345 6789", "Quick responses during business hours"],
    action: "https://wa.me/27123456789"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    details: ["Cape Town, South Africa", "By appointment only"],
    action: null
  }
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Meta Tags */}
      <title>Contact SlyFox Studios - Photography & Videography Cape Town</title>
      <meta name="description" content="Get in touch with SlyFox Studios for professional photography and videography services in Cape Town. Phone, email, WhatsApp contact options available. Quick response guaranteed." />
      <meta name="keywords" content="contact SlyFox Studios, Cape Town photographer contact, photography booking, videography quote, professional photography inquiry" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-black via-charcoal to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl mb-6">
              Get In <span className="text-gold">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Ready to capture your special moments? We'd love to hear about your project and discuss how we can bring your vision to life.
            </p>
          </div>

          {/* Quick Contact Methods */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="bg-charcoal rounded-2xl p-6 text-center hover:bg-gold/10 transition-colors duration-300">
                  {method.action ? (
                    <a href={method.action} className="block">
                      <Icon className="w-8 h-8 text-gold mx-auto mb-4" />
                      <h3 className="text-lg mb-2">{method.title}</h3>
                      {method.details.map((detail, i) => (
                        <p key={i} className={`text-sm ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {detail}
                        </p>
                      ))}
                    </a>
                  ) : (
                    <div>
                      <Icon className="w-8 h-8 text-gold mx-auto mb-4" />
                      <h3 className="text-lg mb-2">{method.title}</h3>
                      {method.details.map((detail, i) => (
                        <p key={i} className={`text-sm ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Contact Form */}
      <ContactSection />

      {/* Business Hours & Additional Info */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Business Hours */}
            <div className="bg-charcoal rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <Clock className="w-8 h-8 text-gold mr-4" />
                <h3 className="text-2xl">Business Hours</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="text-gold">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="text-gold">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-muted-foreground">By appointment</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Evening and weekend shoots available by arrangement.
              </p>
            </div>

            {/* Response Times */}
            <div className="bg-charcoal rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <MessageCircle className="w-8 h-8 text-gold mr-4" />
                <h3 className="text-2xl">Response Times</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Email Inquiries</span>
                    <span className="text-gold">Within 24 hours</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Detailed responses to all project inquiries</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">WhatsApp Messages</span>
                    <span className="text-gold">Within 2 hours</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Quick questions and availability checks</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Phone Calls</span>
                    <span className="text-gold">Immediate</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Direct line during business hours</p>
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <div className="bg-charcoal rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <MapPin className="w-8 h-8 text-gold mr-4" />
                <h3 className="text-2xl">Service Areas</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gold">Primary Area:</span>
                  <p className="text-sm">Cape Town Metro (no travel fees)</p>
                </div>
                <div>
                  <span className="font-semibold text-gold">Extended Area:</span>
                  <p className="text-sm">Western Cape Province</p>
                </div>
                <div>
                  <span className="font-semibold text-gold">Destination:</span>
                  <p className="text-sm">Anywhere in South Africa & beyond</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Travel costs calculated based on distance and duration. Accommodation provided for multi-day shoots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="salmon text-4xl mb-6">
            Need Urgent <span>Assistance?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gold text-black px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold-muted transition-all duration-300"
              onClick={() => window.open('tel:+27123456789')}
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-gold text-gold px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-gold hover:text-black transition-all duration-300"
              onClick={() => window.open('https://wa.me/27123456789')}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
