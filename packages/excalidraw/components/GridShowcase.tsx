import React, { useState } from "react";
import { Island } from "./Island";
import { Button } from "./Button";
import { gridIcon } from "./icons";
import type { AppState } from "../types";

interface GridShowcaseProps {
  appState: AppState;
  setAppState: React.Component<any, AppState>["setState"];
  onClose: () => void;
}

const GRID_PRESETS = [
  { name: "Fine Grid", gridSize: 10, gridStep: 2 },
  { name: "Default Grid", gridSize: 20, gridStep: 5 },
  { name: "Coarse Grid", gridSize: 40, gridStep: 4 },
  { name: "Large Grid", gridSize: 60, gridStep: 3 },
  { name: "Minimal Grid", gridSize: 5, gridStep: 1 },
];

export const GridShowcase: React.FC<GridShowcaseProps> = ({
  appState,
  setAppState,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(1); // Default Grid

  const applyGridPreset = (preset: typeof GRID_PRESETS[0], index: number) => {
    setSelectedPreset(index);
    setAppState({
      gridSize: preset.gridSize,
      gridStep: preset.gridStep,
      gridModeEnabled: true,
    });
  };

  const toggleGrid = () => {
    setAppState({
      gridModeEnabled: !appState.gridModeEnabled,
    });
  };

  const updateGridSize = (value: number) => {
    setAppState({
      gridSize: Math.max(5, Math.min(100, value)),
    });
  };

  const updateGridStep = (value: number) => {
    setAppState({
      gridStep: Math.max(1, Math.min(20, value)),
    });
  };

  return (
    <div className="grid-showcase-container">
      <Island padding={3}>
        <div className="grid-showcase">
          <div className="grid-showcase-header">
            <h3>Grid Showcase</h3>
            <Button
              type="button"
              size="small"
              onClick={onClose}
              title="Close Grid Showcase"
            >
              ×
            </Button>
          </div>

          <div className="grid-showcase-content">
            <div className="grid-controls">
              <div className="grid-toggle">
                <Button
                  type="button"
                  size="medium"
                  onClick={toggleGrid}
                  className={appState.gridModeEnabled ? "active" : ""}
                >
                  {gridIcon} {appState.gridModeEnabled ? "Hide Grid" : "Show Grid"}
                </Button>
              </div>

              <div className="grid-presets">
                <h4>Grid Presets</h4>
                <div className="preset-buttons">
                  {GRID_PRESETS.map((preset, index) => (
                    <Button
                      key={preset.name}
                      type="button"
                      size="small"
                      onClick={() => applyGridPreset(preset, index)}
                      className={selectedPreset === index ? "active" : ""}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid-settings">
                <h4>Custom Settings</h4>
                <div className="setting-row">
                  <label>Grid Size: {appState.gridSize}px</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={appState.gridSize}
                    onChange={(e) => updateGridSize(parseInt(e.target.value))}
                  />
                </div>
                <div className="setting-row">
                  <label>Grid Step: {appState.gridStep}</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={appState.gridStep}
                    onChange={(e) => updateGridStep(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid-info">
                <h4>Grid Information</h4>
                <div className="info-grid">
                  <div>Status: {appState.gridModeEnabled ? "Enabled" : "Disabled"}</div>
                  <div>Cell Size: {appState.gridSize}px</div>
                  <div>Bold Lines Every: {appState.gridStep} cells</div>
                  <div>Zoom Level: {Math.round(appState.zoom.value * 100)}%</div>
                </div>
              </div>

              <div className="grid-tips">
                <h4>Tips</h4>
                <ul>
                  <li>Use <kbd>Ctrl/Cmd + '</kbd> to toggle grid</li>
                  <li>Grid adapts to zoom level for optimal visibility</li>
                  <li>Bold lines appear every {appState.gridStep} grid cells</li>
                  <li>Grid helps with precise element alignment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Island>
    </div>
  );
};

export default GridShowcase;