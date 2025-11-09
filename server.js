const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SCRIPT_PATH = path.join(__dirname, 'E_4.cs');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Helper function to get file stats
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString()
    };
  } catch (error) {
    return null;
  }
}

// Helper function to read file in chunks
function readFileChunked(filePath, start = 0, end = null) {
  try {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const chunkEnd = end !== null ? Math.min(end, fileSize) : fileSize;
    const chunkSize = chunkEnd - start;
    
    const buffer = Buffer.alloc(chunkSize);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, chunkSize, start);
    fs.closeSync(fd);
    
    return buffer.toString('utf-8');
  } catch (error) {
    throw error;
  }
}

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

// Helper to send error response
function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { success: false, error: message });
}

// Helper to parse multipart form data
function parseMultipartFormData(body, boundary) {
  const parts = body.split('--' + boundary);
  const fields = {};
  
  for (let i = 1; i < parts.length - 1; i++) {
    const part = parts[i];
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    
    const headers = part.substring(0, headerEnd);
    const content = part.substring(headerEnd + 4);
    
    const nameMatch = headers.match(/name="([^"]+)"/);
    if (nameMatch) {
      const fieldName = nameMatch[1];
      // Remove trailing \r\n
      fields[fieldName] = content.replace(/\r\n$/, '');
    }
  }
  
  return fields;
}

// Parse C# Unity script to extract mesh data
function parseUnityScript(scriptContent) {
  const meshData = {
    vertices: [],
    normals: [],
    triangles: []
  };

  // Extract vertices array - handle multi-line arrays
  const verticesMatch = scriptContent.match(/Vector3\[\]\s+vertices\s*=\s*new\s+Vector3\[\]\s*\{([\s\S]*?)\}\s*;/);
  if (verticesMatch) {
    const verticesStr = verticesMatch[1];
    // Match all Vector3 constructors, including across line breaks
    const vertexPattern = /new\s+Vector3\s*\(\s*([-\d.]+)f?\s*,\s*([-\d.]+)f?\s*,\s*([-\d.]+)f?\s*\)/g;
    let match;
    while ((match = vertexPattern.exec(verticesStr)) !== null) {
      meshData.vertices.push([
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3])
      ]);
    }
  }

  // Extract normals array
  const normalsMatch = scriptContent.match(/Vector3\[\]\s+normals\s*=\s*new\s+Vector3\[\]\s*\{([\s\S]*?)\}\s*;/);
  if (normalsMatch) {
    const normalsStr = normalsMatch[1];
    const normalPattern = /new\s+Vector3\s*\(\s*([-\d.]+)f?\s*,\s*([-\d.]+)f?\s*,\s*([-\d.]+)f?\s*\)/g;
    let match;
    while ((match = normalPattern.exec(normalsStr)) !== null) {
      meshData.normals.push([
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3])
      ]);
    }
  }

  // Extract triangles array - handle multi-line arrays
  const trianglesMatch = scriptContent.match(/int\[\]\s+triangles\s*=\s*new\s+int\[\]\s*\{([\s\S]*?)\}\s*;/);
  if (trianglesMatch) {
    const trianglesStr = trianglesMatch[1];
    // Match all numbers in the array
    const numberPattern = /(\d+)/g;
    let match;
    while ((match = numberPattern.exec(trianglesStr)) !== null) {
      const index = parseInt(match[1]);
      if (!isNaN(index)) {
        meshData.triangles.push(index);
      }
    }
  }

  return meshData;
}

