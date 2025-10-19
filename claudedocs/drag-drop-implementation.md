# Drag-and-Drop Task Reordering Implementation

## Overview
Implemented drag-and-drop functionality for task reordering within phases in the admin ProjectManager component.

## Changes Made

### 1. Backend API (server/src/routes/admin.js:370-417)
Added new endpoint for task reordering:
- **Route**: `PUT /api/admin/tasks/reorder/:phaseId`
- **Functionality**:
  - Accepts array of task IDs in desired order
  - Validates all tasks belong to the specified phase
  - Updates task_order for each task in a transaction
  - Returns updated task list

### 2. Frontend Library (client/)
Installed `@hello-pangea/dnd` package:
- Modern, actively maintained fork of react-beautiful-dnd
- Provides drag-and-drop functionality for React

### 3. API Utility (client/src/utils/api.js:124-128)
Added `reorderTasks` method to adminAPI:
```javascript
reorderTasks: (phaseId, taskIds) =>
  fetchAPI(`/api/admin/tasks/reorder/${phaseId}`, {
    method: 'PUT',
    body: JSON.stringify({ taskIds }),
  })
```

### 4. ProjectManager Component (client/src/components/admin/ProjectManager.jsx)
Enhanced with drag-and-drop functionality:

#### Imports
- Added DragDropContext, Droppable, Draggable from @hello-pangea/dnd

#### New Handler Function
```javascript
handleDragEnd(result, phaseId)
```
- Handles drag completion
- Optimistically updates UI
- Sends reorder request to backend
- Reloads project data on success/error

#### UI Changes
- **Admin View**:
  - Tasks wrapped in DragDropContext, Droppable, and Draggable components
  - Added drag handle icon (⋮⋮) for each task
  - Visual feedback during drag (scale, shadow, background color)
  - Smooth animations and transitions

- **Client View**:
  - No drag-and-drop (read-only)
  - Maintains original task list display

## Features

### Visual Feedback
- **Drag Handle**: Six-dot grip icon that changes color on hover
- **Dragging State**: Task scales up slightly with shadow effect
- **Drop Zone**: Background color changes when dragging over
- **Cursor**: Changes to grab/grabbing during interaction

### Behavior
- Tasks can only be reordered within the same phase
- Order numbers automatically update from 1 to N based on position
- Optimistic UI updates for smooth UX
- Error handling with automatic reload on failure

## Testing Instructions

1. **Access Admin Dashboard**
   - Frontend: http://localhost:5174
   - Login as admin

2. **Select a Client's Project**
   - Click on any client from the list
   - Expand a phase with multiple tasks

3. **Test Drag-and-Drop**
   - Look for the ⋮⋮ icon on the left of each task
   - Click and hold the icon
   - Drag the task up or down
   - Release to drop in new position
   - Verify task numbers (#1, #2, etc.) update automatically

4. **Verify Persistence**
   - Refresh the page
   - Check that task order is maintained
   - Verify in database that task_order values are updated

5. **Test Edge Cases**
   - Try dragging to top position
   - Try dragging to bottom position
   - Cancel drag by releasing outside droppable area
   - Test with phase containing single task (should not break)

## Database Impact
The `tasks` table `task_order` column is automatically updated when tasks are reordered:
- Values are recalculated from 1 to N based on new position
- Transaction ensures atomic updates
- No orphaned or duplicate order numbers

## User Benefits
- **Admin Flexibility**: Easily reorganize tasks without manual editing
- **Visual Clarity**: Drag handle makes interaction obvious
- **Immediate Feedback**: See changes instantly
- **Error Recovery**: Automatic reload on failure ensures consistency

## Technical Notes
- Uses @hello-pangea/dnd (maintained fork of react-beautiful-dnd)
- Optimistic updates for better UX
- Transaction-based backend updates for data consistency
- Separate views for admin (editable) vs client (read-only)
- Fully integrated with existing status management and CRUD operations
