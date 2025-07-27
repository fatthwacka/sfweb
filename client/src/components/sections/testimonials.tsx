import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "Wedding Client",
    image: "/images/testimonials/client-sarah-jones.jpg",
    quote: "SlyFox Studios made our wedding day absolutely magical. The attention to detail and artistic vision exceeded all our expectations. Our photos are truly works of art."
  },
  {
    id: 2,
    name: "Michael Thompson",
    role: "Corporate Client",
    image: "/images/testimonials/client-mike-johnson.jpg",
    quote: "Professional, creative, and incredibly talented. The corporate headshots they took for our team elevated our brand image significantly. Highly recommended!"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    role: "Family Portrait Client",
    image: "/images/testimonials/client-emma-davis.jpg",
    quote: "The family portrait session was comfortable and fun. They captured our personalities perfectly, and the online gallery made sharing with relatives so easy."
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900/40 via-background to-blue-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="cyan text-4xl lg:text-5xl mb-6">
            What Our <span>Clients Say</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our clients have to say about their experience with SlyFox Studios.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map(testimonial => (
            <div 
              key={testimonial.id} 
              className="bg-charcoal rounded-2xl p-8 border border-border hover:border-gold transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="flex text-salmon">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>

              <blockquote className="text-muted-foreground mb-6 italic">
                "{testimonial.quote}"
              </blockquote>

              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={`${testimonial.name} testimonial`} 
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <div className="font-saira font-bold text-gold">{testimonial.name}</div>
                  <div className="text-muted-foreground text-sm">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
