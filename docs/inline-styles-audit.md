# Inline Styles Audit - Add Model Form

## Summary

This document lists all inline styles found in the add-model form that should be extracted to CSS classes.

## HTML File: `/src/www/add-model/index.html`

### 1. **Small Helper Text** (8 occurrences)
```html
<small style="color: #6b7280; font-size: 0.8em;">...</small>
```
**Lines:** 25, 46, 55, 74, 135, 149  
**Recommendation:** Create `.helper-text` class

### 2. **Flex Container with Gap** (4 occurrences)
```html
<div style="display:flex; gap:16px;">
<div style="display:flex; gap:0.5rem;">
```
**Lines:** 33, 85, 102, 118  
**Recommendation:** Create `.flex-row` and `.flex-row-tight` classes

### 3. **Flex Item (flex:1)** (5 occurrences)
```html
<div class="form-group" style="flex:1;">
<div class="form-group" style="flex: 1 0 auto">
<input ... style="flex:1;">
```
**Lines:** 44, 86, 91, 103, 119, 123  
**Recommendation:** Create `.flex-1` class

### 4. **Phone Prefix Select**
```html
<select ... style="width:100px; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px; background:white;">
```
**Line:** 34  
**Recommendation:** Create `.select-narrow` class

### 5. **Textarea (Description)**
```html
<textarea ... style="width:100%; padding:14px 16px; font-size:16px; color:var(--android-text-primary); background-color:var(--input-bg); border:none; border-bottom:1px solid #8e918f; border-radius:4px 4px 0 0; box-sizing:border-box; font-family:inherit;">
```
**Line:** 82  
**Recommendation:** Already uses standard input styles, could be simplified

### 6. **Form Group Label (Flex Header)**
```html
<label style="display:flex; justify-content:space-between; align-items:center;">
```
**Lines:** 153, 186  
**Recommendation:** Create `.form-group-header` class

### 7. **Social Handles Container**
```html
<div id="social-handles-container" style="display:flex; flex-direction:column; gap:0.75rem;">
```
**Lines:** 157, 190  
**Recommendation:** Create `.dynamic-rows-container` class

### 8. **Social Handle Row**
```html
<div style="display:flex; align-items:center; gap:0.5rem;">
```
**Lines:** 159, 171  
**Recommendation:** Create `.input-row` class

### 9. **Social Platform Label**
```html
<span style="width:100px; color:#6b7280; font-size:0.9em;">Instagram</span>
```
**Lines:** 160, 172  
**Recommendation:** Create `.input-label-inline` class

### 10. **@ Symbol**
```html
<span style="color: #6b7280; font-size: 1em;">@</span>
```
**Lines:** 161, 173  
**Recommendation:** Create `.input-prefix` class

### 11. **Auxiliary Inputs** (3 occurrences)
```html
<input ... style="flex:1; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px;">
```
**Lines:** 168, 180, 197  
**Recommendation:** ✅ **DONE** - Use `.input-aux` class

---

## JavaScript File: `/src/www/add-model/script.js`

### 1. **Dynamic Row Container** (2 occurrences)
```javascript
row.style.cssText = 'display:flex; align-items:center; gap:0.5rem;';
```
**Lines:** 198, 262  
**Recommendation:** Create `.input-row` class (same as HTML)

### 2. **Platform Input (narrow)**
```javascript
platformInput.style.cssText = 'width:120px; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px;';
```
**Line:** 204  
**Recommendation:** Create `.input-narrow` class

### 3. **Handle Input (flex)** (2 occurrences)
```javascript
handleInput.style.cssText = 'flex:1; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px;';
input.style.cssText = 'flex:1; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px;';
```
**Lines:** 210, 267  
**Recommendation:** ✅ **DONE** - Use `.input-aux` class

---

## Recommended CSS Classes to Create

### Priority 1 - High Usage (Create First)

1. **`.helper-text`** - Small gray helper text (8 uses)
   ```css
   .helper-text {
       color: #6b7280;
       font-size: 0.8em;
   }
   ```

