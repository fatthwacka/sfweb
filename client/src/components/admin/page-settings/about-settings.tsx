import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Save, AlertCircle, X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { GradientPicker } from '@/components/ui/gradient-picker';
import { useGradient } from '@/hooks/use-gradient';
import { ImageBrowser } from '@/components/shared/image-browser';

interface Statistic {
  id: string;
  number: string;
  label: string;
  icon: string;
}

interface Value {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  image: string;
  description: string;
}

interface AboutConfig {
  hero: {
    title: string;
    description: string;
    stats: Statistic[];
  };
  story: {
    title: string;
    paragraphs: string[];
    image?: string;
  };
  values: {
    title: string;
    description: string;
    items: Value[];
  };
  team: {
    title: string;
    description: string;
    members: TeamMember[];
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
    backgroundImage?: string;
  };
}

interface SiteConfig {
  about?: AboutConfig;
  [key: string]: any;
}

// Default configuration with current about page content
const defaultAboutConfig: AboutConfig = {
  hero: {
    title: "About SlyFox Studios",
    description: "Founded in the heart of Durban, we're more than just a photography business—we're storytellers, memory makers, and artists passionate about capturing life's most precious moments.",
    stats: [
      { id: "stat-1", number: "500+", label: "Happy Clients", icon: "Users" },
      { id: "stat-2", number: "5 Years", label: "Experience", icon: "Clock" },
      { id: "stat-3", number: "1000+", label: "Events Captured", icon: "Camera" },
      { id: "stat-4", number: "Durban", label: "Based & Proud", icon: "MapPin" }
    ]
  },
  story: {
    title: "Our Story",
    paragraphs: [
      "SlyFox Studios was born from a passion for visual storytelling and a commitment to capturing the authentic moments that matter most. Founded in Durban, we've grown from a small startup to a trusted name in professional photography and videography.",
      "Our journey began with a simple belief: every moment has a story worth telling. Whether it's the joy of a wedding day, the professionalism of a corporate headshot, or the celebration of a graduation, we approach each project with the same dedication to excellence.",
      "Today, we're proud to serve clients across Durban and beyond, combining artistic vision with technical expertise to create images and videos that stand the test of time."
    ],
    image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
  },
  values: {
    title: "Our Values",
    description: "These core values guide everything we do, from our initial consultation to the final delivery of your images.",
    items: [
      {
        id: "value-1",
        icon: "Camera",
        title: "Artistic Excellence",
        description: "We approach every project with creative vision and technical precision, ensuring stunning results that exceed expectations."
      },
      {
        id: "value-2",
        icon: "Users",
        title: "Client-Centered",
        description: "Your vision is our priority. We listen, collaborate, and deliver personalized experiences that reflect your unique story."
      },
      {
        id: "value-3",
        icon: "Award",
        title: "Professional Quality",
        description: "From equipment to editing, we maintain the highest professional standards in every aspect of our work."
      },
      {
        id: "value-4",
        icon: "Clock",
        title: "Timely Delivery",
        description: "We respect your deadlines and deliver high-quality work within agreed timeframes, every time."
      }
    ]
  },
  team: {
    title: "Meet Our Team",
    description: "The creative minds behind SlyFox Studios, each bringing unique skills and passion to every project.",
    members: [
      {
        id: "team-1",
        name: "Dax Tucker",
        role: "Founder & Lead Photographer",
        email: "dax@slyfox.co.za",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "With over 5 years of experience, Dax brings artistic vision and technical expertise to every project."
      },
      {
        id: "team-2",
        name: "Eben",
        role: "Senior Videographer",
        email: "eben@slyfox.co.za",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Eben specializes in cinematic videography and brings stories to life through compelling visual narratives."
      },
      {
        id: "team-3",
        name: "Kyle",
        role: "Creative Director",
        email: "kyle@slyfox.co.za",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        description: "Kyle oversees creative direction and ensures every project meets our high standards of excellence."
      }
    ]
  },
  cta: {
    title: "Ready to Create Together?",
    description: "Let's discuss your vision and create something beautiful that tells your unique story.",
    buttonText: "Get In Touch",
    backgroundImage: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
  }
};

