'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Download, MapPin, Users, HardHat } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal?: () => void;
  onExportCsv?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddModal, onExportCsv }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Track Area', href: '/', icon: MapPin },
    { label: 'MLAs', href: '/mlas', icon: Users },
    { label: 'Contractors', href: '/contractors', icon: HardHat },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6EAF0] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex flex-col">
            <h2 className="text-xl font-extrabold text-[#0B1B2F] tracking-tight font-sans m-0 leading-tight">
              Jawabdari
            </h2>
            <div className="flex items-center text-[11px] font-semibold uppercase tracking-wider text-[#0B1B2F]/70 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFC21A] shadow-[0_0_6px_#FFC21A] mr-1.5"></span>
              <span>Ludhiana Public Works & MLALADS</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-[#0B1B2F]/5 text-[#0B1B2F] font-semibold border border-[#0B1B2F]/10'
                      : 'text-[#0B1B2F]/70 hover:text-[#0B1B2F] hover:bg-[#0B1B2F]/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF7A00]' : 'text-[#0B1B2F]/40'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-[#0B1B2F] bg-white border border-[#E6EAF0] rounded-lg hover:bg-[#FAF7F2] transition-colors shadow-xs cursor-pointer"
                title="Export to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#0B1B2F]/60" />
                <span>Export</span>
              </button>
            )}

            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center space-x-1 px-3.5 py-1.5 text-xs font-semibold text-[#0B1B2F] bg-[#FF7A00] rounded-lg hover:bg-[#e66e00] transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
