import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import PlacesPage from "@/pages/PlacesPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import ImportPage from "@/pages/ImportPage";
import { BellOff } from "lucide-react";

function AppHeader() {
  const { t } = useApp();
  return (
    <header className="px-5 pt-5 flex items-center justify-between" data-testid="app-header">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-[#2C3E50] flex items-center justify-center text-white shadow-md shadow-[#2C3E50]/20">
          <BellOff size={18} strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-bold text-[#1C2833] tracking-tight">
            {t.app_name}
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-[#5D6D7E] font-medium">
            {t.app_tagline}
          </p>
        </div>
      </Link>
    </header>
  );
}

function MainLayout({ children }) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
      <BottomNav />
    </>
  );
}

function Shell() {
  const location = useLocation();
  const isImportRoute = location.pathname.startsWith("/s/");

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C2833] qz-grain">
      <div className="max-w-2xl mx-auto relative">
        {isImportRoute ? (
          <Routes>
            <Route path="/s/:shareId" element={<ImportPage />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/places" element={<MainLayout><PlacesPage /></MainLayout>} />
            <Route path="/history" element={<MainLayout><HistoryPage /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AppProvider>
  );
}
