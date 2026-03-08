# Docker Storage Configuration

## Current Setup Analysis

### Storage Locations
- **Internal Drive** (`/System/Volumes/Data`): 460GB total, **74GB free (83% used)**
- **External Drive** (`/Volumes/My Passport for Mac`): 1.8TB total, **1.6TB free (12% used)**

### Docker Storage
- **Docker Desktop Location**: `~/Library/Containers/com.docker.docker/` (~124MB)
- **Docker Data Location**: Currently on **internal drive** (default)
- **Project Location**: `/Volumes/My Passport for Mac/agent-trust-protocol-1/` ✅ (already on external)

## Recommendation: Move Docker to External Drive

Since you're running low on internal drive space (only 74GB free), it's recommended to move Docker's disk image to your external drive.

### Steps to Move Docker Storage to External Drive:

1. **Open Docker Desktop**
   - Click the Docker icon in menu bar
   - Select "Settings" or "Preferences"

2. **Navigate to Resources**
   - Click on "Resources" in the left sidebar
   - Then click on "Advanced" or "Disk image location"

3. **Change Disk Image Location**
   - Current location: `~/Library/Containers/com.docker.docker/Data/vms/0/data`
   - New location: `/Volumes/My Passport for Mac/docker-data`
   
4. **Steps**:
   ```
   a. Click "Browse" next to "Disk image location"
   b. Navigate to: /Volumes/My Passport for Mac/
   c. Create new folder: "docker-data"
   d. Select it and click "Select"
   e. Click "Apply & Restart"
   ```

5. **Docker will restart** and move the disk image (may take 5-10 minutes)

### Alternative: Use CLI to Check Current Settings

```bash
# Check Docker Desktop settings
cat ~/Library/Group\ Containers/group.com.docker/settings.json | grep -i disk

# Check actual disk image size
du -sh ~/Library/Containers/com.docker.docker/Data/vms/
```

## Current Build Status

The Docker build was interrupted. Once Docker storage is configured on your external drive (if desired), you can continue with:

```bash
cd /Users/jacklu/agent-trust-protocol-1
docker-compose -f docker-compose.website.yml build website
```

The build context is now optimized (down to ~79KB from 1GB) thanks to the improved `.dockerignore` file.

## Space Requirements

- **Build artifacts**: ~2-5GB (temporary, deleted after build)
- **Final image size**: ~500MB-1GB
- **Running containers**: ~100-500MB additional
- **Logs and data**: ~100MB-1GB over time

**Total estimated**: 3-8GB needed for this project

## Notes

- Your project files are already on the external drive ✅
- Only Docker's disk image and build cache are on internal drive
- Moving Docker to external drive is optional but recommended given your space constraints
- The build will work either way, but you'll have more space if Docker is on the external drive

