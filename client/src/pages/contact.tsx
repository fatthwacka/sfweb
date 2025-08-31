import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { ContactSection } from "@/components/sections/contact-section";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";

// Map icon strings to Lucide components
const iconMap = {
  Phone,
  Mail, 
  MessageCircle,
  MapPin
};

export default function Contact() {
  const { config, isLoading } = useSiteConfig();
  
  // Debug logging
  console.log('🏢 Contact page config:', {
    businessName: config?.contact?.business?.name,
    phone: config?.contact?.business?.phone,
    isLoading
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground background-gradient-blobs flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-salmon"></div>
          <p className="mt-4 text-muted-foreground">Loading contact information...</p>
        </div>
      </div>
    );
  }
  
  // Create contact methods from business config (same source as admin panel)
  const contactMethods = [
    {
      icon: iconMap.Phone,
      title: "Call Us",
      details: [config?.contact?.business?.phone || "+27 12 345 6789", config?.contact?.responseTimes?.phone?.time || "Immediate"],
      action: `tel:${config?.contact?.business?.phone?.replace(/\s/g, '') || "+27123456789"}`
    },
    {
      icon: iconMap.Mail,
      title: "Email Us", 
      details: [config?.contact?.business?.email || "info@slyfox.co.za", config?.contact?.responseTimes?.email?.time || "Within 24 hours"],
      action: `mailto:${config?.contact?.business?.email || "info@slyfox.co.za"}`
    },
    {
      icon: iconMap.MessageCircle,
      title: "WhatsApp",
      details: [config?.contact?.business?.whatsapp || "+27 12 345 6789", config?.contact?.responseTimes?.whatsapp?.time || "Within 2 hours"],
      action: `https://wa.me/${config?.contact?.business?.whatsapp?.replace(/[^0-9]/g, '') || "27123456789"}`
    },
    {
      icon: iconMap.MapPin,
      title: "Visit Us",
      details: [config?.contact?.business?.address?.displayText || "Durban, South Africa", config?.contact?.hours?.sundayTime || "By appointment"],
      action: "https://www.google.com/maps/search/?api=1&query=-29.7522499,31.052583"
    }
  ];
  return (
    <div className="min-h-screen bg-background text-foreground background-gradient-blobs">
      {/* SEO Meta Tags */}
      <title>Contact SlyFox Studios - Photography & Videography Durban</title>
      <meta name="description" content="Get in touch with SlyFox Studios for professional photography and videography services in Durban. Phone, email, WhatsApp contact options available. Quick response guaranteed." />
      <meta name="keywords" content="contact SlyFox Studios, Durban photographer contact, photography booking, videography quote, professional photography inquiry" />
      
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-teal-900/40 via-background to-emerald-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="mb-6">
              Get In Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Ready to capture your special moments? We'd love to hear about your project and discuss how we can bring your vision to life.
            </p>
          </div>

          {/* Quick Contact Methods */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              const cardClasses = [
                'contact-info-card-phone',  // Phone - red/orange
                'contact-info-card-email',  // Email - cyan (no change)
                'contact-info-card-whatsapp', // WhatsApp - green
                'contact-info-card-location'  // Visit Us - pink/purple
              ];
              const iconClasses = [
                'contact-info-icon-phone',   // Phone - red/orange
                'contact-info-icon-email',   // Email - cyan (no change)
                'contact-info-icon-whatsapp', // WhatsApp - green
                'contact-info-icon-location'  // Visit Us - pink/purple
              ];
              
              return (
                <div key={index} className={`${cardClasses[index]} text-center`}>
                  {method.action ? (
                    <a href={method.action} className="block">
                      <div className={iconClasses[index]}>
                        {index === 2 ? (
                          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.595z"/>
                          </svg>
                        ) : (
                          <Icon className="w-8 h-8" />
                        )}
                      </div>
                      <h3 className="text-lg mb-2">{method.title}</h3>
                      {method.details.map((detail, i) => (
                        <p key={i} className={`text-sm ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {detail}
                        </p>
                      ))}
                    </a>
                  ) : (
                    <div>
                      <div className={iconClasses[index]}>
                        {index === 2 ? (
                          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.595z"/>
                          </svg>
                        ) : (
                          <Icon className="w-8 h-8" />
                        )}
                      </div>
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
      <section className="py-20 bg-gradient-to-br from-indigo-900/35 via-background to-purple-900/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Business Hours */}
            <div className="contact-info-card">
              <div className="flex items-center mb-6">
                <div className="contact-info-icon-salmon mr-4">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl">Business Hours</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{config?.contact?.hours?.weekdaysDisplay || "Monday - Friday"}</span>
                  <span className="text-gold">{config?.contact?.hours?.weekdaysTime || "9:00 AM - 6:00 PM"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{config?.contact?.hours?.saturdayDisplay || "Saturday"}</span>
                  <span className="text-gold">{config?.contact?.hours?.saturdayTime || "10:00 AM - 4:00 PM"}</span>
                </div>
                <div className="flex justify-between">
                  <span>{config?.contact?.hours?.sundayDisplay || "Sunday"}</span>
                  <span className="text-muted-foreground">{config?.contact?.hours?.sundayTime || "By appointment"}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                {config?.contact?.hours?.note || "Evening and weekend shoots available by arrangement."}
              </p>
            </div>

            {/* Response Times */}
            <div className="contact-info-card">
              <div className="flex items-center mb-6">
                <div className="contact-info-icon-cyan mr-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl">Response Times</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{config?.contact?.responseTimes?.email?.title || "Email Inquiries"}</span>
                    <span className="text-gold">{config?.contact?.responseTimes?.email?.time || "Within 24 hours"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{config?.contact?.responseTimes?.email?.description || "Detailed responses to all project inquiries"}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{config?.contact?.responseTimes?.whatsapp?.title || "WhatsApp Messages"}</span>
                    <span className="text-gold">{config?.contact?.responseTimes?.whatsapp?.time || "Within 2 hours"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{config?.contact?.responseTimes?.whatsapp?.description || "Quick questions and availability checks"}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{config?.contact?.responseTimes?.phone?.title || "Phone Calls"}</span>
                    <span className="text-gold">{config?.contact?.responseTimes?.phone?.time || "Immediate"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{config?.contact?.responseTimes?.phone?.description || "Direct line during business hours"}</p>
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <div className="contact-info-card">
              <div className="flex items-center mb-6">
                <div className="contact-info-icon-salmon mr-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-2xl">Service Areas</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gold">{config?.contact?.serviceAreas?.primary?.title || "Primary Area:"}</span>
                  <p className="text-sm">{config?.contact?.serviceAreas?.primary?.area || "Durban Metro (no travel fees)"}</p>
                </div>
                <div>
                  <span className="font-semibold text-gold">{config?.contact?.serviceAreas?.extended?.title || "Extended Area:"}</span>
                  <p className="text-sm">{config?.contact?.serviceAreas?.extended?.area || "KwaZulu-Natal Province"}</p>
                </div>
                <div>
                  <span className="font-semibold text-gold">{config?.contact?.serviceAreas?.destination?.title || "Destination:"}</span>
                  <p className="text-sm">{config?.contact?.serviceAreas?.destination?.area || "Anywhere in South Africa & beyond"}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                {config?.contact?.serviceAreas?.note || "Travel costs calculated based on distance and duration. Accommodation provided for multi-day shoots."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-20 bg-gradient-to-br from-red-900/30 via-background to-pink-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6 h2-salmon">
            {config?.contact?.emergency?.title || "Need Urgent Assistance?"}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {config?.contact?.emergency?.subtitle || "For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="btn-salmon"
              onClick={() => window.open(`tel:${config?.contact?.emergency?.phone || "+27123456789"}`)}
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
            <Button 
              className="btn-outline-cyan"
              onClick={() => window.open(config?.contact?.emergency?.whatsapp || "https://wa.me/27123456789")}
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
