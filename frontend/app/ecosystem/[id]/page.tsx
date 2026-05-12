"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageCircle, Globe, Briefcase, MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { featuredStartups } from "@/data/mockData";

export default function StartupProfile() {
  const params = useParams();
  const { id } = params as { id: string };

  const startup = featuredStartups.find((s) => s.id === id);

  if (!startup) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Startup not found</h1>
          <Link href="/ecosystem">
            <Button variant="outline">Back to Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Banner */}
      <div className="w-full h-64 md:h-80 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={startup.banner}
          alt={`${startup.name} banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-10">
        <Link href="/ecosystem" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={startup.logo}
                alt={startup.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-black bg-zinc-900"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold">{startup.name}</h1>
                  <span className="px-3 py-1 text-xs font-medium bg-white/10 rounded-full">
                    {startup.stage}
                  </span>
                </div>
                <p className="text-xl text-white/60">{startup.category}</p>
              </div>
              <div className="flex gap-2">
                <Button className="rounded-full px-6">
                  Follow
                </Button>
                <Button variant="outline" className="rounded-full w-12 px-0 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <p className="text-white/70 leading-relaxed text-lg mb-6">
                {startup.description}
                <br /><br />
                We are on a mission to completely revolutionize our industry by leveraging state-of-the-art technologies and an incredibly talented team. Our vision is to empower individuals and businesses globally, providing them with the tools they need to succeed in an ever-evolving digital landscape.
              </p>
              
              <div className="flex flex-wrap gap-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-5 h-5 text-white/40" />
                  <span>{startup.location}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Users className="w-5 h-5 text-white/40" />
                  <span>10-50 Employees</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <span>Founded {startup.founded}</span>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Open Roles</h2>
                <span className="text-sm text-green-400 font-medium">{startup.openRoles} Jobs</span>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Senior Full Stack Engineer", type: "Full-time", location: "Remote" },
                  { title: "Product Designer", type: "Full-time", location: "San Francisco, CA" },
                  { title: "Growth Marketing Lead", type: "Full-time", location: "Remote" },
                ].slice(0, startup.openRoles).map((job, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors gap-4">
                    <div>
                      <h4 className="font-bold mb-1">{job.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span>{job.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="text-sm">Apply</Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Founder</h3>
              <div className="flex items-center gap-4 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${startup.founder}`}
                  alt={startup.founder}
                  className="w-12 h-12 rounded-full bg-white/10"
                />
                <div>
                  <div className="font-medium">{startup.founder}</div>
                  <div className="text-sm text-white/50">CEO & Founder</div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href="#" className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                  <Briefcase className="w-4 h-4" />
                </a>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Socials & Links</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Globe className="w-5 h-5 text-white/40" /> Website
                </a>
                <a href="#" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5 text-white/40" /> Twitter
                </a>
                <a href="#" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5 text-white/40" /> LinkedIn
                </a>
                <a href="#" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                  <Globe className="w-5 h-5 text-white/40" /> GitHub
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
