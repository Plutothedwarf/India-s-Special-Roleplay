"use client";

import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type NationMapData = {
  id: string;
  name: string;
  color: string;
  geometry: string | null;
  government_type: string | null;
  capital_burg_name: string | null;
  is_claimed: boolean;
};

export default function MapViewer({ nations }: { nations: NationMapData[] }) {
  const [selectedNation, setSelectedNation] = useState<NationMapData | null>(null);

  // We only care about nations that actually have geometry to render
  const mapNations = nations.filter((n) => n.geometry);

  return (
    <div className="relative w-full h-full min-h-[500px] sm:min-h-[600px] bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden flex items-center justify-center">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => zoomIn()}
                className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg backdrop-blur-sm border border-slate-600/50 transition-colors shadow-lg"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg backdrop-blur-sm border border-slate-600/50 transition-colors shadow-lg"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg backdrop-blur-sm border border-slate-600/50 transition-colors shadow-lg"
                title="Reset View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
            </div>

            <TransformComponent wrapperClass="w-full h-full cursor-grab active:cursor-grabbing">
              <svg
                viewBox="0 0 1366 641"
                className="w-[1000px] h-[500px] sm:w-[1366px] sm:h-[641px]"
                style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))" }}
              >
                {/* Ocean/Background */}
                <rect x="0" y="0" width="1366" height="641" fill="#1e293b" opacity="0.4" />
                
                <g id="nations-layer">
                  {mapNations.map((nation) => (
                    <path
                      key={nation.id}
                      d={nation.geometry!}
                      fill={nation.color}
                      stroke={selectedNation?.id === nation.id ? "#ffffff" : "#0f172a"}
                      strokeWidth={selectedNation?.id === nation.id ? "3" : "1"}
                      className="transition-all duration-200 hover:opacity-90 outline-none"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedNation(nation)}
                    >
                      <title>{nation.name}</title>
                    </path>
                  ))}
                </g>
              </svg>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Nation Info Panel Overlay */}
      {selectedNation && (
        <div className="absolute bottom-6 left-6 z-10 w-72 bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-600/50 shadow-2xl p-5 transform transition-all animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-slate-100 leading-tight">
              {selectedNation.name}
            </h3>
            <button
              onClick={() => setSelectedNation(null)}
              className="text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Capital</span>
              <span className="font-medium">{selectedNation.capital_burg_name || "Unknown"}</span>
            </div>
            
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Government</span>
              <span className="font-medium capitalize">{selectedNation.government_type || "Unknown"}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedNation.is_claimed ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-600/30 text-slate-400 border border-slate-500/30'}`}>
                {selectedNation.is_claimed ? 'Claimed' : 'Unclaimed'}
              </span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-slate-900" 
                  style={{ backgroundColor: selectedNation.color }}
                />
                <span className="text-xs text-slate-400">Map Color</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
