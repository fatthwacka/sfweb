import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Clock, 
  AlertCircle,
  Building,
  Globe,
  Save
} from 'lucide-react';
import { useSiteConfig } from '@/hooks/use-site-config';
import { toast } from '@/hooks/use-toast';

export function ContactSettings() {
  const { config, updateConfigBulk } = useSiteConfig();
  const [hasChanges, setHasChanges] = useState(false);
  
  const [contactData, setContactData] = useState({
    // Business info
    businessName: config?.contact?.business?.name || 'SlyFox Studios',
    businessTagline: config?.contact?.business?.tagline || 'Professional Photography & Videography',
    phone: config?.contact?.business?.phone || '+27 12 345 6789',
    email: config?.contact?.business?.email || 'info@slyfox.co.za',
    whatsapp: config?.contact?.business?.whatsapp || '+27 12 345 6789',
    bookingEmail: config?.contact?.business?.bookingEmail || 'bookings@slyfox.co.za',
    
    // Address
    displayAddress: config?.contact?.business?.address?.displayText || 'Cape Town, South Africa',
    city: config?.contact?.business?.address?.city || 'Cape Town',
    province: config?.contact?.business?.address?.province || 'Western Cape',
    country: config?.contact?.business?.address?.country || 'South Africa',
    
    // Hours
    weekdaysTime: config?.contact?.hours?.weekdaysTime || '9:00 AM - 6:00 PM',
    saturdayTime: config?.contact?.hours?.saturdayTime || '10:00 AM - 4:00 PM',
    sundayTime: config?.contact?.hours?.sundayTime || 'By appointment',
    hoursNote: config?.contact?.hours?.note || 'Evening and weekend shoots available by arrangement.',
    
    // Response times
    emailResponseTime: config?.contact?.responseTimes?.email?.time || 'Within 24 hours',
    whatsappResponseTime: config?.contact?.responseTimes?.whatsapp?.time || 'Within 2 hours',
    phoneResponseTime: config?.contact?.responseTimes?.phone?.time || 'Immediate',
    
    // Service areas
    primaryArea: config?.contact?.serviceAreas?.primary?.area || 'Cape Town Metro (no travel fees)',
    extendedArea: config?.contact?.serviceAreas?.extended?.area || 'Western Cape Province',
    destinationArea: config?.contact?.serviceAreas?.destination?.area || 'Anywhere in South Africa & beyond',
    serviceAreasNote: config?.contact?.serviceAreas?.note || 'Travel costs calculated based on distance and duration. Accommodation provided for multi-day shoots.',
    
    // Emergency contact
    emergencyTitle: config?.contact?.emergency?.title || 'Need Urgent Assistance?',
    emergencySubtitle: config?.contact?.emergency?.subtitle || 'For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response.',
  });

  // Update local state when API config loads
  useEffect(() => {
    if (config?.contact) {
      console.log('🔄 ContactSettings: Updating state with API config:', config.contact.business?.name);
      setContactData({
        // Business info
        businessName: config.contact.business?.name || 'SlyFox Studios',
        businessTagline: config.contact.business?.tagline || 'Professional Photography & Videography',
        phone: config.contact.business?.phone || '+27 12 345 6789',
        email: config.contact.business?.email || 'info@slyfox.co.za',
        whatsapp: config.contact.business?.whatsapp || '+27 12 345 6789',
        bookingEmail: config.contact.business?.bookingEmail || 'bookings@slyfox.co.za',
        
        // Address
        displayAddress: config.contact.business?.address?.displayText || 'Cape Town, South Africa',
        city: config.contact.business?.address?.city || 'Cape Town',
        province: config.contact.business?.address?.province || 'Western Cape',
        country: config.contact.business?.address?.country || 'South Africa',
        
        // Hours
        weekdaysTime: config.contact.hours?.weekdaysTime || '9:00 AM - 6:00 PM',
        saturdayTime: config.contact.hours?.saturdayTime || '10:00 AM - 4:00 PM',
        sundayTime: config.contact.hours?.sundayTime || 'By appointment',
        hoursNote: config.contact.hours?.note || 'Evening and weekend shoots available by arrangement.',
        
        // Response times
        emailResponseTime: config.contact.responseTimes?.email?.time || 'Within 24 hours',
        whatsappResponseTime: config.contact.responseTimes?.whatsapp?.time || 'Within 2 hours',
        phoneResponseTime: config.contact.responseTimes?.phone?.time || 'Immediate',
        
        // Service areas
        primaryArea: config.contact.serviceAreas?.primary?.area || 'Cape Town Metro (no travel fees)',
        extendedArea: config.contact.serviceAreas?.extended?.area || 'Western Cape Province',
        destinationArea: config.contact.serviceAreas?.destination?.area || 'Anywhere in South Africa & beyond',
        serviceAreasNote: config.contact.serviceAreas?.note || 'Travel costs calculated based on distance and duration. Accommodation provided for multi-day shoots.',
        
        // Emergency contact
        emergencyTitle: config.contact.emergency?.title || 'Need Urgent Assistance?',
        emergencySubtitle: config.contact.emergency?.subtitle || 'For time-sensitive inquiries or last-minute bookings, contact us directly for the fastest response.',
      });
    }
  }, [config]);

  const handleInputChange = (field: string, value: string) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Update the contact configuration
      await updateConfigBulk({
        contact: {
        business: {
          name: contactData.businessName,
          tagline: contactData.businessTagline,
          phone: contactData.phone,
          email: contactData.email,
          whatsapp: contactData.whatsapp,
          bookingEmail: contactData.bookingEmail,
          address: {
            street: contactData.displayAddress,
            city: contactData.city,
            province: contactData.province,
            postal: '8001',
            country: contactData.country,
            displayText: contactData.displayAddress
          }
        },
        hours: {
          ...config?.contact?.hours,
          weekdaysTime: contactData.weekdaysTime,
          saturdayTime: contactData.saturdayTime,
          sundayTime: contactData.sundayTime,
          note: contactData.hoursNote
        },
        responseTimes: {
          email: {
            title: 'Email Inquiries',
            time: contactData.emailResponseTime,
            description: 'Detailed responses to all project inquiries'
          },
          whatsapp: {
            title: 'WhatsApp Messages', 
            time: contactData.whatsappResponseTime,
            description: 'Quick questions and availability checks'
          },
          phone: {
            title: 'Phone Calls',
            time: contactData.phoneResponseTime,
            description: 'Direct line during business hours'
          }
        },
        serviceAreas: {
          primary: {
            title: 'Primary Area:',
            area: contactData.primaryArea,
            description: contactData.primaryArea
          },
          extended: {
            title: 'Extended Area:',
            area: contactData.extendedArea,
            description: contactData.extendedArea
          },
          destination: {
            title: 'Destination:',
            area: contactData.destinationArea,
            description: contactData.destinationArea
          },
          note: contactData.serviceAreasNote
        },
        emergency: {
          title: contactData.emergencyTitle,
          subtitle: contactData.emergencySubtitle,
          phone: contactData.phone.replace(/\s/g, ''),
          whatsapp: `https://wa.me/${contactData.whatsapp.replace(/[\s\+\(\)]/g, '')}`
        },
        // Keep existing methods and social data
        methods: config?.contact?.methods || [],
        social: config?.contact?.social || {}
        }
      });

      setHasChanges(false);
      toast({
        title: "Contact Settings Saved",
        description: "Your contact page settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save contact settings:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your contact settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Contact Page Settings</h2>
            <p className="text-gray-400">Manage your business contact information and page content</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {hasChanges && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hours & Response
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Service Areas
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Emergency Contact
          </TabsTrigger>
        </TabsList>

        {/* Business Information Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-white">Business Name</Label>
                  <Input
                    id="business-name"
                    value={contactData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagline" className="text-white">Tagline</Label>
                  <Input
                    id="tagline"
                    value={contactData.businessTagline}
                    onChange={(e) => handleInputChange('businessTagline', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={contactData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp"
                    value={contactData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Main Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="booking-email" className="text-white">Booking Email</Label>
                  <Input
                    id="booking-email"
                    type="email"
                    value={contactData.bookingEmail}
                    onChange={(e) => handleInputChange('bookingEmail', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Separator className="bg-slate-600" />

              <div className="space-y-4">
                <Label className="text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Information
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-address" className="text-white">Display Address</Label>
                    <Input
                      id="display-address"
                      value={contactData.displayAddress}
                      onChange={(e) => handleInputChange('displayAddress', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Cape Town, South Africa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">City</Label>
                    <Input
                      id="city"
                      value={contactData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-white">Province/State</Label>
                    <Input
                      id="province"
                      value={contactData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours & Response Times Tab */}
        <TabsContent value="hours" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weekdays-hours" className="text-white">Monday - Friday</Label>
                  <Input
                    id="weekdays-hours"
                    value={contactData.weekdaysTime}
                    onChange={(e) => handleInputChange('weekdaysTime', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="9:00 AM - 6:00 PM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="saturday-hours" className="text-white">Saturday</Label>
                  <Input
                    id="saturday-hours"
                    value={contactData.saturdayTime}
                    onChange={(e) => handleInputChange('saturdayTime', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="10:00 AM - 4:00 PM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sunday-hours" className="text-white">Sunday</Label>
                  <Input
                    id="sunday-hours"
                    value={contactData.sundayTime}
                    onChange={(e) => handleInputChange('sundayTime', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="By appointment"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hours-note" className="text-white">Hours Note</Label>
                <Input
                  id="hours-note"
                  value={contactData.hoursNote}
                  onChange={(e) => handleInputChange('hoursNote', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Evening and weekend shoots available by arrangement."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Response Times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-response" className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Response
                  </Label>
                  <Input
                    id="email-response"
                    value={contactData.emailResponseTime}
                    onChange={(e) => handleInputChange('emailResponseTime', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Within 24 hours"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-response" className="text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Response
                  </Label>
                  <Input
                    id="whatsapp-response"
                    value={contactData.whatsappResponseTime}
                    onChange={(e) => handleInputChange('whatsappResponseTime', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Within 2 hours"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone-response" className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Response
                  </Label>
                  <Input
                    id="phone-response"
                    value={contactData.phoneResponseTime}
                    onChange={(e) => handleInputChange('phoneResponseTime', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Immediate"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Areas Tab */}
        <TabsContent value="areas" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Service Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-area" className="text-white">Primary Service Area</Label>
                  <Input
                    id="primary-area"
                    value={contactData.primaryArea}
                    onChange={(e) => handleInputChange('primaryArea', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Cape Town Metro (no travel fees)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="extended-area" className="text-white">Extended Service Area</Label>
                  <Input
                    id="extended-area"
                    value={contactData.extendedArea}
                    onChange={(e) => handleInputChange('extendedArea', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Western Cape Province"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="destination-area" className="text-white">Destination Services</Label>
                  <Input
                    id="destination-area"
                    value={contactData.destinationArea}
                    onChange={(e) => handleInputChange('destinationArea', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Anywhere in South Africa & beyond"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service-areas-note" className="text-white">Service Areas Note</Label>
                  <Input
                    id="service-areas-note"
                    value={contactData.serviceAreasNote}
                    onChange={(e) => handleInputChange('serviceAreasNote', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Travel costs calculated based on distance and duration..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact Tab */}
        <TabsContent value="emergency" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Emergency Contact Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency-title" className="text-white">Section Title</Label>
                  <Input
                    id="emergency-title"
                    value={contactData.emergencyTitle}
                    onChange={(e) => handleInputChange('emergencyTitle', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Need Urgent Assistance?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency-subtitle" className="text-white">Section Description</Label>
                  <Input
                    id="emergency-subtitle"
                    value={contactData.emergencySubtitle}
                    onChange={(e) => handleInputChange('emergencySubtitle', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="For time-sensitive inquiries or last-minute bookings..."
                  />
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Emergency contact will use the phone and WhatsApp numbers from the Business Info tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}