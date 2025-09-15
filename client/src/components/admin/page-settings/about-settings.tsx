import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { useGradient } from '@/hooks/use-gradient';


export default function AboutSettings() {

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">Section Background Colors</h3>

      <AboutStoryGradientSection />
      <AboutValuesGradientSection />
      <AboutTeamGradientSection />
      <AboutHeroGradientSection />
      <AboutCtaGradientSection />
    </div>
  );
}

// Gradient section components for each About section
function AboutHeroGradientSection() {
  const { gradient, updateGradient } = useGradient('aboutHero');
  return (
    <GradientPicker
      sectionKey="aboutHero"
      label="Based in Durban"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function AboutStoryGradientSection() {
  const { gradient, updateGradient } = useGradient('aboutStory');
  return (
    <GradientPicker
      sectionKey="aboutStory"
      label="Our Story"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function AboutValuesGradientSection() {
  const { gradient, updateGradient } = useGradient('aboutValues');
  return (
    <GradientPicker
      sectionKey="aboutValues"
      label="Our Values"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function AboutTeamGradientSection() {
  const { gradient, updateGradient } = useGradient('aboutTeam');
  return (
    <GradientPicker
      sectionKey="aboutTeam"
      label="Meet our Team"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}

function AboutCtaGradientSection() {
  const { gradient, updateGradient } = useGradient('aboutCta');
  return (
    <GradientPicker
      sectionKey="aboutCta"
      label="Ready to Create"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}