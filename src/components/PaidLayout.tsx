import { Outlet } from "react-router-dom";
import BottomTabNav from "./BottomTabNav";
import { useHeartbeat } from "@/hooks/useHeartbeat";

export default function PaidLayout() {
  useHeartbeat();
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Outlet />
      </div>
      <BottomTabNav />
    </div>
  );
}
