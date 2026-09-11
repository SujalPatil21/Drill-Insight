import React from "react";
import { cn } from "../../lib/utils";

interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({ 
  className, 
  eyebrow, 
  title, 
  description, 
  align = "center",
  ...props 
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-4", align === "center" ? "items-center text-center" : "items-start text-left", className)} {...props}>
      {eyebrow && (
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="max-w-[800px] text-text-secondary sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
