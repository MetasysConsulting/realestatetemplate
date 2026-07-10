import { clsx, type ClassValue } from "clsx";
import type { StaticImageData } from "next/image";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assetSrc(image: string | StaticImageData): string {
  return typeof image === "string" ? image : image.src;
}
