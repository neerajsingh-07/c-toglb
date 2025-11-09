# C# Unity Script to GLB Converter

A Node.js API that converts C# Unity scripts containing mesh data (vertices, normals, triangles) into GLB 3D model files.

## Features

- 🚀 **Upload C# Unity Scripts** - Upload your Unity C# scripts via API or web interface
- 🎨 **Extract Mesh Data** - Automatically parses Vector3 arrays for vertices, normals, and triangle indices
- 📦 **Generate GLB Files** - Converts mesh data to GLB (GLTF 2.0 binary) format
- 🌐 **Web Interface** - Beautiful, user-friendly web UI for easy conversion
- ⚡ **Pure Node.js** - No external dependencies, uses only built-in Node.js modules

## Installation

1. Clone the repository:
```bash
git clone https://github.com/neerajsingh-07/c-toglb.git
cd c-toglb
```

2. No dependencies needed! This project uses only Node.js built-in modules.

3. Start the server:
```bash
node server.js
```

The server will start on `http://localhost:3000`

## Deployment

To make the API accessible to others, deploy it to a cloud platform. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy Options:**
- **Railway** (Recommended) - https://railway.app - Just connect GitHub repo
- **Render** - https://render.com - Free tier available
- **Heroku** - https://heroku.com - Classic platform
- **Fly.io** - https://fly.io - Modern deployment platform

All deployment configuration files are included in this repository.

## Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Upload your `.cs` Unity script file
3. Click "Convert to GLB"
4. The GLB file will download automatically

### API Endpoints

#### POST `/api/upload`
Upload a C# Unity script and convert it to GLB format.

**Request:**
```json
{
  "script": "// Your C# Unity script content here..."
}
```

**Response:**
- Returns GLB file as binary download
- Content-Type: `model/gltf-binary`
- Filename: `model.glb`

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"script":"..."}' \
  --output model.glb
```

**Example using PowerShell:**
```powershell
$scriptContent = Get-Content "E_4.cs" -Raw
$body = @{ script = $scriptContent } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/upload" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -OutFile "model.glb"
```

#### GET `/api/script`
Get the entire C# script content with metadata.

#### GET `/api/script/metadata`
Get script metadata including file stats, class name, and using statements.

#### GET `/api/script/format`
Get formatted script structure with parsed information.

#### GET `/api/health`
Health check endpoint.

## Supported C# Unity Script Format

The converter expects Unity C# scripts with the following structure:

```csharp
using UnityEngine;
using UnityEditor;

public class Model_Script
{
    Vector3[] vertices = new Vector3[] {
        new Vector3(0f, 0f, 0f),
        new Vector3(1f, 0f, 0f),
        // ... more vertices
    };
    
    Vector3[] normals = new Vector3[] {
        new Vector3(0f, 1f, 0f),
        // ... more normals (optional)
    };
    
    int[] triangles = new int[] {
        0, 1, 2,
        3, 4, 5,
        // ... more triangle indices
    };
}
```

## How It Works

1. **Parse Script** - Extracts `Vector3[] vertices`, `Vector3[] normals`, and `int[] triangles` arrays from the C# script
2. **Convert to Binary** - Converts the mesh data to binary format (Float32Array for positions/normals, Uint16Array for indices)
3. **Generate GLB** - Creates a GLB file following the GLTF 2.0 specification with:
   - JSON header containing mesh structure
   - Binary buffer with vertex data, indices, and normals
4. **Download** - Returns the GLB file for download

## Project Structure

```
c-toglb/
├── server.js          # Main Node.js server
├── index.html         # Web interface
├── README.md          # This file
├── .gitignore         # Git ignore file
└── E_4.cs            # Example Unity script (optional)
```

## Requirements

- Node.js v12.0.0 or higher
- No external dependencies required

## API Response Format

### Success Response
- **Status Code:** 200
- **Content-Type:** `model/gltf-binary`
- **Body:** Binary GLB file

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Author

Created by [neerajsingh-07](https://github.com/neerajsingh-07)

## Acknowledgments

- Built with pure Node.js (no external dependencies)
- GLB format follows GLTF 2.0 specification
- Inspired by Unity's mesh generation capabilities

