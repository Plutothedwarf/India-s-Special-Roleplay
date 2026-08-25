"use client";

import { useEffect, useRef, useState } from "react";
import { AzgaarBridge } from "@/lib/azgaar-bridge";

type NationInfo = {
  id: string;
  map_id: number;
  name: string;
  color: string | null;
  is_claimed: boolean;
  capital_burg_name: string | null;
};

export default function AzgaarMap({
  mapSourceName,
  nations,
}: {
  mapSourceName: string;
  nations: NationInfo[];
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bridge, setBridge] = useState<AzgaarBridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedNation, setSelectedNation] = useState<NationInfo | null>(null);

  useEffect(() => {
    let active = true;
    let currentBridge: AzgaarBridge | null = null;
    let cleanupClick: (() => void) | null = null;

    async function initMap() {
      if (!iframeRef.current) return;
      
      try {
        setLoading(true);
        const newBridge = new AzgaarBridge(iframeRef.current);
        currentBridge = newBridge;
        
        // Fetch the map text from our local API route
        const res = await fetch(`/api/maps/${mapSourceName}`);
        if (!res.ok) {
          throw new Error("Map file not found on server.");
        }
        const text = await res.text();
        
        if (!active) return;
        
        await newBridge.loadMapFromText(text);
        
        if (!active) return;
        
        // Hide UI and style
        newBridge.hideUI();
        
        // Draw provinces
        newBridge.drawProvinces();
        
        // Apply database colors
        newBridge.applyNationColors(nations);
        
        setBridge(newBridge);
        setLoading(false);

        // Hook up clicking
        cleanupClick = newBridge.onMapClick((type, id) => {
          if (type === 'state' && id !== null) {
            const nation = nations.find(n => n.map_id === id);
            setSelectedNation(nation || null);
          } else if (type === 'province' && id !== null) {
            // FMG's province IDs aren't stored exactly the same in our nations array, 
            // but we can query the iframe to find the parent state of this province.
            const win = iframeRef.current?.contentWindow as any;
            try {
              const provs = win.eval('pack.provinces');
              if (provs && provs[id]) {
                const stateId = provs[id].state;
                const nation = nations.find(n => n.map_id === stateId);
                setSelectedNation(nation || null);
                return;
              }
            } catch (e) {
              console.error("Failed to resolve province to state", e);
            }
            setSelectedNation(null);
          } else {
            setSelectedNation(null);
          }
        });

      } catch (err: any) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    // Since the iframe needs to load /azgaar/index.html first,
    // we wait for it to emit the load event before initializing.
    const iframe = iframeRef.current;
    if (iframe) {
      const onIframeLoad = () => {
        initMap();
      };
      iframe.addEventListener("load", onIframeLoad);
      return () => {
        active = false;
        iframe.removeEventListener("load", onIframeLoad);
        if (cleanupClick) cleanupClick();
      };
    }
  }, [mapSourceName, nations]);

  return (
    <div style={{ position: "relative", width: "100%", height: "75vh", minHeight: "600px", border: "1px solid #334155", borderRadius: "0.5rem", overflow: "hidden", backgroundColor: "#0f172a", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
      {loading && !error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.8)", zIndex: 10, color: "#818cf8", flexDirection: "column", gap: "0.75rem" }}>
          <div>Loading Azgaar Engine...</div>
        </div>
      )}
      
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.9)", zIndex: 10, color: "#f87171", padding: "1.5rem", textAlign: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Failed to load map</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src="/azgaar/index.html"
        style={{ width: "100%", height: "100%", border: "none", transition: "opacity 500ms", opacity: loading ? 0 : 1 }}
        title="Azgaar Fantasy Map Generator"
      />

      {/* Custom Info Panel Overlay */}
      {selectedNation && (
        <div style={{ position: "absolute", top: "1rem", right: "1rem", width: "18rem", backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "0.5rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "1rem", zIndex: 20, color: "#e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <div 
                style={{ width: "1rem", height: "1rem", borderRadius: "9999px", border: "1px solid #0f172a", backgroundColor: selectedNation.color || '#ccc' }} 
              />
              {selectedNation.name}
            </h3>
            <button 
              onClick={() => setSelectedNation(null)}
              style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
              title="Close"
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Capital</span>
              <span style={{ fontWeight: 500 }}>{selectedNation.capital_burg_name || "Unknown"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Status</span>
              {selectedNation.is_claimed ? (
                <span style={{ color: "#f87171", fontWeight: 500, backgroundColor: "rgba(127, 29, 29, 0.3)", padding: "0.125rem 0.5rem", borderRadius: "9999px" }}>Claimed</span>
              ) : (
                <span style={{ color: "#34d399", fontWeight: 500, backgroundColor: "rgba(6, 78, 59, 0.3)", padding: "0.125rem 0.5rem", borderRadius: "9999px" }}>Available</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Government</span>
              <span style={{ fontWeight: 500, color: "#64748b", fontStyle: "italic" }}>Unknown</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
