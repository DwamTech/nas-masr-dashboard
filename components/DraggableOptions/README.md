# DraggableOptionsList Component

A fully accessible drag-and-drop list component for reordering options with comprehensive keyboard navigation and screen reader support.

## Features

### Core Functionality
- ✅ Drag-and-drop reordering using @dnd-kit/core and @dnd-kit/sortable
- ✅ Automatic rank calculation and sequential ordering
- ✅ Optimistic UI updates with rollback on failure
- ✅ Pinned item support (e.g., "غير ذلك" always stays at the end)

### Input Methods
- ✅ **Pointer/Mouse**: Click and drag with 5px activation distance
- ✅ **Touch**: Long press (150ms) with 8px tolerance for mobile devices
- ✅ **Keyboard**: Arrow keys for navigation with Space/Enter to pick up/drop

### Accessibility (WCAG 2.1 AA Compliant)
- ✅ ARIA live regions for screen reader announcements
- ✅ Proper ARIA labels and roles (list, listitem, button)
- ✅ Keyboard navigation instructions for screen readers
- ✅ Focus management and visible focus indicators
- ✅ Position announcements (e.g., "Item 1 of 5")
- ✅ Action announcements (e.g., "Moved to position 3", "Saving...", "Saved successfully")

### Visual Feedback
- ✅ Dragging state with reduced opacity
- ✅ Drop zone highlighting
- ✅ Drag overlay with rotation effect
- ✅ Saving state with loading indicator
- ✅ Smooth transitions and animations

## Usage

```tsx
import { DraggableOptionsList } from '@/components/DraggableOptions';

function MyComponent() {
  const [options, setOptions] = useState(['Option 1', 'Option 2', 'غير ذلك']);

  const handleReorder = (newOrder: string[]) => {
    setOptions(newOrder);
  };

  const handleSave = async (ranks: { option: string; rank: number }[]) => {
    // Save to backend
    await fetch('/api/save-ranks', {
      method: 'POST',
      body: JSON.stringify({ ranks }),
    });
  };

  const renderOption = (option: string) => (
    <div className="option-item">{option}</div>
  );

  return (
    <DraggableOptionsList
      options={options}
      onReorder={handleReorder}
      onSave={handleSave}
      renderOption={renderOption}
      otherOptionLabel="غير ذلك"
    />
  );
}
```

## Props

### `options: string[]` (required)
Array of option strings to display and reorder.

### `onReorder: (newOrder: string[]) => void` (required)
Callback fired when options are reordered. Receives the new order array.

### `onSave: (ranks: { option: string; rank: number }[]) => Promise<void>` (required)
Async callback for saving ranks to backend. Receives array of rank data.

### `renderOption: (option: string, dragHandleProps?: any) => React.ReactNode` (required)
Function to render each option. Receives the option string and optional drag handle props.

### `otherOptionLabel?: string` (optional, default: "غير ذلك")
Label for the pinned item that should always stay at the end.

### `disabled?: boolean` (optional, default: false)
If true, disables drag-and-drop and renders a static list.

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate between drag handles
- **Space/Enter**: Pick up or drop an item
- **Arrow Up/Down**: Move item up or down while dragging
- **Escape**: Cancel drag operation

### Screen Reader Support
The component announces:
- Item positions (e.g., "Option 1, item 1 of 5, draggable")
- Reorder actions (e.g., "Moved Option 1 to position 3")
- Save status (e.g., "Saving...", "Saved successfully", "Failed to save")
- Instructions for keyboard navigation

### ARIA Attributes
- `role="list"` on container
- `role="listitem"` on each option
- `role="button"` on drag handles
- `role="status"` on live region
- `aria-live="polite"` for announcements
- `aria-atomic="true"` for complete message reading
- `aria-label` with position info
- `aria-describedby` linking to instructions

## Visual States

### Normal State
```
☰ Option 1
☰ Option 2
🔒 غير ذلك
```

### Dragging State
```
☰ Option 1 (faded)
┄┄┄┄┄┄┄┄┄┄ (drop zone)
☰ Option 2
🔒 غير ذلك
```

### Saving State
```
[Overlay with "جاري الحفظ..." message]
```

## Styling

The component uses CSS classes from `styles.css`:
- `.models-list` - Container
- `.draggable-option` - Individual option wrapper
- `.drag-handle` - Drag handle icon
- `.dragging` - Applied during drag
- `.over` - Applied to drop zone
- `.disabled` - Applied to non-draggable items
- `.saving` - Applied during save operation
- `.sr-only` - Screen reader only content

## Requirements Validation

This component satisfies the following requirements from the spec:

- **4.15**: ✅ Integrates @dnd-kit/core and @dnd-kit/sortable
- **4.16**: ✅ Configures sensors for pointer, touch, and keyboard input
- **4.17**: ✅ Implements visual feedback during drag (dragging state, drop zones)
- **4.18**: ✅ Supports touch devices for mobile drag and drop
- **4.19**: ✅ Announces reordering changes to screen readers using ARIA live regions
- **4.20**: ✅ Provides drag handles next to each option except "غير ذلك"
- **4.22**: ✅ "غير ذلك" remains fixed at the bottom of the list
- **11.5**: ✅ Provides keyboard navigation support for accessibility
- **11.6**: ✅ Uses ARIA labels for screen reader compatibility

## Testing

The component has comprehensive test coverage including:
- Rendering tests
- Accessibility tests (ARIA attributes, keyboard navigation)
- "غير ذلك" handling tests
- Save functionality tests
- Visual feedback tests
- Touch support tests

Run tests with:
```bash
npm test -- DraggableOptionsList.test.tsx
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## Performance

- Uses GPU acceleration for smooth animations
- Optimistic updates for instant feedback
- Debounced drag events (16ms for 60fps)
- Minimal re-renders with React.memo on child components

## Known Limitations

1. The pinned item ("غير ذلك") cannot be dragged or reordered
2. Only supports vertical lists (horizontal not implemented)
3. Requires unique option strings (no duplicate values)
4. Maximum recommended items: 100 (for performance)

## Future Enhancements

- [ ] Horizontal list support
- [ ] Multi-select drag
- [ ] Undo/redo functionality
- [ ] Drag preview customization
- [ ] Virtual scrolling for large lists
