"use client";
import dynamic from "next/dynamic";
import Dashboard from "../components/Dashboard";
const Viewer = dynamic(
  () => import("../components/Viewer"),
  { ssr: false }
);
export default function HomePage() {
  return (
    <main className="appContainer">
      <Viewer />
      <div className="topRightWidgets">
        <Dashboard />
      </div>
    </main>
  )
}