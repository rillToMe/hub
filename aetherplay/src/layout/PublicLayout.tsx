import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-hub-bg text-hub-text font-mono text-[15px] leading-relaxed">
      <Navbar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
