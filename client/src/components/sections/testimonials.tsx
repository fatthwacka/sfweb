import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { GradientBackground } from "@/components/common/gradient-background";

export function Testimonials() {
  // Hardcoded testimonials for SEO - crawlers will see this content immediately
  const testimonials = [
    {
      id: 1,
      name: "Sarah Troydon",
      role: "Wedding",
      image: "/images/testimonials/client-sarah-jones.jpg",
      quote: "Thank you so much guys, absolutely love the pics, and the team was a joy to work with",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Thompson",
      role: "Owner",
      image: "/images/testimonials/client-mike-johnson.jpg",
      quote: "Very cool headshots. really elevated our brand image. the guys were really creative and talented.",
      rating: 5
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Brand manager",
      company: "Natural Elixir",
      image: "/images/testimonials/client-emma-davis.jpg",
      quote: "thanks fo much , really loved the product shots and prodict videos so much, will be back soon",
      rating: 5
    },
    {
      id: 4,
      name: "Ayanda Mwelase",
      role: "Customer",
      company: "Urban Living",
      image: "/images/testimonials/client-ayanda-mwelase.jpg",
      quote: "captured our product range exactly as we imagined it, clean, sharp and with a touch of style.",
      rating: 5
    },
    {
      id: 5,
      name: "David Samkelo",
      role: "Product",
      company: "Apex Sportswear",
      image: "/images/testimonials/client-david-samkelo.jpg",
      quote: "Than you guys!! you shot our new range with a clean, natural style that matched the brief. Exactly.",
      rating: 5
    },
    {
      id: 6,
      name: "Lauren Masen",
      role: "Website",
      company: "Brew Co.",
      image: "/images/testimonials/client-lauren-masen.jpg",
      quote: "The site is simple to navigate and reliable. Solid delivery",
      rating: 5
    }
  ];

  // Track indices for each of the 3 card positions
  const [cardIndices, setCardIndices] = useState([0, 1, 2]);

  // Auto-advance - pick a random card position and update it to a new random testimonial
  useEffect(() => {
    const interval = setInterval(() => {
      setCardIndices((prevIndices) => {
        // Pick a random card position (0, 1, or 2)
        const cardPosition = Math.floor(Math.random() * 3);

        // Get testimonial indices that are NOT currently visible
        const availableIndices = testimonials
          .map((_, i) => i)
          .filter((i) => !prevIndices.includes(i));

        // Pick a random testimonial from available ones
        const newIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

        // Update just that one card position
        const newIndices = [...prevIndices];
        newIndices[cardPosition] = newIndex;
        return newIndices;
      });
    }, 900); // Update every 0.9 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const visibleCards = cardIndices.map((index) => testimonials[index]);

  // Array of gradient backgrounds for variety
  const gradients = [
    'linear-gradient(135deg, hsl(260, 25%, 18%) 0%, hsl(260, 20%, 16%) 50%, hsl(220, 20%, 14%) 100%)', // Original purple
    'linear-gradient(135deg, hsl(220, 25%, 18%) 0%, hsl(220, 20%, 16%) 50%, hsl(200, 20%, 14%) 100%)', // Blue tint
    'linear-gradient(135deg, hsl(280, 25%, 18%) 0%, hsl(280, 20%, 16%) 50%, hsl(260, 20%, 14%) 100%)', // Magenta tint
    'linear-gradient(135deg, hsl(240, 25%, 18%) 0%, hsl(240, 20%, 16%) 50%, hsl(220, 20%, 14%) 100%)', // Indigo tint
    'linear-gradient(135deg, hsl(200, 25%, 18%) 0%, hsl(200, 20%, 16%) 50%, hsl(180, 20%, 14%) 100%)', // Cyan tint
    'linear-gradient(135deg, hsl(300, 25%, 18%) 0%, hsl(300, 20%, 16%) 50%, hsl(280, 20%, 14%) 100%)'  // Pink tint
  ];

  // Generate background for each card based on testimonial ID
  const getCardGradient = (testimonialIndex) => {
    const gradientIndex = testimonialIndex % gradients.length;
    return gradients[gradientIndex];
  };

  return (
    <GradientBackground section="testimonials" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="cyan text-4xl lg:text-5xl mb-6">
            Production Experts
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            You're in safe hands, with a team that has an eye for detail, and a passion for beauty.
          </p>
        </div>

        {/* 3-Card Grid - Individual cards cycle randomly */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleCards.map((testimonial, cardPosition) => (
            <div
              key={`${testimonial.id}-${cardIndices[cardPosition]}`}
              className="rounded-2xl p-8 border border-border hover:border-gold transition-all duration-300 shadow-lg backdrop-blur-sm"
              style={{
                background: getCardGradient(cardIndices[cardPosition]),
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 107, 107, 0.1)'
              }}
            >
              <div className="flex items-center mb-6">
                <div className="flex text-salmon">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>

              <blockquote className="text-muted-foreground mb-6 italic">
                "{testimonial.quote}"
              </blockquote>

              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full mr-4 bg-gradient-to-br from-salmon to-gold flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-saira font-bold text-gold">{testimonial.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {testimonial.role}{testimonial.company && ` • ${testimonial.company}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GradientBackground>
  );
}
