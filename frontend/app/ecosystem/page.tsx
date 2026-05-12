"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Filter, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { featuredStartups } from "@/data/mockData";

const categories = ["All", "Artificial Intelligence", "Fintech", "HealthTech", "Developer Tools", "SaaS"];

export default function EcosystemDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredStartups = featuredStartups.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          startup.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || startup.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Header */}
      <section className="container mx-auto px-4 md:px-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Explore the <span className="text-gradient">Ecosystem</span>
          </h1>
          <p className="text-xl text-white/60">
            Discover the most innovative startups building the future. Filter by industry, or search for your next big opportunity.
          </p>
        </motion.div>
      </section>

      {/* Filters and Search */}
      <section className="container mx-auto px-4 md:px-6 mb-12 sticky top-24 z-40">
        <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search startups, founders, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-white text-black"
                    : "hover:bg-white/10 text-white/70"
                }`}
              >
                {category}
              </button>
            ))}
            <button className="p-2 rounded-lg hover:bg-white/10 text-white/70 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.length > 0 ? (
            filteredStartups.map((startup, index) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link href={`/ecosystem/${startup.id}`}>
                  <Card className="h-full flex flex-col group cursor-pointer hover:border-white/20">
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={startup.logo}
                          alt={startup.name}
                          className="w-16 h-16 rounded-xl border border-white/10 bg-black/50"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white/80">
                            {startup.stage}
                          </span>
                          <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-2xl mb-2">{startup.name}</h3>
                      <p className="text-sm text-white/60 mb-6 flex-1 line-clamp-3">
                        {startup.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/40">Category</span>
                          <span className="text-white/80">{startup.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/40">Location</span>
                          <span className="text-white/80">{startup.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
                          <span className="text-white/40">Open Roles</span>
                          <span className="text-green-400 font-medium">{startup.openRoles} Jobs</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-white/50 text-lg">No startups found matching your criteria.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-white hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