2. **`.flex-row`** - Flex container with gap (4 uses)
   ```css
   .flex-row {
       display: flex;
       gap: 16px;
   }
   ```

3. **`.flex-1`** - Flex item that grows (5 uses)
   ```css
   .flex-1 {
       flex: 1;
   }
   ```

4. **`.input-row`** - Input row with tight gap (4 uses - HTML + JS)
   ```css
   .input-row {
       display: flex;
       align-items: center;
       gap: 0.5rem;
   }
   ```

### Priority 2 - Medium Usage

5. **`.form-group-header`** - Label with space-between (2 uses)
   ```css
   .form-group-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
   }
   ```

6. **`.dynamic-rows-container`** - Vertical flex container (2 uses)
   ```css
   .dynamic-rows-container {
       display: flex;
       flex-direction: column;
       gap: 0.75rem;
   }
   ```

7. **`.input-label-inline`** - Inline label for inputs (2 uses)
   ```css
   .input-label-inline {
       width: 100px;
       color: #6b7280;
       font-size: 0.9em;
   }
   ```

8. **`.input-prefix`** - Prefix symbol (@ etc.) (2 uses)
   ```css
   .input-prefix {
       color: #6b7280;
       font-size: 1em;
   }
   ```

9. **`.input-narrow`** - Narrow input field (1 use in JS)
   ```css
   .input-narrow {
       width: 120px;
       padding: 0.5rem;
       border: 1px solid #d1d5db;
       border-radius: 6px;
   }
   ```

### Priority 3 - Single Use

10. **`.select-narrow`** - Narrow select dropdown (1 use)
    ```css
    .select-narrow {
        width: 100px;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
    }
    ```

---

## Already Completed ✅

- **`.cta-icon-button`** - Red × remove buttons
- **`.cta-text-small`** - Red "Add" text links
- **`.input-aux`** - Auxiliary input fields (flex:1 with standard styling)

---

## Total Inline Styles Count

- **HTML:** 31 inline style attributes
- **JavaScript:** 5 inline style.cssText assignments
- **Total:** 36 inline styles to refactor

---

## Implementation Plan

### Phase 1 - High Impact (Recommended)
1. Create `.helper-text` class (removes 8 inline styles)
2. Create `.flex-row` class (removes 4 inline styles)
3. Create `.flex-1` class (removes 5 inline styles)
4. Create `.input-row` class (removes 4 inline styles)
5. Update HTML and JS to use `.input-aux` (removes 3 inline styles)

**Phase 1 Total:** 24 inline styles removed (67% reduction)

### Phase 2 - Medium Impact
6. Create `.form-group-header` class (removes 2 inline styles)
7. Create `.dynamic-rows-container` class (removes 2 inline styles)
8. Create `.input-label-inline` class (removes 2 inline styles)
9. Create `.input-prefix` class (removes 2 inline styles)
10. Create `.input-narrow` class (removes 1 inline style)

**Phase 2 Total:** 9 inline styles removed

### Phase 3 - Low Impact
11. Create `.select-narrow` class (removes 1 inline style)
12. Simplify textarea styles (removes 1 inline style)

**Phase 3 Total:** 2 inline styles removed

---

## Benefits of Refactoring

1. **Maintainability**: Change styles in one place
2. **Consistency**: Ensure all similar elements look the same
3. **Performance**: Slightly faster rendering (browser can cache classes)
4. **Readability**: Cleaner HTML/JS code
5. **Reusability**: Use classes across different pages
6. **Theming**: Easier to implement dark mode or themes
7. **Best Practices**: Separation of concerns (structure vs presentation)

---

## Notes

- Some inline styles in `<div>` containers could be replaced with utility classes
- The textarea has complex styling that matches the standard input pattern - could potentially reuse existing styles
- Consider creating a utility class system (like Tailwind) for common patterns like `flex`, `gap`, etc.
- JavaScript-generated styles should definitely be moved to CSS classes for better maintainability
