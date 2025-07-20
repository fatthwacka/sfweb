import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export function PricingSection() {
  const { data: packages, isLoading } = useQuery({
    queryKey: ["/api/packages"],
    queryFn: async () => {
      const response = await fetch("/api/packages?category=photography");
      if (!response.ok) throw new Error("Failed to fetch packages");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-saira font-black mb-6">
            Transparent <span className="text-gold">Pricing</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect package for your needs. All packages include professional editing, online gallery, and high-resolution downloads.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {packages?.map((pkg: any, index: number) => (
            <Card 
              key={pkg.id}
              className={`bg-gradient-to-br from-slate-800/60 to-gray-900/80 border border-gray-700 hover:border-gold transition-all duration-300 transform hover:-translate-y-2`}
            >

              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-saira font-bold text-gold mb-4">{pkg.name}</h3>
                  <div className="text-4xl font-saira font-black mb-2">R{pkg.price}</div>
                  <p className="text-gray-400">{pkg.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {pkg.features?.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-gold mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-3 rounded-full font-barlow font-semibold transition-all duration-300 ${
                    index === 1 
                      ? "bg-gold text-black hover:bg-gold-muted" 
                      : "bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black"
                  }`}
                >
                  Choose {pkg.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-6">All packages include travel within Cape Town metro area. Custom packages available.</p>
          <Button 
            variant="outline"
            className="border-2 border-white text-white px-8 py-4 rounded-full font-barlow font-semibold text-lg hover:bg-white hover:text-black transition-all duration-300"
          >
            Download Price Guide (PDF)
          </Button>
        </div>
      </div>
    </section>
  );
}
