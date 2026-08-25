import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    // Decode URI component because spaces become %20
    const decodedName = decodeURIComponent(name);
    // The map name should not include directory traversal
    const safeName = path.basename(decodedName);
    
    console.log("================ API ROUTE TRIGGERED ================");
    console.log("1. Raw requested name param:", name);
    
    // The filename might have spaces or URL encoding
    const filename = decodeURIComponent(name) + ".map";
    console.log("2. Decoded filename to look for:", filename);
    
    // We store uploaded maps locally in "sample maps" directory 
    // for this demo implementation
    const mapPath = path.join(process.cwd(), "sample maps", filename);
    console.log("3. Full absolute path resolved to:", mapPath);
    
    const fsSync = require('fs');
    const fileExists = fsSync.existsSync(mapPath);
    console.log("4. Does file exist at this path?:", fileExists);
    
    if (fileExists) {
      const stats = fsSync.statSync(mapPath);
      console.log("5. File size (bytes):", stats.size);
    } else {
      console.log("5. File size (bytes): N/A (File not found)");
    }
    
    const fileText = await fs.readFile(mapPath, "utf-8");
    console.log("6. File read successfully, length:", fileText.length);
    console.log("===================================================");
    
    return new NextResponse(fileText, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Failed to read map file:", error);
    return new NextResponse("Map file not found", { status: 404 });
  }
}
