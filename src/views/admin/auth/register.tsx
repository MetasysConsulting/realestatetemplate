"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import authimg from "@/assets/admin/auth-bg-img.jpg";
import robo1 from "@/assets/admin/robo-1.png";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { assetSrc } from "@/lib/admin/utils";
import { ReovanaLogo } from "@/components/admin/reovana-logo";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }

    // Show loading animation
    setIsLoading(true)

    // Wait for entry animation to complete
    setTimeout(() => {
      // Trigger exit animation
      setIsLoading(false)
      // Navigate after exit animation completes
      setTimeout(() => {
        router.push("/admin/home")
      }, 1000)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center md:justify-start p-4">
      {/* Loading Animation */}
      <AnimatePresence>
        {isLoading && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-lg bg-background/30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.img src={assetSrc(robo1)} alt="Loading" className="w-32"
              initial={{ y: -200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img src={assetSrc(authimg)} className="w-full h-full object-cover" alt="Background" />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 to-transparent" />
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md relative mx-auto lg:ml-48 z-10">
        <Card className="backdrop-blur-md bg-card">
          <CardHeader className="space-y-3">
            <div className="flex justify-center">
              <ReovanaLogo size="lg" />
            </div>
            <CardTitle className="text-xl font-bold text-center">Request admin access</CardTitle>
            <CardDescription className="text-center">Invite-only — use bypass on login for demo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" name="name" type="text" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required/>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required/>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={formData.password} onChange={handleChange} required className="pr-10"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} required className="pr-10"/>
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <Button type="submit" className="w-full text-white" size="lg">Submit request</Button>

              <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/admin/home")}>
                Continue without login
              </Button>

              {/* Sign In Link */}
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/admin/login" className="text-primary hover:underline font-medium">Login</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register;