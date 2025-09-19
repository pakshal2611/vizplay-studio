import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, Brain, Download, Upload, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: "Data Import",
      description: "Upload CSV, JSON files or paste data directly. Auto-detects column types and structures."
    },
    {
      icon: BarChart3,
      title: "Interactive Charts",
      description: "Create stunning visualizations with drag-and-drop chart builder. Bar, line, scatter, pie charts and more."
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Discover hidden patterns, correlations, and outliers with our intelligent analysis engine."
    },
    {
      icon: Download,
      title: "Export Everything",
      description: "Export dashboards as PNG/PDF, download data as CSV, or copy charts directly."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-gradient-primary p-4 shadow-glow">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="hero-text mb-6">
              Advanced Data Visualization Playground
            </h1>
            
            <p className="hero-subtitle mb-12">
              Transform your data into beautiful, interactive visualizations with AI-powered insights. 
              No coding required – just upload, analyze, and discover.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-3 h-auto shadow-lg hover-lift"
                onClick={() => navigate("/dashboard")}
              >
                Try the Playground
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-3 h-auto border-2 hover-lift"
                onClick={() => navigate("/dashboard")}
              >
                See Demo
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Animation Elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 bg-primary-glow/10 rounded-full blur-xl"
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Everything you need to visualize data
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make data analysis effortless and insightful
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-lift hover-glow transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <div className="container mx-auto max-w-4xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Zap className="h-16 w-16 mx-auto mb-6 text-primary animate-float" />
            <h2 className="text-4xl font-bold mb-6">
              Ready to unlock your data's potential?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of analysts and discover insights hidden in your data with our powerful visualization platform.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg px-12 py-4 h-auto shadow-xl hover-lift"
              onClick={() => navigate("/dashboard")}
            >
              Start Analyzing Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}