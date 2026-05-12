"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Globe, Shield, Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { featuredStartups, platformStats, mockTestimonials } from "@/data/mockData";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-sm font-medium mb-8"
          >
            <span className="flex w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Applications for Cohort W26 are now open
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6"
          >
            Where <span className="text-gradient">Visionaries</span>
            <br /> Build the Future
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mb-10"
          >
            The premier ecosystem for industry-defining startups. Get funding,
            mentorship, and connect with top-tier talent and investors globally.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/apply" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 text-base rounded-full">
                Apply to DevUp <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ecosystem" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-base rounded-full">
                Explore Startups
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex flex-col gap-2"
              >
                <div className="text-4xl md:text-5xl font-bold text-white">{stat.value}</div>
                <div className="text-sm font-medium text-white/50 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Startups */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Breakthrough Innovators</h2>
              <p className="text-white/60 text-lg max-w-2xl">
                Discover the hyper-growth startups redefining their industries within the DevUp ecosystem.
              </p>
            </div>
            <Link href="/ecosystem">
              <Button variant="ghost" className="gap-2">
                View All Startups <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredStartups.map((startup, index) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/ecosystem/${startup.id}`}>
                  <Card className="h-full flex flex-col group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                    <div className="h-32 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={startup.banner}
                        alt={`${startup.name} banner`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={startup.logo}
                        alt={startup.name}
                        className="absolute bottom-4 left-4 w-12 h-12 rounded-lg border border-white/20 bg-black/50"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl">{startup.name}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white/80">
                          {startup.stage}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mb-4 line-clamp-2 flex-1">
                        {startup.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-white/40 pt-4 border-t border-white/10 mt-auto">
                        <span>{startup.category}</span>
                        <span>{startup.openRoles} Open Roles</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How we help section */}
      <section className="py-32 bg-white/[0.02] border-y border-white/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How We Accelerate Growth</h2>
            <p className="text-white/60 text-lg">
              We provide an unfair advantage to founders with a comprehensive suite of resources, network access, and capital opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                title: "Rapid Scaling",
                desc: "Playbooks and frameworks from founders who have built unicorn companies.",
              },
              {
                icon: <Globe className="w-8 h-8 text-blue-500" />,
                title: "Global Network",
                desc: "Direct access to top-tier VCs, angel investors, and industry executives.",
              },
              {
                icon: <Shield className="w-8 h-8 text-green-500" />,
                title: "Premium Support",
                desc: "Legal, hiring, and technical infrastructure support for your early days.",
              },
              {
                icon: <Rocket className="w-8 h-8 text-purple-500" />,
                title: "Talent Hub",
                desc: "Hire from our curated pool of world-class engineers, designers, and operators.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl glass border border-white/5 hover:border-white/20 transition-colors"
              >
                <div className="mb-4 p-3 bg-white/5 inline-block rounded-xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">Backed by Founders</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTestimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="p-8 h-full flex flex-col">
                  <div className="mb-6 text-white/80 italic flex-1">
                    "{testimonial.quote}"
                  </div>
                  <div className="flex items-center gap-4 mt-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full bg-white/10"
                    />
                    <div>
                      <div className="font-bold text-sm">{testimonial.author}</div>
                      <div className="text-xs text-white/50">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Ready to Build?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60 mb-10 max-w-2xl mx-auto"
          >
            Join the next generation of visionary founders. Submit your application today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/apply">
              <Button className="h-16 px-10 text-lg rounded-full">
                Start Your Application
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
