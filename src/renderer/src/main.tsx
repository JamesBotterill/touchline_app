import "./assets/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import App from "./App";
import { Teams } from "@/pages/Teams";
import { Settings } from "@/pages/Settings";
import { GeneralSettings } from "@/pages/GeneralSettings";
import { SeasonManagement } from "@/pages/SeasonManagement";
import { SponsorManagement } from "@/pages/SponsorManagement";
import { SocialMediaManagement } from "@/pages/SocialMediaManagement";
import { SocialMediaPlatformDetails } from "@/pages/SocialMediaPlatformDetails";
import { SponsorshipTypes } from "@/pages/SponsorshipTypes";
import { TeamDetails } from "@/pages/TeamDetails";
import { ModelManagement } from "@/pages/ModelManagement";
import { DetectionSettings } from "@/pages/DetectionSettings";
import { MCPSetup } from "@/pages/MCPSetup";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/general" element={<GeneralSettings />} />
          <Route path="/settings/seasons" element={<SeasonManagement />} />
          <Route path="/settings/sponsors" element={<SponsorManagement />} />
          <Route path="/settings/sponsorship-types" element={<SponsorshipTypes />} />
          <Route path="/settings/social-media" element={<SocialMediaManagement />} />
          <Route path="/settings/social-media/:platformId" element={<SocialMediaPlatformDetails />} />
          <Route path="/settings/models" element={<ModelManagement />} />
          <Route path="/settings/detection" element={<DetectionSettings />} />
          <Route path="/settings/mcp" element={<MCPSetup />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  </StrictMode>
);
