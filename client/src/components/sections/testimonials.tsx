import React from "react";
import { Star } from "lucide-react";
import { GradientBackground } from "@/components/common/gradient-background";

export function Testimonials() {
  // Hardcoded testimonials for SEO - crawlers will see this content immediately
  const testimonials = [
    { id: 1, name: "Sarah Troydon", role: "Wedding", quote: "Thank you so much guys, absolutely love the pics!", rating: 5 },
    { id: 2, name: "Michael Thompson", role: "Corporate", quote: "Very cool headshots. Really elevated our brand.", rating: 5 },
    { id: 3, name: "Emma Rodriguez", role: "Product", quote: "thanks so much, loved the product shots!", rating: 5 },
    { id: 4, name: "Ayanda Mwelase", role: "Fashion", quote: "Clean, sharp and stylish. Exactly what we needed.", rating: 5 },
    { id: 5, name: "David Samkelo", role: "Sportswear", quote: "Shot our new range perfectly. Will be back!", rating: 4 },
    { id: 6, name: "Lauren Mason", role: "Website", quote: "Simple to navigate and reliable. Solid work.", rating: 5 },
    { id: 7, name: "Thabo Ndlovu", role: "Event", quote: "captured every moment beautifully, thankyou!", rating: 5 },
    { id: 8, name: "Jessica van Wyk", role: "Portrait", quote: "Made me feel so comfortable. Love my photos!", rating: 5 },
    { id: 9, name: "Ravi Naidoo", role: "Product", quote: "great quality, quick turnaround. impressed!", rating: 4 },
    { id: 10, name: "Lindiwe Zulu", role: "Wedding", quote: "Our wedding video is absolutley stunning.", rating: 5 },
    { id: 11, name: "Chris Botha", role: "Corporate", quote: "Professional team, excellent results.", rating: 5 },
    { id: 12, name: "Fatima Essop", role: "Food", quote: "made our dishes look amazing! so happy", rating: 5 },
    { id: 13, name: "Grant Peters", role: "Real Estate", quote: "Property shots were clean and bright. nice work", rating: 4 },
    { id: 14, name: "Nomsa Khumalo", role: "Portrait", quote: "Loved every single photo. thank you team!", rating: 5 },
    { id: 15, name: "Willem du Plessis", role: "Product", quote: "Good communication and solid delivery.", rating: 4 },
    { id: 16, name: "Priya Govender", role: "Event", quote: "Captured the energy of our launch perfectly!", rating: 5 },
  ];

  // Split testimonials into two rows
  const row1 = testimonials.slice(0, 8);
  const row2 = testimonials.slice(8, 16);

  // Array of gradient backgrounds for variety
  const gradients = [
    'linear-gradient(135deg, hsl(260, 25%, 18%) 0%, hsl(260, 20%, 16%) 50%, hsl(220, 20%, 14%) 100%)',
    'linear-gradient(135deg, hsl(220, 25%, 18%) 0%, hsl(220, 20%, 16%) 50%, hsl(200, 20%, 14%) 100%)',
    'linear-gradient(135deg, hsl(280, 25%, 18%) 0%, hsl(280, 20%, 16%) 50%, hsl(260, 20%, 14%) 100%)',
    'linear-gradient(135deg, hsl(240, 25%, 18%) 0%, hsl(240, 20%, 16%) 50%, hsl(220, 20%, 14%) 100%)',
    'linear-gradient(135deg, hsl(200, 25%, 18%) 0%, hsl(200, 20%, 16%) 50%, hsl(180, 20%, 14%) 100%)',
    'linear-gradient(135deg, hsl(300, 25%, 18%) 0%, hsl(300, 20%, 16%) 50%, hsl(280, 20%, 14%) 100%)'
  ];

  const getCardGradient = (index: number) => gradients[index % gradients.length];

  const TestimonialCard = ({ testimonial, index }: { testimonial: typeof testimonials[0], index: number }) => (
    <div
      className="flex-shrink-0 w-[420px] min-h-[220px] rounded-2xl p-8 border border-border/50 shadow-lg backdrop-blur-sm flex flex-col justify-between"
      style={{
        background: getCardGradient(index),
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 107, 107, 0.1)'
      }}
    >
      <div className="flex items-center mb-4">
        <div className="flex text-salmon">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < testimonial.rating ? 'fill-current' : 'fill-none opacity-30'}`}
            />
          ))}
        </div>
      </div>

      <blockquote className="text-muted-foreground mb-4 italic text-sm leading-relaxed">
        "{testimonial.quote}"
      </blockquote>

      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full mr-3 bg-gradient-to-br from-salmon to-gold flex items-center justify-center">
          <span className="text-white font-bold text-xs">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <div className="font-saira font-bold text-gold text-sm">{testimonial.name}</div>
          <div className="text-muted-foreground text-xs">{testimonial.role}</div>
        </div>
      </div>
    </div>
  );

  return (
    <GradientBackground section="testimonials" className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="cyan text-4xl lg:text-5xl mb-6">
            Production Experts
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            You're in safe hands, with a team that has an eye for detail, and a passion for beauty.
          </p>
        </div>
      </div>

      {/* Scrolling testimonials - Single row */}
      <div className="relative">
        <div className="flex gap-6 animate-scroll-left">
          {[...testimonials, ...testimonials, ...testimonials].map((testimonial, i) => (
            <TestimonialCard key={`t-${i}`} testimonial={testimonial} index={i} />
          ))}
        </div>
      </div>

      {/* CSS for smooth scrolling animation */}
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-444px * 16)); }
        }
        .animate-scroll-left {
          animation: scroll-left 45s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </GradientBackground>
  );
}
