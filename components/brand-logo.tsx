import Image from "next/image";

export default function BrandLogo({ className = "brand-logo" }: { className?: string }) {
  return (
    <Image
      src="/brand/costaatt-logo-white.webp"
      alt="COSTAATT Student Portal"
      width={140}
      height={140}
      className={className}
      priority
    />
  );
}
