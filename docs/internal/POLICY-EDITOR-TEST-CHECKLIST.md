# ATP Policy Editor Testing & Improvement Guide

## 🎯 Quick Access
- **Policy Editor**: http://localhost:3030/policy-editor
- **Dashboard**: http://localhost:3030/dashboard
- **API Docs**: http://localhost:3008

## 📋 Manual Testing Checklist

### 1. Basic Functionality Tests
- [ ] **Navigate to Policy Editor**
  - Go to http://localhost:3030/policy-editor
  - Verify the visual editor loads with node palette on left

- [ ] **Add Nodes**
  - Click "DID Verification" → Verify blue node appears
  - Click "Trust Level" → Verify green node appears  
  - Click "Allow" action → Verify action node appears
  - Click "AND" operator → Verify operator node appears

- [ ] **Connect Nodes**
  - Drag from output handle of condition node to input of action node
  - Verify connection line appears
  - Try invalid connection (action to action) → Should fail

- [ ] **Configure Nodes**
  - Double-click a condition node
  - Fill in parameters (e.g., DID pattern, trust level threshold)
  - Save configuration

- [ ] **Delete Operations**
  - Select a node and press Delete key
  - Select an edge and press Delete key
  - Use Clear button to remove all

### 2. Policy Management Tests
- [ ] **Create Policy**
  - Enter policy name: "Test Access Policy"
  - Add description: "Controls API access based on trust"
  - Add nodes: DID Verification → AND → Trust Level → Allow
  - Connect all nodes in sequence

- [ ] **Validate Policy**
  - Click "Validate" button
  - Check for validation errors/warnings
  - Fix any issues highlighted

- [ ] **Save Policy**
  - Click "Save" button
  - Check for success notification
  - Verify policy appears in list (if applicable)

- [ ] **Export Policy**
  - Click "Export Policy" button
  - Verify JSON file downloads
  - Open file and check structure

### 3. Advanced Features
- [ ] **Policy Simulation**
  - Click "Simulate" button
  - Enter test data (agent DID, trust score)
  - Run simulation
  - Verify correct path highlighting

- [ ] **Version Control**
  - Make changes to existing policy
  - Save as new version
  - Check version history

- [ ] **Import Policy**
  - Click "Load" button
  - Upload previously exported JSON
  - Verify nodes recreated correctly

### 4. Edge Cases & Error Handling
- [ ] **Empty Policy**
  - Try saving without any nodes → Should show error
  - Try validating empty canvas → Should show warning

- [ ] **Circular Dependencies**
  - Create node A → node B → node A loop
  - Validate → Should detect circular reference

- [ ] **Large Policy**
  - Add 20+ nodes with complex connections
  - Check performance (smooth panning/zooming)
  - Verify save/load still works

- [ ] **Network Errors**
  - Disconnect internet/stop API service
  - Try saving → Should show appropriate error
  - Should not lose work

### 5. User Experience Tests
- [ ] **Keyboard Shortcuts**
  - Ctrl+Z for undo
  - Ctrl+Y for redo
  - Delete key for removing selected items
  - Ctrl+S for save (if implemented)

- [ ] **Visual Feedback**
  - Hover over nodes → Should show tooltips
  - Invalid connections → Should show red indicator
  - Valid connections → Should show green indicator

- [ ] **Responsive Design**
  - Resize browser window
  - Check mobile view (if applicable)
  - Verify controls remain accessible

## 🔧 Testing Scenarios

### Scenario 1: API Rate Limiting Policy
1. Create condition: "Tool Type = API"
2. Add condition: "Request Rate > 100/min"
3. Connect with AND operator
4. Add action: "Throttle (50%)"
5. Validate and save

### Scenario 2: Enterprise Access Policy
1. Add condition: "Organization = AcmeCorp"
2. Add condition: "Trust Level >= 0.8"
3. Connect with AND operator
4. Add condition: "Valid Credentials"
5. Connect all to "Allow" action
6. Test with simulation

### Scenario 3: Time-Based Access
1. Add condition: "Time Between 9AM-5PM"
2. Add condition: "Weekday = Mon-Fri"
3. Connect with AND operator
4. Add "Allow" action for true path
5. Add "Deny" action for false path

## 🐛 Common Issues to Check

1. **Performance Issues**
   - Lag when dragging nodes?
   - Slow to load large policies?
   - Memory leaks after extended use?

2. **Data Integrity**
   - Are node positions saved correctly?
   - Do parameters persist after reload?
   - Are connections maintained properly?

3. **Validation Accuracy**
   - Does it catch disconnected nodes?
   - Does it identify invalid parameters?
   - Are error messages helpful?

4. **Cross-Browser Compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Check for console errors
   - Verify drag-and-drop works

## 💡 Improvement Ideas to Consider

### High Priority
1. **Auto-save**: Save draft every 30 seconds
2. **Undo/Redo**: Full history with keyboard shortcuts
3. **Node Search**: Quick find for specific node types
4. **Templates**: Pre-built common policy patterns
5. **Better Error Messages**: Specific, actionable feedback

### Medium Priority
1. **Mini-map**: Navigation aid for large policies
2. **Alignment Tools**: Snap to grid, distribute evenly
3. **Node Groups**: Collapse/expand complex sections
4. **Comments**: Add notes to nodes/edges
5. **Export Options**: YAML, PDF documentation

### Nice to Have
1. **Dark Mode**: Theme toggle
2. **Collaboration**: Real-time multi-user editing
3. **AI Suggestions**: Recommend next node based on pattern
4. **Policy Library**: Share/import community policies
5. **Analytics**: Show policy usage statistics

## 📊 Performance Metrics to Track

- **Load Time**: < 2 seconds
- **Node Addition**: < 100ms
- **Connection Creation**: < 50ms
- **Save Operation**: < 1 second
- **Export Generation**: < 500ms
- **Memory Usage**: < 100MB for typical policy
- **Frame Rate**: > 30 FPS during drag operations

## 🎨 UI/UX Improvements

1. **Visual Hierarchy**
   - Make primary actions more prominent
   - Group related controls
   - Use consistent icon language

2. **Feedback & Confirmation**
   - Show loading states
   - Confirm destructive actions
   - Provide success notifications

3. **Accessibility**
   - Keyboard navigation for all features
   - Screen reader support
   - High contrast mode option

4. **Onboarding**
   - Interactive tutorial for first-time users
   - Contextual help tooltips
   - Example policies to start from

## 📝 Testing Notes Section

Use this space to record your observations:

```
Date: _____________
Tester: ___________

Issues Found:
1. 
2. 
3. 

Suggestions:
1. 
2. 
3. 

Performance Notes:


User Experience Notes:


```

---

## 🚀 Next Steps

After testing, prioritize improvements based on:
1. **Critical Bugs** - Fix immediately
2. **Usability Issues** - Address in next sprint
3. **Performance** - Optimize if metrics exceed thresholds
4. **New Features** - Plan for future releases

Remember: The goal is to make policy creation intuitive, efficient, and error-free!