"use client";

import { useEffect, useRef, useState } from "react";

export default function MapTestPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<string>("Loading...");
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // This function will be called when the button is clicked to load the test map
  const handleLoadMap = async () => {
    try {
      setStatus("Fetching map file...");
      const response = await fetch("/test-map.map");
      const text = await response.text();
      // Ensure CRLF line endings as Azgaar strictly expects \r\n
      const fixedText = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const blob = new Blob([fixedText], { type: "text/plain" });
      
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        setStatus("Loading map into Azgaar...");
        
        const win = iframe.contentWindow as any;
        if (win.uploadMap) {
           win.uploadMap(blob);
           setStatus("Map loaded via uploadMap!");
           
           // After a slight delay to allow parsing, we can try to inspect state
           setTimeout(() => {
             try {
               const states = win.pack?.states;
               if (states) {
                 console.log("States:", states);
                 setStatus(`Map loaded! Found ${states.length} states.`);
               }
             } catch (err) {
               console.error("Could not read pack:", err);
             }
           }, 2000);
        } else {
           setStatus("uploadMap function not found on iframe window");
        }
      }
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-slate-900 text-slate-200">
      <div className="mb-4 flex gap-4 items-center">
        <h1 className="text-xl font-bold">Azgaar Embed Test</h1>
        <button 
          onClick={handleLoadMap}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
        >
          Programmatically Load Map
        </button>
        <span>Status: {status}</span>
      </div>
      <div className="flex-1 border border-slate-700 rounded overflow-hidden relative">
        <iframe 
          ref={iframeRef}
          src="/azgaar/index.html" 
          className="w-full h-full border-none"
          onLoad={() => {
             setStatus("Iframe loaded");
             setMapLoaded(true);
          }}
        />
      </div>
    </div>
  );
}
