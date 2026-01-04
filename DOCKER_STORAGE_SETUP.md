# Docker Storage Setup - External Hard Drive Configuration

## 🎯 **Goal**
Move Docker's disk image and data to external drive to free up internal drive space.

---

## 📍 **Current Situation**

- **Internal Drive**: 74GB free (83% used) ⚠️
- **External Drive**: `/Volumes/My Passport for Mac` - 1.6TB free (12% used) ✅
- **Project Location**: Already on external drive ✅
- **Docker Storage**: Currently on internal drive (default location)

---

## 🔧 **Step-by-Step: Configure Docker for External Drive**

### **Method 1: Docker Desktop GUI (Recommended)**

1. **Open Docker Desktop**
   - Click Docker icon in macOS menu bar
   - Select "Settings" (gear icon)

2. **Navigate to Resources → Advanced**
   - Click "Resources" in left sidebar
   - Click "Advanced" tab
   - Look for "Disk image location" section

3. **Change Disk Image Location**
   ```
   Current: ~/Library/Containers/com.docker.docker/Data/vms/0/data
   New:     /Volumes/My Passport for Mac/docker-data
   ```

4. **Steps**:
   - Click "Browse" or "Change" next to "Disk image location"
   - Navigate to: `/Volumes/My Passport for Mac/`
   - Create new folder: `docker-data` (if it doesn't exist)
   - Select the `docker-data` folder
   - Click "Apply & Restart"

5. **Wait for Migration**
   - Docker will restart
   - Disk image will be moved (may take 5-10 minutes depending on size)
   - ⚠️ **Do not interrupt this process**

---

### **Method 2: Using Docker CLI (Alternative)**

If GUI method doesn't work, you can use symbolic links:

```bash
# 1. Stop Docker Desktop completely
# (Quit from menu bar or: killall Docker)

# 2. Create docker-data folder on external drive
mkdir -p "/Volumes/My Passport for Mac/docker-data"

# 3. Move existing Docker data (if any)
# This will preserve your existing images/containers
mv ~/Library/Containers/com.docker.docker/Data/vms "/Volumes/My Passport for Mac/docker-data/vms"

# 4. Create symbolic link
ln -s "/Volumes/My Passport for Mac/docker-data/vms" ~/Library/Containers/com.docker.docker/Data/vms

# 5. Restart Docker Desktop
```

---

## ✅ **Verification**

After configuration, verify Docker is using external drive:

```bash
# Check Docker disk image location
docker info | grep -i "docker root dir"

# Check actual disk usage
du -sh "/Volumes/My Passport for Mac/docker-data" 2>/dev/null || echo "Not found on external drive"

# Check Docker Desktop settings
cat ~/Library/Group\ Containers/group.com.docker/settings.json | grep -i disk
```

---

## 📊 **Expected Results**

After moving Docker to external drive:
- ✅ Docker images stored on external drive
- ✅ Docker volumes stored on external drive
- ✅ Build cache stored on external drive
- ✅ Internal drive space freed up (~5-10GB typically)

---

## ⚠️ **Important Notes**

1. **External Drive Must Be Connected**
   - Docker requires the external drive to be mounted
   - If drive is disconnected, Docker won't start
   - Consider using a different drive or keeping it always connected

2. **Performance Considerations**
   - External USB drives may be slower than internal SSD
   - For development, this is usually acceptable
   - For production, consider faster external drives (Thunderbolt/USB-C)

3. **Backup**
   - Docker data on external drive should be backed up separately
   - Consider syncing `docker-data` folder to cloud storage

---

## 🚀 **After Configuration**

Once Docker is configured on external drive:

```bash
# Navigate to project
cd /Users/jacklu/agent-trust-protocol-1

# Test Docker is working
docker ps

# Build the website
docker-compose -f docker-compose.website.yml build website

# Start services
docker-compose -f docker-compose.website.yml up -d
```

---

## 📝 **Troubleshooting**

### **Issue: Docker won't start after move**
- Check external drive is mounted: `ls "/Volumes/My Passport for Mac"`
- Check permissions: `ls -la "/Volumes/My Passport for Mac/docker-data"`
- Restart Docker Desktop

### **Issue: Can't find disk image location setting**
- Update Docker Desktop to latest version
- Settings location may vary by Docker Desktop version
- Check Docker Desktop documentation for your version

### **Issue: Migration fails**
- Ensure external drive has enough space (need at least 20GB free)
- Check external drive is formatted correctly (APFS or HFS+)
- Try Method 2 (symbolic links) instead

---

**Status**: Ready to configure
**Next**: Follow Method 1 steps above, then test Docker build