export default function AboutSettings() {
  const [config, setConfig] = useState<SiteConfig>({ about: defaultAboutConfig });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current site config
  const { data: siteConfig, isLoading } = useQuery({
    queryKey: ['/api/site-config'],
    queryFn: async () => {
      const response = await fetch('/api/site-config');
      if (!response.ok) throw new Error('Failed to fetch site config');
      return response.json() as SiteConfig;
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedConfig: SiteConfig) => {
      const response = await fetch('/api/site-config/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
      setHasUnsavedChanges(false);
      toast({
        title: "Settings saved",
        description: "About page settings have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  // Update local state when data loads
  useEffect(() => {
    if (siteConfig) {
      const aboutConfig = siteConfig.about || defaultAboutConfig;
      setConfig({ ...siteConfig, about: aboutConfig });
    }
  }, [siteConfig]);

  const handleConfigChange = (newConfig: SiteConfig) => {
    setConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  // File upload helper
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    const { filename } = await response.json();
    return `/uploads/${filename}`;
  };

  // Image update handlers
  const handleStoryImageUpdate = (imagePath: string) => {
    if (!config.about) return;
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        story: {
          ...config.about.story,
          image: imagePath
        }
      }
    });
  };

  const handleCtaImageUpdate = (imagePath: string) => {
    if (!config.about) return;
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        cta: {
          ...config.about.cta,
          backgroundImage: imagePath
        }
      }
    });
  };

  const handleStoryImageUpload = async (file: File) => {
    try {
      const imagePath = await uploadFile(file);
      handleStoryImageUpdate(imagePath);
      toast({
        title: "Image uploaded",
        description: "Story section image has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCtaImageUpload = async (file: File) => {
    try {
      const imagePath = await uploadFile(file);
      handleCtaImageUpdate(imagePath);
      toast({
        title: "Image uploaded",
        description: "CTA section background image has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Team member image handlers
  const handleTeamMemberImageUpdate = (memberId: string, imagePath: string) => {
    if (!config.about) return;
    const updatedMembers = config.about.team.members.map(member =>
      member.id === memberId ? { ...member, image: imagePath } : member
    );
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        team: {
          ...config.about.team,
          members: updatedMembers
        }
      }
    });
  };

  const handleTeamMemberImageUpload = async (memberId: string, file: File) => {
    try {
      const imagePath = await uploadFile(file);
      handleTeamMemberImageUpdate(memberId, imagePath);
      toast({
        title: "Image uploaded",
        description: "Team member image has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload team member image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Team member management
  const addTeamMember = () => {
    if (!config.about) return;
    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: 'New Team Member',
      role: 'Role',
      email: 'email@slyfox.co.za',
      image: '/images/team/placeholder.jpg',
      description: 'Team member description...'
    };
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        team: {
          ...config.about.team,
          members: [...config.about.team.members, newMember]
        }
      }
    });
  };

  const removeTeamMember = (memberId: string) => {
    if (!config.about) return;
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        team: {
          ...config.about.team,
          members: config.about.team.members.filter(member => member.id !== memberId)
        }
      }
    });
  };

  // Statistics management
  const addStatistic = () => {
    if (!config.about) return;
    const newStat: Statistic = {
      id: `stat-${Date.now()}`,
      number: '0',
      label: 'New Statistic',
      icon: 'Award'
    };
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        hero: {
          ...config.about.hero,
          stats: [...config.about.hero.stats, newStat]
        }
      }
    });
  };

  const removeStatistic = (statId: string) => {
    if (!config.about) return;
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        hero: {
          ...config.about.hero,
          stats: config.about.hero.stats.filter(stat => stat.id !== statId)
        }
      }
    });
  };

  // Values management
  const addValue = () => {
    if (!config.about) return;
    const newValue: Value = {
      id: `value-${Date.now()}`,
      icon: 'Star',
      title: 'New Value',
      description: 'Value description...'
    };
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        values: {
          ...config.about.values,
          items: [...config.about.values.items, newValue]
        }
      }
    });
  };

  const removeValue = (valueId: string) => {
    if (!config.about) return;
    handleConfigChange({
      ...config,
      about: {
        ...config.about,
        values: {
          ...config.about.values,
          items: config.about.values.items.filter(value => value.id !== valueId)
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!config.about) return null;

  return (
    <Card className="admin-settings-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">About Page Settings</CardTitle>
            <CardDescription className="text-gray-300">
              Manage your about page content including hero section, story, values, team, and CTA
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-amber-300 bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-500/30">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveMutation.isPending}
              className="bg-salmon hover:bg-salmon-muted text-white"
            >
              {saveMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save size={16} />
                  Save Changes
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="story" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="story" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Our Story
            </TabsTrigger>
            <TabsTrigger value="values" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Our Values
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Meet Our Team
            </TabsTrigger>
            <TabsTrigger value="cta" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Call to Action
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero-stats" className="space-y-6">
            <AboutHeroGradientSection />
            
            <div className="space-y-4">
              <Label className="text-white text-base font-medium">Hero Section</Label>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Title</Label>
                  <Input
                    value={config.about.hero.title}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      about: {
                        ...config.about!,
                        hero: { ...config.about!.hero, title: e.target.value }
                      }
                    })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300">Description</Label>
                  <Textarea
                    value={config.about.hero.description}
                    onChange={(e) => handleConfigChange({
                      ...config,
                      about: {
                        ...config.about!,
                        hero: { ...config.about!.hero, description: e.target.value }
                      }
                    })}
                    className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white text-base font-medium">Statistics</Label>
                <Button onClick={addStatistic} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus size={16} className="mr-1" />
                  Add Statistic
                </Button>
              </div>
              
              <div className="space-y-4">
                {config.about.hero.stats.map((stat) => (
                  <div key={stat.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-gray-300">Statistic</Label>
                      <Button
                        onClick={() => removeStatistic(stat.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Number</Label>
                        <Input
                          value={stat.number}
                          onChange={(e) => {
                            const updatedStats = config.about!.hero.stats.map(s =>
                              s.id === stat.id ? { ...s, number: e.target.value } : s
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                hero: { ...config.about!.hero, stats: updatedStats }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-400 text-xs">Label</Label>
                        <Input
                          value={stat.label}
                          onChange={(e) => {
                            const updatedStats = config.about!.hero.stats.map(s =>
                              s.id === stat.id ? { ...s, label: e.target.value } : s
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                hero: { ...config.about!.hero, stats: updatedStats }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-400 text-xs">Icon</Label>
                        <Input
                          value={stat.icon}
                          onChange={(e) => {
                            const updatedStats = config.about!.hero.stats.map(s =>
                              s.id === stat.id ? { ...s, icon: e.target.value } : s
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                hero: { ...config.about!.hero, stats: updatedStats }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                          placeholder="e.g., Users, Clock, Camera"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="story" className="space-y-6">
            <AboutStoryGradientSection />
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Story Section Title</Label>
                <Input
                  value={config.about.story.title}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      story: { ...config.about!.story, title: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-white text-base font-medium">Story Section Image</Label>
                <ImageBrowser
                  currentImage={config.about.story.image}
                  onSelect={handleStoryImageUpdate}
                  onUpload={handleStoryImageUpload}
                  label="Choose Story Image"
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-white text-base font-medium">Story Paragraphs</Label>
                {config.about.story.paragraphs.map((paragraph, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-gray-300">Paragraph {index + 1}</Label>
                    <Textarea
                      value={paragraph}
                      onChange={(e) => {
                        const updatedParagraphs = [...config.about!.story.paragraphs];
                        updatedParagraphs[index] = e.target.value;
                        handleConfigChange({
                          ...config,
                          about: {
                            ...config.about!,
                            story: { ...config.about!.story, paragraphs: updatedParagraphs }
                          }
                        });
                      }}
                      className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="values" className="space-y-6">
            <AboutValuesGradientSection />
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Values Section Title</Label>
                <Input
                  value={config.about.values.title}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      values: { ...config.about!.values, title: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Values Section Description</Label>
                <Textarea
                  value={config.about.values.description}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      values: { ...config.about!.values, description: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white text-base font-medium">Values</Label>
                <Button onClick={addValue} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus size={16} className="mr-1" />
                  Add Value
                </Button>
              </div>
              
              <div className="space-y-4">
                {config.about.values.items.map((value) => (
                  <div key={value.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-gray-300">Value</Label>
                      <Button
                        onClick={() => removeValue(value.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Title</Label>
                        <Input
                          value={value.title}
                          onChange={(e) => {
                            const updatedValues = config.about!.values.items.map(v =>
                              v.id === value.id ? { ...v, title: e.target.value } : v
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                values: { ...config.about!.values, items: updatedValues }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-400 text-xs">Icon</Label>
                        <Input
                          value={value.icon}
                          onChange={(e) => {
                            const updatedValues = config.about!.values.items.map(v =>
                              v.id === value.id ? { ...v, icon: e.target.value } : v
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                values: { ...config.about!.values, items: updatedValues }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                          placeholder="e.g., Camera, Users, Award"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400 text-xs">Description</Label>
                      <Textarea
                        value={value.description}
                        onChange={(e) => {
                          const updatedValues = config.about!.values.items.map(v =>
                            v.id === value.id ? { ...v, description: e.target.value } : v
                          );
                          handleConfigChange({
                            ...config,
                            about: {
                              ...config.about!,
                              values: { ...config.about!.values, items: updatedValues }
                            }
                          });
                        }}
                        className="bg-slate-700 border-slate-500 text-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <AboutTeamGradientSection />
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Team Section Title</Label>
                <Input
                  value={config.about.team.title}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      team: { ...config.about!.team, title: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Team Section Description</Label>
                <Textarea
                  value={config.about.team.description}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      team: { ...config.about!.team, description: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white text-base font-medium">Team Members</Label>
                <Button onClick={addTeamMember} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus size={16} className="mr-1" />
                  Add Team Member
                </Button>
              </div>
              
              <div className="space-y-4">
                {config.about.team.members.map((member) => (
                  <div key={member.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-gray-300">Team Member</Label>
                      <Button
                        onClick={() => removeTeamMember(member.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Name</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => {
                            const updatedMembers = config.about!.team.members.map(m =>
                              m.id === member.id ? { ...m, name: e.target.value } : m
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                team: { ...config.about!.team, members: updatedMembers }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-400 text-xs">Role</Label>
                        <Input
                          value={member.role}
                          onChange={(e) => {
                            const updatedMembers = config.about!.team.members.map(m =>
                              m.id === member.id ? { ...m, role: e.target.value } : m
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                team: { ...config.about!.team, members: updatedMembers }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Email</Label>
                        <Input
                          value={member.email}
                          type="email"
                          onChange={(e) => {
                            const updatedMembers = config.about!.team.members.map(m =>
                              m.id === member.id ? { ...m, email: e.target.value } : m
                            );
                            handleConfigChange({
                              ...config,
                              about: {
                                ...config.about!,
                                team: { ...config.about!.team, members: updatedMembers }
                              }
                            });
                          }}
                          className="bg-slate-700 border-slate-500 text-white text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-400 text-xs mb-2 block">Team Member Image</Label>
                        <ImageBrowser
                          currentImage={member.image}
                          onSelect={(imagePath) => handleTeamMemberImageUpdate(member.id, imagePath)}
                          onUpload={(file) => handleTeamMemberImageUpload(member.id, file)}
                          label="Choose Team Member Image"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400 text-xs">Description</Label>
                      <Textarea
                        value={member.description}
                        onChange={(e) => {
                          const updatedMembers = config.about!.team.members.map(m =>
                            m.id === member.id ? { ...m, description: e.target.value } : m
                          );
                          handleConfigChange({
                            ...config,
                            about: {
                              ...config.about!,
                              team: { ...config.about!.team, members: updatedMembers }
                            }
                          });
                        }}
                        className="bg-slate-700 border-slate-500 text-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cta" className="space-y-6">
            <AboutCtaGradientSection />
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">CTA Title</Label>
                <Input
                  value={config.about.cta.title}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      cta: { ...config.about!.cta, title: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">CTA Description</Label>
                <Textarea
                  value={config.about.cta.description}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      cta: { ...config.about!.cta, description: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Button Text</Label>
                <Input
                  value={config.about.cta.buttonText}
                  onChange={(e) => handleConfigChange({
                    ...config,
                    about: {
                      ...config.about!,
                      cta: { ...config.about!.cta, buttonText: e.target.value }
                    }
                  })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-white text-base font-medium">Background Image</Label>
                <ImageBrowser
                  currentImage={config.about.cta.backgroundImage}
                  onSelect={handleCtaImageUpdate}
                  onUpload={handleCtaImageUpload}
                  label="Choose CTA Background Image"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Gradient section components for each About section
function AboutHeroGradientSection() {
  const { gradient, updateGradient } = useGradient('aboutHero');
  return (
    <GradientPicker
      sectionKey="aboutHero"
      label="About Hero Background Gradient"
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
      label="Story Section Background Gradient"
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
      label="Values Section Background Gradient"
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
      label="Team Section Background Gradient"
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
      label="CTA Section Background Gradient"
      gradient={gradient}
      onChange={updateGradient}
      showDirection={true}
      showOpacity={false}
      showTextColors={true}
    />
  );
}