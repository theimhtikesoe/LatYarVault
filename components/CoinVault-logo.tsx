import { cn } from "@/lib/utils"

interface CoinVaultLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  textColor?: string
}

export function CoinVaultLogo({
  className,
  showText = true,
  size = "md",
  textColor = "text-lightblue-950",
}: CoinVaultLogoProps) {
  const sizes = {
    sm: { container: "h-8 w-8", text: "text-lg" },
    md: { container: "h-10 w-10", text: "text-xl" },
    lg: { container: "h-12 w-12", text: "text-2xl" },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizes[size].container)}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="CoinVault-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#CoinVault-gradient)" />
          <path d="M50 20L30 50L50 40L70 50L50 20Z" fill="white" fillOpacity="0.9" />
          <path d="M50 45L30 55L50 80L70 55L50 45Z" fill="white" fillOpacity="0.9" />
          <path d="M50 20L50 40L70 50L50 20Z" fill="white" fillOpacity="0.7" />
          <path d="M50 45L50 80L70 55L50 45Z" fill="white" fillOpacity="0.7" />
          <path
            d="M35 52.5C35 43.94 41.94 37 50.5 37V64C41.94 64 35 57.06 35 48.5V52.5Z"
            fill="white"
            fillOpacity="0.2"
          />
        </svg>
      </div>
      {showText && <span className={cn("font-bold whitespace-nowrap", textColor, sizes[size].text)}>CoinVault</span>}
    </div>
  )
}
