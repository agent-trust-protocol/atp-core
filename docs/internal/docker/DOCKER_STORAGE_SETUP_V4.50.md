# Docker Desktop v4.50 - External Drive Configuration

## 🔍 **Issue: Disk Image Location Setting Not Visible**

In Docker Desktop v4.50.0, the "Disk image location" setting may not be visible in the Advanced settings. This is a known change in newer versions.

---

## ✅ **Solution: Use Symbolic Link Method**

Since the GUI setting isn't available, we'll use the symbolic link method to move Docker storage to your external drive.

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Check External Drive**

```bash
# Verify external drive is mounted
ls "/Volumes/My Passport for Mac"
```

Expected: You should see the contents of your external drive.

---

### **Step 2: Stop Docker Desktop**

1. **Quit Docker Desktop completely**:
   - Click Docker icon in menu bar
   - Select "Quit Docker Desktop"
   - OR run: `killall Docker`

2. **Verify Docker is stopped**:
   ```bash
   docker ps
   # Should show: "Cannot connect to the Docker daemon"
   ```

---

### **Step 3: Create Docker Data Folder on External Drive**

```bash
# Create the docker-data folder
mkdir -p "/Volumes/My Passport for Mac/docker-data"

# Verify it was created
ls -la "/Volumes/My Passport for Mac/docker-data"
```

---

### **Step 4: Move Existing Docker VM Data**

```bash
# Check current Docker VM location
ls -la ~/Library/Containers/com.docker.docker/Data/vms/

# Move the VM data to external drive
# This preserves all your existing images, containers, and volumes
mv ~/Library/Containers/com.docker.docker/Data/vms "/Volumes/My Passport for Mac/docker-data/vms"

# Verify the move
ls -la "/Volumes/My Passport for Mac/docker-data/vms"
```

**Note**: This may take a few minutes if you have large Docker images.

---

### **Step 5: Create Symbolic Link**

```bash
# Create symbolic link from default location to external drive
ln -s "/Volumes/My Passport for Mac/docker-data/vms" ~/Library/Containers/com.docker.docker/Data/vms

# Verify the link was created
ls -la ~/Library/Containers/com.docker.docker/Data/vms
# Should show: vms -> /Volumes/My Passport for Mac/docker-data/vms
```

---

### **Step 6: Restart Docker Desktop**

1. **Launch Docker Desktop** from Applications
2. **Wait for Docker to start** (may take 1-2 minutes)
3. **Verify Docker is working**:
   ```bash
   docker ps
   # Should show running containers or empty list (not an error)
   ```

---

### **Step 7: Verify Storage Location**

```bash
# Check Docker is using external drive
du -sh "/Volumes/My Passport for Mac/docker-data"

# Check symbolic link is working
ls -la ~/Library/Containers/com.docker.docker/Data/vms

# Check Docker info
docker info 2>/dev/null | grep -i "storage\|root"
```

---

## ✅ **Expected Results**

After completing these steps:
- ✅ Docker VM data stored on external drive: `/Volumes/My Passport for Mac/docker-data/vms`
- ✅ Symbolic link created: `~/Library/Containers/com.docker.docker/Data/vms` → external drive
- ✅ Docker Desktop starts normally
- ✅ All existing images, containers, and volumes preserved
- ✅ Internal drive space freed up

---

## ⚠️ **Important Notes**

### **1. External Drive Must Be Connected**
- Docker requires the external drive to be mounted
- If the drive is disconnected, Docker won't start
- **Solution**: Keep the external drive connected when using Docker

### **2. If External Drive Path Changes**
If macOS assigns a different mount point (e.g., `/Volumes/My Passport for Mac 1`):
```bash
# Remove old link
rm ~/Library/Containers/com.docker.docker/Data/vms

# Create new link with correct path
ln -s "/Volumes/My Passport for Mac 1/docker-data/vms" ~/Library/Containers/com.docker.docker/Data/vms
```

### **3. Performance**
- External USB drives may be slower than internal SSD
- For development, this is usually acceptable
- Build times may be slightly longer

---

## 🔄 **Alternative: Check Resources → General**

In some Docker Desktop v4.50 installations, the disk image location might be in:
- **Resources** → **General** tab (instead of Advanced)
- Look for "Disk image size" or "Disk image location" settings

If you find it there, you can use the GUI method instead.

---

## 📊 **Space Saved**

After moving Docker to external drive:
- **Before**: Docker using ~13.85 GB on internal drive (from your Docker Desktop status)
- **After**: Docker using space on external drive (1.6TB free)
- **Internal drive freed**: ~13-14 GB

---

## 🚀 **Next Steps**

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

### **Issue: "No such file or directory" when creating link**
- Ensure Docker Desktop is completely stopped
- Check the vms folder was moved successfully
- Verify external drive path is correct

### **Issue: Docker won't start after creating link**
- Check external drive is mounted: `ls "/Volumes/My Passport for Mac"`
- Verify link exists: `ls -la ~/Library/Containers/com.docker.docker/Data/vms`
- Check permissions: `ls -la "/Volumes/My Passport for Mac/docker-data"`
- Restart Docker Desktop

### **Issue: "Permission denied"**
- You may need to run some commands with `sudo`
- Check external drive permissions: `ls -la "/Volumes/My Passport for Mac"`

---

**Status**: Ready to configure using symbolic link method
**Docker Version**: v4.50.0
**Method**: Symbolic link (GUI setting not available)

