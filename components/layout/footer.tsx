"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Github, Twitter, Globe } from "lucide-react"
import { CoinVaultLogo } from "@/components/CoinVault-logo"

export function Footer() {
  const [mounted, setMounted] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    setMounted(true)
    setCurrentYear(new Date().getFullYear())
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Deposit", href: "/deposit" },
    { name: "Stake", href: "/stake" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Governance", href: "/governance" },
  ]

  const resources = [
    { name: "Documentation", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ]

  return (
    <footer className="bg-[#67c4ff] text-white border-t border-[#67c4ff]/30">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <CoinVaultLogo size="sm" showText={true} textColor="text-white" />
            </div>
            <p className="text-white/90 text-sm mb-4">
              A decentralized platform for ETH staking and governance. Stake your ETH, earn rewards, and participate in
              protocol governance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-white/80 transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Website</span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-3 text-white">Navigation</h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-white/90 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-3 text-white">Resources</h3>
            <ul className="space-y-2">
              {resources.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-white/90 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <h3 className="text-lg font-semibold mb-3 text-white">Stay Updated</h3>
            <p className="text-white/90 text-sm mb-4">
              Subscribe to our newsletter for the latest updates on CoinVault staking and governance.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-md w-full focus:outline-none text-lightblue-900 border border-lightblue-200"
              />
              <button className="bg-white hover:bg-white/90 text-[#67c4ff] px-4 py-2 rounded-r-md transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 md:mt-12 pt-6 md:pt-8 flex justify-center">
          <p className="text-white/80 text-sm">
            {mounted && <>
              &copy; {currentYear} CoinVault Governance Platform. All rights reserved.
            </>}
          </p>
        </div>
      </div>
    </footer>
  )
}
