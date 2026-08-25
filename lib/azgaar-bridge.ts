export type AzgaarNation = {
  i: number;
  name: string;
  color: string;
};

export type AzgaarProvince = {
  i: number;
  state: number;
  name: string;
  color: string;
};

export class AzgaarBridge {
  private iframe: HTMLIFrameElement;
  private win: any;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.win = iframe.contentWindow;
  }

  /**
   * Evaluates a variable in the iframe's global scope.
   * Required because FMG uses `let` for globals like `pack`.
   */
  private getGlobal(variableName: string) {
    if (!this.win) return null;
    try {
      return this.win.eval(variableName);
    } catch (e) {
      return null;
    }
  }

  /**
   * Wait until the FMG engine has fully loaded and `pack.states` is available.
   */
  public async waitForReady(timeoutMs = 15000): Promise<void> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        const pack = this.getGlobal('pack');
        if (pack && pack.states && pack.states.length > 0) {
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          reject(new Error("Azgaar FMG timed out while initializing"));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Hides all Azgaar native UI elements (toolbars, dialogs, tooltips).
   */
  public hideUI() {
    if (!this.iframe.contentDocument) return;
    const style = this.iframe.contentDocument.createElement('style');
    style.innerHTML = `
      #optionsContainer, 
      #dialogs, 
      #tooltip, 
      #customCursor,
      #scaleBar,
      #legend {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      /* Prevent the default cursor from hiding */
      body, svg {
        cursor: default !important;
      }
      /* Extreme performance boost for panning/zooming: disable SVG filters */
      svg#map * {
        filter: none !important;
      }
    `;
    this.iframe.contentDocument.head.appendChild(style);
  }

  /**
   * Loads a map file into the engine programmatically.
   * Automatically normalizes CRLF line endings required by FMG.
   */
  public async loadMapFromText(mapText: string): Promise<void> {
    // FMG maps can become corrupted by Git or OS line-ending conversions (e.g. \n -> \r\n everywhere).
    // FMG's parser strictly expects \r\n to separate main data blocks, and \n INSIDE the SVG block.
    // If the SVG block contains \r\n, FMG's parser will split the SVG into hundreds of pieces and crash.
    // We repair it here by isolating the SVG block and restoring the correct block structure.
    const lines = mapText.replace(/\r\n/g, '\n').split('\n');
    let svgStart = -1, svgEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('<svg')) svgStart = i;
      if (lines[i].includes('</svg>')) svgEnd = i;
    }

    let repairedText = mapText;
    if (svgStart !== -1 && svgEnd !== -1) {
      const blocks = [];
      blocks.push(...lines.slice(0, svgStart));
      // Re-join the SVG lines with \n (so it doesn't get split by FMG's \r\n delimiter)
      blocks.push(lines.slice(svgStart, svgEnd + 1).join('\n'));
      blocks.push(...lines.slice(svgEnd + 1));
      
      // Now join the actual blocks with \r\n which FMG uses to split
      repairedText = blocks.join('\r\n');
    }

    const blob = new Blob([repairedText], { type: "text/plain" });

    if (this.win && this.win.uploadMap) {
      // Capture the old pack reference so we know when uploadMap has actually replaced it
      const oldPack = this.getGlobal('pack');

      this.win.uploadMap(blob, () => {
        // After loading the map, force the canvas to fill the responsive iframe
        if (this.win && this.win.fitMapToScreen) {
          this.win.fitMapToScreen();
        }
        
        // ISSUE 2 FIX: Constrain pan/zoom bounds so the user cannot drag the map off-screen.
        // We set D3's translateExtent to the map's internal coordinate bounds.
        if (this.win && this.win.zoom && this.win.graphWidth && this.win.graphHeight) {
          this.win.zoom.translateExtent([[0, 0], [this.win.graphWidth, this.win.graphHeight]]);
        }
      });

      // Poll until FMG completely replaces the internal pack object with the newly parsed map
      const start = Date.now();
      await new Promise<void>((resolve, reject) => {
        const checkPack = () => {
          const currentPack = this.getGlobal('pack');
          if (currentPack && currentPack !== oldPack && currentPack.states && currentPack.states.length > 0) {
            resolve();
          } else if (Date.now() - start > 15000) {
            reject(new Error("Azgaar FMG timed out while uploading the new map"));
          } else {
            setTimeout(checkPack, 100);
          }
        };
        checkPack();
      });
    } else {
      throw new Error("Azgaar uploadMap function not found");
    }
  }

  /**
   * Ensures the provinces layer is drawn visually on the SVG.
   */
  public drawProvinces() {
    if (this.win && typeof this.win.drawProvinces === 'function') {
      this.win.drawProvinces();
    }
  }

  /**
   * Replaces Azgaar's default state colors with colors from our database.
   */
  public applyNationColors(nations: { id: string; map_id: number; color: string | null; name: string }[]) {
    const pack = this.getGlobal('pack');
    const statesBody = this.getGlobal('statesBody');
    if (!pack || !statesBody) return;

    for (const dbNation of nations) {
      const azgaarId = dbNation.map_id;
      if (pack.states[azgaarId]) {
        const color = dbNation.color || '#cccccc'; // Default to a neutral color if unclaimed/null
        
        // Update internal state
        pack.states[azgaarId].color = color;
        // Optionally update name if we want the DB to override it
        pack.states[azgaarId].name = dbNation.name;
        
        // Update SVG visually
        statesBody.select("#state" + azgaarId).attr("fill", color);
      }
    }
  }

  /**
   * Hook into click events on the map.
   * Returns a cleanup function to remove the listener.
   */
  public onMapClick(callback: (type: 'state' | 'province' | 'other', id: number | null) => void): () => void {
    const map = this.iframe.contentDocument?.getElementById('map');
    if (!map) return () => {};

    const clickHandler = (e: MouseEvent) => {
      // Prevent Azgaar from handling the click (e.g. opening its own editors)
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as SVGElement;
      if (!target || !target.id) {
        callback('other', null);
        return;
      }

      const idStr = target.id;
      if (idStr.startsWith('state')) {
        const id = parseInt(idStr.replace('state', ''), 10);
        callback('state', id);
      } else if (idStr.startsWith('province')) {
        const id = parseInt(idStr.replace('province', ''), 10);
        callback('province', id);
      } else {
        callback('other', null);
      }
    };

    // Use capture phase to intercept before FMG's own handlers
    map.addEventListener('click', clickHandler, true);

    return () => {
      map.removeEventListener('click', clickHandler, true);
    };
  }
}