// Convert mesh data to GLB format
function createGLB(meshData) {
  if (meshData.vertices.length === 0 || meshData.triangles.length === 0) {
    throw new Error('Invalid mesh data: vertices or triangles missing');
  }

  // Prepare vertex data (positions)
  const positions = new Float32Array(meshData.vertices.length * 3);
  for (let i = 0; i < meshData.vertices.length; i++) {
    positions[i * 3] = meshData.vertices[i][0];
    positions[i * 3 + 1] = meshData.vertices[i][1];
    positions[i * 3 + 2] = meshData.vertices[i][2];
  }

  // Prepare normal data
  let normals = null;
  if (meshData.normals.length > 0 && meshData.normals.length === meshData.vertices.length) {
    normals = new Float32Array(meshData.normals.length * 3);
    for (let i = 0; i < meshData.normals.length; i++) {
      normals[i * 3] = meshData.normals[i][0];
      normals[i * 3 + 1] = meshData.normals[i][1];
      normals[i * 3 + 2] = meshData.normals[i][2];
    }
  }

  // Prepare indices (triangles)
  const indices = new Uint16Array(meshData.triangles.length);
  for (let i = 0; i < meshData.triangles.length; i++) {
    indices[i] = meshData.triangles[i];
  }

  // Combine binary data
  const positionBuffer = Buffer.from(positions.buffer);
  const indicesBuffer = Buffer.from(indices.buffer);
  
  let binaryBuffer = Buffer.concat([positionBuffer, indicesBuffer]);
  let normalOffset = positionBuffer.length;
  
  if (normals) {
    const normalBuffer = Buffer.from(normals.buffer);
    binaryBuffer = Buffer.concat([binaryBuffer, normalBuffer]);
  }

  // Create GLTF JSON
  const gltf = {
    asset: {
      version: "2.0",
      generator: "Unity Script to GLB Converter"
    },
    scene: 0,
    scenes: [{
      nodes: [0]
    }],
    nodes: [{
      mesh: 0
    }],
    meshes: [{
      primitives: [{
        attributes: {
          POSITION: 0
        },
        indices: 1
      }]
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: meshData.vertices.length,
        type: "VEC3",
        min: [
          Math.min(...meshData.vertices.map(v => v[0])),
          Math.min(...meshData.vertices.map(v => v[1])),
          Math.min(...meshData.vertices.map(v => v[2]))
        ],
        max: [
          Math.max(...meshData.vertices.map(v => v[0])),
          Math.max(...meshData.vertices.map(v => v[1])),
          Math.max(...meshData.vertices.map(v => v[2]))
        ]
      },
      {
        bufferView: 1,
        componentType: 5123, // UNSIGNED_SHORT
        count: meshData.triangles.length,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: positionBuffer.length
      },
      {
        buffer: 0,
        byteOffset: positionBuffer.length,
        byteLength: indicesBuffer.length
      }
    ],
    buffers: [{
      byteLength: binaryBuffer.length
    }]
  };

  // Add normals if available
  if (normals) {
    gltf.meshes[0].primitives[0].attributes.NORMAL = 2;
    gltf.accessors.push({
      bufferView: 2,
      componentType: 5126, // FLOAT
      count: meshData.normals.length,
      type: "VEC3"
    });
    gltf.bufferViews.push({
      buffer: 0,
      byteOffset: positionBuffer.length + indicesBuffer.length,
      byteLength: Buffer.from(normals.buffer).length
    });
  }

  // Create GLB file
  const jsonString = JSON.stringify(gltf);
  const jsonBuffer = Buffer.from(jsonString, 'utf8');
  
  // Pad JSON to 4-byte boundary
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJson = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding)]);
  
  // Pad binary to 4-byte boundary
  const binaryPadding = (4 - (binaryBuffer.length % 4)) % 4;
  const paddedBinary = Buffer.concat([binaryBuffer, Buffer.alloc(binaryPadding)]);
  
  // GLB Header (12 bytes)
  const glbHeader = Buffer.alloc(12);
  glbHeader.writeUInt32LE(0x46546C67, 0); // "glTF"
  glbHeader.writeUInt32LE(2, 4); // Version
  glbHeader.writeUInt32LE(12 + paddedJson.length + 8 + paddedBinary.length + 8, 8); // Total length
  
  // JSON Chunk Header (8 bytes)
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(paddedJson.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"
  
  // Binary Chunk Header (8 bytes)
  const binaryChunkHeader = Buffer.alloc(8);
  binaryChunkHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryChunkHeader.writeUInt32LE(0x004E4942, 4); // "BIN\0"
  
  // Combine all parts
  const glbFile = Buffer.concat([
    glbHeader,
    jsonChunkHeader,
    paddedJson,
    binaryChunkHeader,
    paddedBinary
  ]);
  
  return glbFile;
}

