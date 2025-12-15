import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import NextLink from "next/link";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber text-chocolate-brown p-12 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-4">🍰 Golden Munch 🍰</h1>
          <p className="text-2xl opacity-90 mb-2">Where Every Bite is Golden</p>
          <p className="text-lg opacity-80">
            Serving the community with love since 2020
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Our Story */}
        <div className="mb-12">
          <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
            <CardHeader className="text-center p-8">
              <h2 className="text-4xl font-bold text-chocolate-brown">
                Our Story 📖
              </h2>
            </CardHeader>
            <CardBody className="px-8 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-chocolate-brown/80 mb-6">
                    Golden Munch began as a small family bakery with a simple
                    dream: to bring joy to our community through freshly baked
                    goods and warm hospitality. What started in our home kitchen
                    has grown into a beloved local destination.
                  </p>
                  <p className="text-lg text-chocolate-brown/80 mb-6">
                    Every morning, our passionate bakers arrive before dawn to
                    craft our signature items using traditional recipes passed
                    down through generations, combined with innovative flavors
                    that surprise and delight.
                  </p>
                  <p className="text-lg text-chocolate-brown/80">
                    Our commitment to quality ingredients, sustainable
                    practices, and exceptional service has made Golden Munch
                    more than just a bakery – we're a cornerstone of the
                    community.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-8xl mb-4 animate-float">👨‍🍳</div>
                  <h3 className="text-2xl font-bold text-chocolate-brown mb-2">
                    Master Bakers
                  </h3>
                  <p className="text-chocolate-brown/70">
                    Over 50 years of combined experience
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* What Makes Us Special */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-chocolate-brown mb-8 text-center">
            What Makes Us Special ⭐
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 bg-cream-white border border-golden-orange/20 hover:border-golden-orange transition-all duration-300 hover:scale-105">
              <CardBody>
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-2">
                  Fresh Daily
                </h3>
                <p className="text-chocolate-brown/70">
                  Everything baked fresh every morning using premium,
                  locally-sourced ingredients
                </p>
              </CardBody>
            </Card>

            <Card className="text-center p-6 bg-cream-white border border-golden-orange/20 hover:border-golden-orange transition-all duration-300 hover:scale-105">
              <CardBody>
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-2">
                  Award Winning
                </h3>
                <p className="text-chocolate-brown/70">
                  Recognized as "Best Local Bakery" three years running by the
                  community
                </p>
              </CardBody>
            </Card>

            <Card className="text-center p-6 bg-cream-white border border-golden-orange/20 hover:border-golden-orange transition-all duration-300 hover:scale-105">
              <CardBody>
                <div className="text-6xl mb-4">❤️</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-2">
                  Made with Love
                </h3>
                <p className="text-chocolate-brown/70">
                  Every item is handcrafted with care and attention to detail by
                  our skilled team
                </p>
              </CardBody>
            </Card>

            <Card className="text-center p-6 bg-cream-white border border-golden-orange/20 hover:border-golden-orange transition-all duration-300 hover:scale-105">
              <CardBody>
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-2">
                  Community First
                </h3>
                <p className="text-chocolate-brown/70">
                  Supporting local farmers and giving back to our neighborhood
                  through various initiatives
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-chocolate-brown mb-8 text-center">
            Our Values 💎
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-golden-orange/10 to-golden-orange/5 border-2 border-golden-orange/30">
              <CardBody className="p-8 text-center">
                <div className="text-5xl mb-4">🥇</div>
                <h3 className="text-2xl font-bold text-chocolate-brown mb-4">
                  Quality First
                </h3>
                <p className="text-chocolate-brown/80">
                  We never compromise on quality. From sourcing the finest
                  ingredients to perfecting our recipes, excellence is our
                  standard.
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-mint-green/10 to-mint-green/5 border-2 border-mint-green/30">
              <CardBody className="p-8 text-center">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-2xl font-bold text-chocolate-brown mb-4">
                  Community
                </h3>
                <p className="text-chocolate-brown/80">
                  We believe in building lasting relationships with our
                  customers and supporting the local community that supports us.
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-caramel-beige/30 to-caramel-beige/10 border-2 border-caramel-beige">
              <CardBody className="p-8 text-center">
                <div className="text-5xl mb-4">🌿</div>
                <h3 className="text-2xl font-bold text-chocolate-brown mb-4">
                  Sustainability
                </h3>
                <p className="text-chocolate-brown/80">
                  Environmental responsibility guides our choices, from
                  packaging to energy usage and waste reduction.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Meet the Team */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-chocolate-brown mb-8 text-center">
            Meet Our Team 👥
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center bg-cream-white border border-golden-orange/20">
              <CardBody className="p-6">
                <div className="text-7xl mb-4">👨‍🍳</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-1">
                  Chef Marcus
                </h3>
                <Chip color="warning" size="sm" variant="flat" className="mb-3">
                  Head Baker
                </Chip>
                <p className="text-chocolate-brown/70 text-sm">
                  20+ years of experience crafting artisanal breads and pastries
                </p>
              </CardBody>
            </Card>

            <Card className="text-center bg-cream-white border border-golden-orange/20">
              <CardBody className="p-6">
                <div className="text-7xl mb-4">👩‍🍳</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-1">
                  Chef Isabella
                </h3>
                <Chip color="success" size="sm" variant="flat" className="mb-3">
                  Cake Specialist
                </Chip>
                <p className="text-chocolate-brown/70 text-sm">
                  Award-winning cake designer with a passion for creative
                  decorating
                </p>
              </CardBody>
            </Card>

            <Card className="text-center bg-cream-white border border-golden-orange/20">
              <CardBody className="p-6">
                <div className="text-7xl mb-4">👨‍💼</div>
                <h3 className="text-xl font-bold text-chocolate-brown mb-1">
                  David
                </h3>
                <Chip color="primary" size="sm" variant="flat" className="mb-3">
                  Manager
                </Chip>
                <p className="text-chocolate-brown/70 text-sm">
                  Ensuring every customer has a delightful experience
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Location & Hours */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-chocolate-brown mb-8 text-center">
            Visit Us 📍
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-cream-white border-2 border-golden-orange/20">
              <CardBody className="p-8">
                <h3 className="text-2xl font-bold text-chocolate-brown mb-6 flex items-center gap-2">
                  <span>🏪</span> Location
                </h3>
                <div className="space-y-3 text-chocolate-brown/80">
                  <p className="flex items-center gap-3">
                    <span>📍</span> 123 Sweet Street, Bakery District
                  </p>
                  <p className="flex items-center gap-3">
                    <span>🏙️</span> Downtown Golden City, GC 12345
                  </p>
                  <p className="flex items-center gap-3">
                    <span>📞</span> (555) 123-MUNCH
                  </p>
                  <p className="flex items-center gap-3">
                    <span>✉️</span> hello@goldenmunch.com
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-cream-white border-2 border-golden-orange/20">
              <CardBody className="p-8">
                <h3 className="text-2xl font-bold text-chocolate-brown mb-6 flex items-center gap-2">
                  <span>🕒</span> Hours
                </h3>
                <div className="space-y-3 text-chocolate-brown/80">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold">6:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-semibold">7:00 AM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="mt-4 p-3 bg-mint-green/20 rounded-lg">
                    <p className="text-sm text-chocolate-brown">
                      ⭐ Extended hours on weekends for your convenience!
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-golden-orange to-deep-amber p-8">
            <CardBody>
              <h2 className="text-3xl font-bold text-chocolate-brown mb-4">
                Ready to Experience Golden Munch? 🎉
              </h2>
              <p className="text-xl text-chocolate-brown/80 mb-6">
                Join thousands of satisfied customers who start their day the
                golden way!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold px-8 py-4 text-xl"
                >
                  🛒 Order Now
                </Button>
                <Button
                  as={NextLink}
                  href="/specials"
                  size="lg"
                  variant="bordered"
                  className="border-chocolate-brown text-chocolate-brown hover:bg-chocolate-brown/10 font-bold px-8 py-4 text-xl"
                >
                  ⭐ View Specials
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
