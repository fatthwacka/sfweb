import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Package {
  id: number;
  name: string;
  description: string;
  price: string;
  features: string[];
  category: string;
}

export function PricingSection() {
  const { data: packages, isLoading } = useQuery<Package[]>({
    queryKey: ["/api/packages", "photography"],
    queryFn: async () => {
      const response = await fetch("/api/packages/photography");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">Loading packages...</div>
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
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect package for your needs. All packages include professional editing, online gallery, and high-resolution downloads.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {packages && packages.length > 0 ? packages.map((pkg, index) => (
            <div 
              key={pkg.id} 
              className={`bg-black rounded-2xl p-8 border transition-all duration-300 transform hover:-translate-y-2 ${
                index === 1 
                  ? "border-2 border-gold relative scale-105" 
                  : "border-border hover:border-gold"
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gold text-black px-6 py-2 font-barlow font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-saira font-bold text-gold mb-4">{pkg.name}</h3>
                <div className="text-4xl font-saira font-black mb-2">R{parseFloat(pkg.price).toLocaleString()}</div>
                <p className="text-muted-foreground">{pkg.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {pkg.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
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
            </div>
          )) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground">No packages available at the moment.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">All packages include travel within Cape Town metro area. Custom packages available.</p>
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
