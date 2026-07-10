"use client";

import { Card, CardContent } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import serverError from "@/assets/admin/serverError.gif";
import { assetSrc } from "@/lib/admin/utils";

const ServerError = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-primary/20 shadow-2xl shadow-primary/10">
        <CardContent className="pt-6">
          <motion.div className="max-w-fit mx-auto relative"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <img src={assetSrc(serverError)} alt="Server Error" width={200} className="relative z-10" />
          </motion.div>

          <motion.div className="text-center mt-8 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.h1 className="text-7xl font-black text-primary"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 10
              }}
            >
              500
            </motion.h1>
            <motion.h2 className="text-3xl font-bold text-primary/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Server Error
            </motion.h2>
            <motion.p className="text-muted-foreground max-w-md mx-auto text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              A scraper or admin view failed to load. In production this would log to your ops team — for now, return to the dashboard and retry.
            </motion.p>
            <motion.div className="flex gap-4 justify-center pt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button onClick={() => router.back()} variant="outline" className="border-primary/30 hover:bg-primary/10 hover:border-primary/50">Go Back</Button>
              <Button onClick={() => router.push('/admin/dashboard')} className="bg-primary hover:bg-primary/90 text-white">Go to dashboard</Button>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ServerError;
