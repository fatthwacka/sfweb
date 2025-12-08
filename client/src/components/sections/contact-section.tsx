import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone, Clock, Loader2, CheckCircle, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GradientBackground } from "@/components/common/gradient-background";
import { useRecaptcha } from "@/hooks/use-recaptcha";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  recaptchaToken?: string;
}

export function ContactSection() {
  const { toast } = useToast();
  const { executeRecaptcha, isRecaptchaLoaded } = useRecaptcha();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });

  const contactMutation = useMutation({
    mutationFn: (data: ContactFormData) => apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      // Show both toast and modal
      toast({
        title: "Message Sent!",
        description: "Thank you for your message. We'll get back to you within 24 hours."
      });
      setShowSuccessModal(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        service: "",
        message: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Phone number validation if provided
    if (formData.phone && formData.phone.trim() !== "") {
      // Remove all characters except digits and +
      const cleanPhone = formData.phone.replace(/[^\d+]/g, '');
      const hasCountryCode = cleanPhone.startsWith('+');
      const digitCount = cleanPhone.replace(/\+/g, '').length;

      // Validation: 10 digits for local, or 11 digits with + (12 chars total) for international
      const minDigits = hasCountryCode ? 11 : 10;

      if (digitCount < minDigits) {
        toast({
          title: "Invalid Phone Number",
          description: hasCountryCode
            ? "International numbers need at least 11 digits after the + symbol."
            : "Please enter a valid phone number with at least 10 digits.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Execute reCAPTCHA with timeout (don't block form submission if it fails)
    let recaptchaToken: string | null = null;
    if (isRecaptchaLoaded()) {
      try {
        // Timeout after 5 seconds - don't let reCAPTCHA block the form
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        recaptchaToken = await Promise.race([
          executeRecaptcha('contact_form'),
          timeoutPromise
        ]);
        // If timeout or null, just proceed without token (backend handles it)
        if (!recaptchaToken) {
          console.warn('reCAPTCHA timed out or failed, proceeding without token');
        }
      } catch (error) {
        console.error('reCAPTCHA error:', error);
        // Don't block submission - proceed without token
      }
    }
    
    // Submit form with reCAPTCHA token
    const submitData = {
      ...formData,
      recaptchaToken: recaptchaToken || undefined
    };
    
    contactMutation.mutate(submitData);
  };

  // Phone number formatter - strip all characters except digits and one + at start
  const formatPhoneNumber = (value: string): string => {
    // Allow only one + at the very beginning, followed by digits only
    let cleaned = value.replace(/[^\d+]/g, ''); // Remove everything except digits and +
    
    // If there are multiple + signs, keep only the first one if it's at the start
    const plusCount = (cleaned.match(/\+/g) || []).length;
    if (plusCount > 1) {
      // Find first + and keep it if it's at position 0, remove all others
      const firstPlusIndex = cleaned.indexOf('+');
      if (firstPlusIndex === 0) {
        cleaned = '+' + cleaned.replace(/\+/g, '');
      } else {
        cleaned = cleaned.replace(/\+/g, '');
      }
    } else if (plusCount === 1 && cleaned.indexOf('+') !== 0) {
      // If + is not at the beginning, remove it
      cleaned = cleaned.replace(/\+/g, '');
    }
    
    return cleaned;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    // Special handling for phone number to strip formatting as user types
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <GradientBackground section="contact" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-4xl lg:text-5xl mb-6 h2-salmon">
              Let's Create Something Beautiful
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Ready to capture your special moments? Get in touch with us and let's discuss how we can bring your vision to life.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-barlow font-semibold text-muted-foreground mb-2">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-barlow font-semibold text-muted-foreground mb-2">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-barlow font-semibold text-muted-foreground mb-2">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-barlow font-semibold text-muted-foreground mb-2">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="083 123 4567"
                />
              </div>

              <div>
                <Label htmlFor="service" className="block text-sm font-barlow font-semibold text-muted-foreground mb-2">
                  Service Interested In
                </Label>
                <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="videography">Videography</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="app-development">App Development</SelectItem>
                    <SelectItem value="mixed-other">Mixed/Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="block text-sm font-barlow font-semibold text-muted-foreground mb-2">
                  Message
                </Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Tell us about your project, event date, and any specific requirements..."
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={contactMutation.isPending}
                className="w-full btn-salmon"
              >
                {contactMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
              
              {/* reCAPTCHA attribution text - required when badge is hidden */}
              <div className="mt-3 text-xs text-muted-foreground text-center">
                This site is protected by reCAPTCHA and the Google{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Terms of Service
                </a>{' '}
                apply.
              </div>
            </form>
          </div>
          
          {/* Success Modal - rendered outside GradientBackground via portal-like fixed positioning */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl border border-gray-200">
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent Successfully!</h3>
                  <p className="text-gray-600">
                    Thank you for getting in touch! We've received your message and will respond within 24 hours.
                  </p>
                </div>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-lg font-semibold"
                >
                  Great!
                </Button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <div 
              className="rounded-2xl p-8 border border-border shadow-lg backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, hsl(260, 25%, 18%) 0%, hsl(260, 20%, 16%) 50%, hsl(220, 20%, 14%) 100%)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(78, 205, 196, 0.1)'
              }}
            >
              <h3 className="text-2xl font-saira font-bold text-gold mb-6">Get in Touch</h3>

              <div className="space-y-6">
                {/* Studio Location */}
                <div className="flex items-start">
                  <div className="contact-info-icon-salmon mr-4 mt-1">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-barlow font-semibold text-lg mb-2">Studio Location</h4>
                    <p className="text-foreground">La Lucia, Umhlanga, Durban</p>
                  </div>
                </div>

                {/* Email Us */}
                <div className="flex items-start">
                  <div className="contact-info-icon-salmon mr-4 mt-1">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-barlow font-semibold text-lg mb-2">Email Us</h4>
                    <p className="text-foreground">info@slyfox.co.za</p>
                  </div>
                </div>

                {/* Call Us */}
                <div className="flex items-start">
                  <div className="contact-info-icon-salmon mr-4 mt-1">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-barlow font-semibold text-lg mb-2">Call Us</h4>
                    <p className="text-foreground">076 916 3113</p>
                    <p className="text-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-muted-foreground text-sm">Saturday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start">
                  <div className="contact-info-icon-salmon mr-4 mt-1">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-barlow font-semibold text-lg mb-2">Business Hours</h4>
                    <p className="text-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-muted-foreground text-sm">Saturday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="font-barlow font-semibold text-lg mb-4">Follow Us</h4>
                <div className="flex flex-wrap gap-4">
                  {/* Instagram */}
                  <a href="https://www.instagram.com/slyfoxstudiogroup/" target="_blank" rel="noopener noreferrer" className="bg-muted p-3 rounded-full hover:bg-gold hover:text-black transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40z"/>
                    </svg>
                  </a>
                  {/* Facebook */}
                  <a href="https://www.facebook.com/slyfoxstudiogroup" target="_blank" rel="noopener noreferrer" className="bg-muted p-3 rounded-full hover:bg-gold hover:text-black transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  {/* TikTok */}
                  <a href="https://www.tiktok.com/@slyfoxstudiogroup" target="_blank" rel="noopener noreferrer" className="bg-muted p-3 rounded-full hover:bg-gold hover:text-black transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a href="https://www.youtube.com/@slyfoxcreativestudio3214" target="_blank" rel="noopener noreferrer" className="bg-muted p-3 rounded-full hover:bg-gold hover:text-black transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  {/* X (formerly Twitter) */}
                  <a href="https://x.com/AiVulpin" target="_blank" rel="noopener noreferrer" className="bg-muted p-3 rounded-full hover:bg-gold hover:text-black transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
}