// Main server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  try {
    // Serve HTML page
    if (pathname === '/' || pathname === '/index.html') {
      try {
        const htmlPath = path.join(__dirname, 'index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
      } catch (error) {
        sendError(res, 500, 'Could not load HTML page');
      }
      return;
    }

    // Root endpoint
    if (pathname === '/api') {
      sendJSON(res, 200, {
        message: 'C# Script to GLB Converter API',
        endpoints: {
          'POST /api/upload': 'Upload C# Unity script and convert to GLB',
          'GET /api/script': 'Get the entire script',
          'GET /api/script/chunk': 'Get a chunk of the script (query params: start, end, chunkSize)',
          'GET /api/script/metadata': 'Get script metadata',
          'GET /api/script/format': 'Get formatted script structure',
          'GET /api/health': 'Health check'
        }
      });
      return;
    }

    // Upload and convert to GLB
    if (pathname === '/api/upload' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const contentType = req.headers['content-type'] || '';
          
          let scriptContent = '';
          
          if (contentType.includes('multipart/form-data')) {
            const boundary = contentType.split('boundary=')[1];
            const formData = parseMultipartFormData(body, boundary);
            scriptContent = formData.script || formData.file || '';
          } else if (contentType.includes('application/json')) {
            const jsonData = JSON.parse(body);
            scriptContent = jsonData.script || jsonData.content || '';
          } else {
            // Assume raw text
            scriptContent = body;
          }
          
          if (!scriptContent || scriptContent.trim().length === 0) {
            sendError(res, 400, 'No script content provided');
            return;
          }
          
          // Parse the Unity script
          const meshData = parseUnityScript(scriptContent);
          
          if (meshData.vertices.length === 0) {
            sendError(res, 400, 'Could not extract mesh data from script. Make sure it contains Vector3[] vertices array.');
            return;
          }
          
          // Create GLB file
          const glbBuffer = createGLB(meshData);
          
          // Send GLB file as download
          res.writeHead(200, {
            'Content-Type': 'model/gltf-binary',
            'Content-Disposition': 'attachment; filename="model.glb"',
            'Content-Length': glbBuffer.length
          });
          res.end(glbBuffer);
          
        } catch (error) {
          sendError(res, 500, `Error processing script: ${error.message}`);
        }
      });
      
      return;
    }

    // Health check
    if (pathname === '/api/health') {
      sendJSON(res, 200, {
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get entire script
    if (pathname === '/api/script') {
      try {
        const scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf-8');
        sendJSON(res, 200, {
          success: true,
          content: scriptContent,
          metadata: getFileStats(SCRIPT_PATH)
        });
      } catch (error) {
        sendError(res, 500, error.message);
      }
      return;
    }

    // Get script chunk
    if (pathname === '/api/script/chunk') {
      try {
        const query = parsedUrl.query;
        const start = parseInt(query.start) || 0;
        const end = parseInt(query.end) || null;
        const chunkSize = parseInt(query.chunkSize) || 100000;

        const stats = fs.statSync(SCRIPT_PATH);
        const fileSize = stats.size;
        const chunkEnd = end !== null ? Math.min(end, start + chunkSize) : Math.min(start + chunkSize, fileSize);
        
        const content = readFileChunked(SCRIPT_PATH, start, chunkEnd);
        
        sendJSON(res, 200, {
          success: true,
          content: content,
          start: start,
          end: chunkEnd,
          totalSize: fileSize,
          hasMore: chunkEnd < fileSize
        });
      } catch (error) {
        sendError(res, 500, error.message);
      }
      return;
    }

    // Get metadata
    if (pathname === '/api/script/metadata') {
      try {
        const stats = getFileStats(SCRIPT_PATH);
        if (!stats) {
          sendError(res, 404, 'Script file not found');
          return;
        }

        const content = readFileChunked(SCRIPT_PATH, 0, 5000);
        const lines = content.split('\n');

        const metadata = {
          ...stats,
          fileName: path.basename(SCRIPT_PATH),
          firstLines: lines.slice(0, 10),
          estimatedLines: Math.ceil(stats.size / 80)
        };

        // Extract class name
        const classMatch = content.match(/public\s+class\s+(\w+)/);
        if (classMatch) {
          metadata.className = classMatch[1];
        }

        // Extract using statements
        const usingStatements = lines
          .filter(line => line.trim().startsWith('using '))
          .map(line => line.trim());
        metadata.usingStatements = usingStatements;

        sendJSON(res, 200, {
          success: true,
          metadata: metadata
        });
      } catch (error) {
        sendError(res, 500, error.message);
      }
      return;
    }

    // Get formatted structure
    if (pathname === '/api/script/format') {
      try {
        const stats = getFileStats(SCRIPT_PATH);
        const content = readFileChunked(SCRIPT_PATH, 0, 10000);
        const lines = content.split('\n');

        const structure = {
          usingStatements: [],
          namespace: null,
          className: null,
          methods: [],
          variables: []
        };

        lines.forEach((line) => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('using ')) {
            structure.usingStatements.push(trimmed);
          } else if (trimmed.startsWith('namespace ')) {
            structure.namespace = trimmed.replace('namespace ', '').replace('{', '').trim();
          } else if (trimmed.match(/public\s+class\s+\w+/)) {
            const match = trimmed.match(/public\s+class\s+(\w+)/);
            if (match) structure.className = match[1];
          }
        });

        sendJSON(res, 200, {
          success: true,
          structure: structure,
          fileInfo: stats,
          preview: lines.slice(0, 50).join('\n')
        });
      } catch (error) {
        sendError(res, 500, error.message);
      }
      return;
    }

    // 404 for unknown routes
    sendError(res, 404, 'Endpoint not found');

  } catch (error) {
    sendError(res, 500, error.message);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`C# Script located at: ${SCRIPT_PATH}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST /api/upload - Upload C# script and convert to GLB');
  console.log('  GET /api/script - Get entire script');
  console.log('  GET /api/script/chunk - Get script chunk');
  console.log('  GET /api/script/metadata - Get metadata');
  console.log('  GET /api/script/format - Get formatted structure');
  console.log('  GET /api/health - Health check');
});
