/**
 * FlytBase Top Header
 *
 * Thin top bar shown above the Verkos sidebar/content. Mirrors the FlytBase
 * product shell: logo (left), app name + Beta badge and org/plan (center),
 * profile avatar with menu (right). Wired to the existing auth context so
 * sign-out goes through SuperTokens.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@auth';
import { useOrganizationInfo } from '@libs/shared/api-modules/organization';
import { assetUrl } from '@/exhibit/asset-url';

const FlytBaseTopHeader: React.FC = () => {
  const navigate = useNavigate();
  const { tokenPayload, orgId, logout, authConfig } = useAuth();
  const { organization } = useOrganizationInfo();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const email =
    (tokenPayload?.['email'] as string | undefined) ||
    (tokenPayload?.['user_email'] as string | undefined) ||
    '';

  const initials = (() => {
    const source =
      (tokenPayload?.['name'] as string | undefined) ||
      (tokenPayload?.['user_name'] as string | undefined) ||
      email;
    if (!source) return '··';
    const parts = source.replace(/@.*$/, '').split(/[\s._-]+/).filter(Boolean);
    const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
    return (letters || source.slice(0, 2)).toUpperCase();
  })();

  const orgLabel = organization?.name || (tokenPayload?.['org_name'] as string | undefined) || orgId || '';

  const accountUrl =
    (authConfig?.appInfo as Record<string, string> | undefined)?.accountAppUrl;

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[44px] bg-[#0C0C0E] border-b border-white/[0.06] flex items-center px-4 z-50"
      role="banner"
    >
      {/* Left: logo */}
      <div className="flex items-center gap-2 min-w-[160px]">
        <img
          src={assetUrl('/assets/flytbase-logo.svg')}
          alt="FlytBase"
          className="h-5"
        />
      </div>

      {/* Center: app name + Beta + org/plan */}
      <div className="flex-1 flex items-center justify-center gap-3 text-white/[0.92]">
        <span className="fb-body-1 font-semibold">Verkos Reports</span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-[1px] rounded-md bg-primary-200/15 text-primary-200"
          aria-label="Beta"
        >
          Beta
        </span>
        {orgLabel && (
          <>
            <span className="text-white/[0.20]">|</span>
            <span className="text-[12px] text-white/[0.70] truncate max-w-[200px]">
              {orgLabel}
            </span>
          </>
        )}
        <span className="italic text-[13px] text-white/[0.55] tracking-tight">
          enterprise
        </span>
      </div>

      {/* Right: profile */}
      <div className="min-w-[160px] flex justify-end">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white/[0.92] text-[11px] font-semibold hover:bg-white/[0.14] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-lg bg-[#141417] border border-white/[0.06] shadow-lg py-1 text-[13px] text-white/[0.85]"
            >
              {email && (
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <div className="text-[11px] text-white/[0.45] uppercase tracking-wide">
                    Signed in as
                  </div>
                  <div className="truncate">{email}</div>
                </div>
              )}
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  if (accountUrl) {
                    window.location.href = accountUrl;
                  }
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] flex items-center gap-2"
              >
                <i className="fa-solid fa-user text-[11px] text-white/[0.55]" />
                Profile
              </button>
              <button
                role="menuitem"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  navigate({ to: '/login' });
                }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] flex items-center gap-2 text-error-30"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-[11px]" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default FlytBaseTopHeader;