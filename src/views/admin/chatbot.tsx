"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Bot } from "lucide-react";

const Chatbot = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin AI</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Ask questions about inventory, feeds, and site activity
          </p>
        </div>
        <Button className="bg-primary text-white" disabled>
          <Bot className="h-4 w-4" /> Start chat
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEmptyState
            title="Admin AI not available yet"
            description="The assistant will connect to live inventory and activity data once an LLM backend is configured. Demo replies with fabricated metrics have been removed."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Chatbot;
