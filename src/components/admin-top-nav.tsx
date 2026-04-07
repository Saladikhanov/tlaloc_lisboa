"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLogoutButton from "@/components/admin-logout-button";

export default function AdminTopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="site-nav">
      <div className="site-nav-inner admin-top-nav-inner">
        <Link className="brand" href="/">
          TLALOC RESTAURANT
        </Link>

        <div className="admin-nav-links desktop-admin-links">
          <Link href="/menu">Menu</Link>
          <Link href="/reserve">Reserve</Link>
          <Link href="/admin">Back Office</Link>
          <AdminLogoutButton />
        </div>

        <button
          type="button"
          className="nav-toggle admin-nav-toggle"
          aria-expanded={isOpen}
          aria-label="Toggle admin navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`admin-mobile-menu ${isOpen ? "open" : ""}`}>
          <Link href="/menu" onClick={() => setIsOpen(false)}>
            Menu
          </Link>
          <Link href="/reserve" onClick={() => setIsOpen(false)}>
            Reserve
          </Link>
          <Link href="/admin" onClick={() => setIsOpen(false)}>
            Back Office
          </Link>
          <AdminLogoutButton showLabel className="admin-mobile-exit" />
        </div>
      </div>
    </nav>
  );
}
