"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <Card className="animate-fade-in-up border-dashed border-border/60 bg-card/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
          <Icon className="h-6 w-6 text-primary/60" />
        </div>
        <h3 className="mt-5 text-lg tracking-tight">{title}</h3>
        {description && (
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            className="mt-5 bg-gradient-to-r from-brand-600 to-brand-700 shadow-md shadow-brand-600/15 hover:shadow-lg"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
