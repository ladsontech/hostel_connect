import React from 'react';
import Link from 'next/link';
import FaIcon from './FaIcon';

export default function Footer() {
  return (
    <div className="mt-16 sm:mt-24">
      {/* Top Assistance Banner - Positioned slightly above the footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <div className="bg-[#0f3a98] rounded-2xl shadow-xl border border-blue-900/40 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-3.5 sm:gap-4 text-center md:text-left z-10">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0f3a98] text-xl shrink-0 shadow-sm">
              <FaIcon icon="fa-solid fa-headset" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-medium text-white">Need help finding a hostel this semester?</h4>
              <p className="text-xs sm:text-sm text-blue-100 font-light mt-0.5">
                Speak directly with verified campus custodians or chat with our student support team in Kampala.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center z-10 shrink-0">
            <a
              href="https://wa.me/256700000000?text=Hello%20Hostel%20Connect,%20I%20am%20looking%20for%20a%20hostel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs sm:text-sm font-medium hover:brightness-110 transition shadow-sm"
            >
              <FaIcon icon="fa-brands fa-whatsapp" className="text-base" />
              <span>WhatsApp Support</span>
            </a>
            <a
              href="tel:+256700000000"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ffbe00] text-[#0f3a98] text-xs sm:text-sm font-medium hover:bg-yellow-400 transition shadow-sm"
            >
              <FaIcon icon="fa-solid fa-phone" className="text-xs" />
              <span>+256 700 000 000</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="bg-[#0f3a98] text-white">

      {/* Main Footer Navigation Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8 lg:gap-10 text-center md:text-left">
          {/* Column 1: Brand & Contact Info */}
          <div className="lg:col-span-2 space-y-4 flex flex-col items-center md:items-start">
            <div className="inline-flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl shadow-sm">
              <img src="/logo.png" alt="Hostel Connect" className="h-7 w-auto object-contain" />
            </div>

            <p className="text-xs text-blue-100 font-light leading-relaxed max-w-sm mx-auto md:mx-0">
              Hostel Connect Uganda is the official university student accommodation marketplace.
              We connect students directly to verified hostel owners, custodians, and vetted campus scouts
              with zero middleman booking fees.
            </p>

            <div className="space-y-2 text-xs text-blue-100 pt-2 flex flex-col items-center md:items-start w-full">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <FaIcon icon="fa-solid fa-location-dot" className="text-[#ffbe00] text-xs shrink-0" />
                <span>Kampala, Uganda • Serving Makerere, MUBS, Kyambogo & beyond</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <FaIcon icon="fa-solid fa-envelope" className="text-[#ffbe00] text-xs shrink-0" />
                <a href="mailto:support@hostelconnect.ug" className="hover:text-[#ffbe00] transition-colors">
                  support@hostelconnect.ug
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <FaIcon icon="fa-solid fa-shield-halved" className="text-[#ffbe00] text-xs shrink-0" />
                <span>Compliant with Uganda Data Protection & Privacy Act, 2019</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2 flex flex-col items-center md:items-start">
              <span className="text-[11px] font-medium text-blue-200 block mb-2 uppercase tracking-wider">
                Follow & Connect
              </span>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <a
                  href="https://wa.me/256700000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffbe00] hover:text-[#0f3a98] text-white flex items-center justify-center text-xs transition"
                  aria-label="WhatsApp"
                >
                  <FaIcon icon="fa-brands fa-whatsapp" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffbe00] hover:text-[#0f3a98] text-white flex items-center justify-center text-xs transition"
                  aria-label="X (Twitter)"
                >
                  <FaIcon icon="fa-brands fa-x-twitter" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffbe00] hover:text-[#0f3a98] text-white flex items-center justify-center text-xs transition"
                  aria-label="Facebook"
                >
                  <FaIcon icon="fa-brands fa-facebook-f" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffbe00] hover:text-[#0f3a98] text-white flex items-center justify-center text-xs transition"
                  aria-label="Instagram"
                >
                  <FaIcon icon="fa-brands fa-instagram" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ffbe00] hover:text-[#0f3a98] text-white flex items-center justify-center text-xs transition"
                  aria-label="LinkedIn"
                >
                  <FaIcon icon="fa-brands fa-linkedin-in" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Campus Hubs */}
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <h4 className="text-xs font-medium text-[#ffbe00] uppercase tracking-wider">
              Popular Campuses
            </h4>
            <ul className="space-y-2 text-xs text-blue-100 font-light flex flex-col items-center md:items-start">
              <li>
                <Link href="/?university=Makerere+University" className="hover:text-[#ffbe00] transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <FaIcon icon="fa-solid fa-graduation-cap" className="text-[10px] text-white/50" />
                  <span>Makerere (Kikoni, Wandegeya)</span>
                </Link>
              </li>
              <li>
                <Link href="/?university=MUBS" className="hover:text-[#ffbe00] transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <FaIcon icon="fa-solid fa-graduation-cap" className="text-[10px] text-white/50" />
                  <span>MUBS (Nakawa, Kataza)</span>
                </Link>
              </li>
              <li>
                <Link href="/?university=Kyambogo+University" className="hover:text-[#ffbe00] transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <FaIcon icon="fa-solid fa-graduation-cap" className="text-[10px] text-white/50" />
                  <span>Kyambogo (Banda)</span>
                </Link>
              </li>
              <li>
                <Link href="/?university=UCU+Mukono" className="hover:text-[#ffbe00] transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <FaIcon icon="fa-solid fa-graduation-cap" className="text-[10px] text-white/50" />
                  <span>UCU (Mukono Campus)</span>
                </Link>
              </li>
              <li>
                <Link href="/?university=KIU+Kansanga" className="hover:text-[#ffbe00] transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <FaIcon icon="fa-solid fa-graduation-cap" className="text-[10px] text-white/50" />
                  <span>KIU (Kansanga, Ggaba Rd)</span>
                </Link>
              </li>
              <li>
                <Link href="/?university=Ndejje+University" className="hover:text-[#ffbe00] transition-colors flex items-center justify-center md:justify-start gap-1.5">
                  <FaIcon icon="fa-solid fa-graduation-cap" className="text-[10px] text-white/50" />
                  <span>Ndejje & Cavendish</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Students */}
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <h4 className="text-xs font-medium text-[#ffbe00] uppercase tracking-wider">
              For Students
            </h4>
            <ul className="space-y-2 text-xs text-blue-100 font-light flex flex-col items-center md:items-start">
              <li>
                <Link href="/#explore" className="hover:text-[#ffbe00] transition-colors">
                  Browse All Hostels
                </Link>
              </li>
              <li>
                <Link href="/#featured-rooms" className="hover:text-[#ffbe00] transition-colors">
                  Featured Student Rooms
                </Link>
              </li>
              <li>
                <Link href="/#explore" className="hover:text-[#ffbe00] transition-colors">
                  Check Real-time Vacancies
                </Link>
              </li>
              <li>
                <Link href="/#explore" className="hover:text-[#ffbe00] transition-colors">
                  Hostels with Free Shuttle
                </Link>
              </li>
              <li>
                <Link href="/#explore" className="hover:text-[#ffbe00] transition-colors">
                  Hostels with Standby Generator
                </Link>
              </li>
              <li>
                <a href="#safety" className="hover:text-[#ffbe00] transition-colors">
                  Student Safety & Anti-Scam Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Custodians & Trust */}
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <h4 className="text-xs font-medium text-[#ffbe00] uppercase tracking-wider">
              Custodians & Trust
            </h4>
            <ul className="space-y-2 text-xs text-blue-100 font-light flex flex-col items-center md:items-start">
              <li>
                <Link href="/seller" className="hover:text-[#ffbe00] transition-colors">
                  List Your Hostel Free
                </Link>
              </li>
              <li>
                <Link href="/seller" className="hover:text-[#ffbe00] transition-colors">
                  Custodian Dashboard
                </Link>
              </li>
              <li>
                <Link href="/seller" className="hover:text-[#ffbe00] transition-colors">
                  Verified Scout Program
                </Link>
              </li>
              <li>
                <span className="text-white/70 block text-[11px]">
                  Strict 3-Strike Fraud Ban
                </span>
              </li>
              <li>
                <span className="text-white/70 block text-[11px]">
                  Zero Commission on Bookings
                </span>
              </li>
              <li>
                <span className="text-white/70 block text-[11px]">
                  Direct Student Verification
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright, Tamu-tech Attribution & Compliance */}
      <div className="border-t border-white/10 py-6 px-4 sm:px-6 text-xs text-blue-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <span className="font-medium text-white">© 2026 Hostel Connect Uganda.</span>
              <span>All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-blue-100">National Data Protection Office Compliant</span>
            </div>

            <div className="text-[11px] text-blue-200 flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
              <span>A digital product of</span>
              <a
                href="https://www.tamu-tech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#ffbe00] hover:underline inline-flex items-center gap-1"
              >
                <span>Tamu-tech</span>
                <FaIcon icon="fa-solid fa-arrow-up-right-from-square" className="text-[9px]" />
              </a>
              <span className="text-white/40">•</span>
              <a
                href="https://www.tamu-tech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white underline underline-offset-2 transition"
              >
                www.tamu-tech.com
              </a>
            </div>
          </div>

          <div className="text-[11px] text-blue-100 font-light text-center md:text-right">
            Built adhering to the Hostel Marketplace SRS (Draft 1.0) • Makerere • MUBS • Kyambogo
          </div>
        </div>
      </div>
    </footer>
    </div>
  );
}
