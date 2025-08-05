// Persistent sticky notes system with dark mode styling
import DebugSystem from '../debug/DebugSystem.js';

export class StickyNote {
    static notes = new Map();
    static nextId = 1;
    
    constructor(options = {}) {
        this.id = options.id || StickyNote.nextId++;
        this.x = options.x || 100;
        this.y = options.y || 100;
        this.width = options.width || 250;
        this.height = options.height || 150;
        this.text = options.text || '';
        this.created = options.created || Date.now();
        
        this.element = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.create();
        StickyNote.notes.set(this.id, this);
        
        // Register with debug system
        DebugSystem.registerDebugElement(`stickyNote_${this.id}`, this.element, {
            category: 'sticky-notes',
            description: `Sticky note ${this.id}`
        });
    }
    
    create() {
        // Main note container
        this.element = document.createElement('div');
        this.element.className = 'sticky-note';
        this.element.style.cssText = `
            position: fixed;
            left: ${this.x}px;
            top: ${this.y}px;
            width: ${this.width}px;
            height: ${this.height}px;
            background: #3a3a3a;
            border: 1px solid #555;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            color: #e0e0e0;
            resize: none;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        // Drag handle area at the top
        const dragHandle = document.createElement('div');
        dragHandle.className = 'sticky-note-drag-handle';
        dragHandle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 20px;
            cursor: move;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        // Drag dots indicator
        const dragDots = document.createElement('div');
        dragDots.style.cssText = `
            width: 20px;
            height: 4px;
            background: repeating-linear-gradient(
                to right,
                #666 0px,
                #666 2px,
                transparent 2px,
                transparent 4px
            );
            border-radius: 2px;
        `;
        dragHandle.appendChild(dragDots);
        
        // Show handle on note hover
        this.element.addEventListener('mouseenter', () => {
            dragHandle.style.opacity = '0.6';
        });
        
        this.element.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                dragHandle.style.opacity = '0';
            }
        });
        
        // Close button (floating in top-right corner)
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 2px;
            right: 4px;
            background: rgba(0, 0, 0, 0.6);
            border: none;
            color: #999;
            font-size: 14px;
            cursor: pointer;
            padding: 0;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            transition: all 0.1s ease;
            z-index: 3;
            opacity: 0.7;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#ff4444';
            closeBtn.style.color = '#fff';
            closeBtn.style.opacity = '1';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.6)';
            closeBtn.style.color = '#999';
            closeBtn.style.opacity = '0.7';
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.delete();
        });
        
        // Text area
        const textArea = document.createElement('textarea');
        this.textArea = textArea;
        textArea.className = 'sticky-note-text';
        textArea.style.cssText = `
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
            padding: 22px 30px 12px 12px;
            color: #e0e0e0;
            font-family: inherit;
            font-size: inherit;
            resize: none;
            outline: none;
            line-height: 1.4;
            box-sizing: border-box;
            border-radius: 8px;
        `;
        
        textArea.placeholder = 'Type your note here...';
        textArea.value = this.text;
        
        // Resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'sticky-note-resize';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 15px;
            height: 15px;
            cursor: se-resize;
            background: linear-gradient(-45deg, transparent 30%, #666 30%, #666 40%, transparent 40%, transparent 60%, #666 60%, #666 70%, transparent 70%);
            border-radius: 0 0 8px 0;
            z-index: 1;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        `;
        
        // Hover effect for resize handle
        resizeHandle.addEventListener('mouseenter', () => {
            resizeHandle.style.opacity = '1';
        });
        
        resizeHandle.addEventListener('mouseleave', () => {
            if (!this.isResizing) {
                resizeHandle.style.opacity = '0.7';
            }
        });
        
        // Assemble the note
        this.element.appendChild(textArea);
        this.element.appendChild(dragHandle);
        this.element.appendChild(closeBtn);
        this.element.appendChild(resizeHandle);
        
        // Add to document
        document.body.appendChild(this.element);
        
        // Set up event listeners
        this.setupEventListeners(textArea, dragHandle, resizeHandle);
        
        // Focus on text area
        textArea.focus();
    }
    
    setupEventListeners(textArea, dragHandle, resizeHandle) {
        // Dragging - specifically on drag handle
        dragHandle.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.x;
            this.dragOffset.y = e.clientY - this.y;
            this.element.style.zIndex = '10000';
            dragHandle.style.opacity = '1';
            document.body.style.cursor = 'move';
            document.addEventListener('mousemove', this.handleDrag);
            document.addEventListener('mouseup', this.handleDragEnd);
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Resizing
        resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.initialMouseX = e.clientX;
            this.initialMouseY = e.clientY;
            this.initialWidth = this.width;
            this.initialHeight = this.height;
            document.body.style.cursor = 'se-resize';
            document.addEventListener('mousemove', this.handleResize);
            document.addEventListener('mouseup', this.handleResizeEnd);
            // Don't stop propagation on mousedown for resize handle
            e.preventDefault();
        });
        
        // Text saving
        textArea.addEventListener('input', () => {
            this.text = textArea.value;
            this.save();
        });
        
        // Prevent keyboard events from propagating to the game
        textArea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        
        textArea.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });
        
        textArea.addEventListener('keypress', (e) => {
            e.stopPropagation();
        });
        
        // Focus management and prevent game interaction
        this.element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.element.style.zIndex = '10000';
            // Lower z-index of other notes
            StickyNote.notes.forEach((note, id) => {
                if (id !== this.id) {
                    note.element.style.zIndex = '9999';
                    // Blur other notes' text areas
                    if (note.textArea) {
                        note.textArea.blur();
                    }
                }
            });
        });
        
        // Global click handler to blur text area when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (!this.element.contains(e.target)) {
                if (this.textArea) {
                    this.textArea.blur();
                }
            }
        });
        
        // Prevent all mouse events from reaching the game (except during drag/resize)
        this.element.addEventListener('click', (e) => e.stopPropagation());
        this.element.addEventListener('mouseup', (e) => {
            // Allow mouseup to propagate during resize or drag so it can reach the document listener
            if (!this.isResizing && !this.isDragging) {
                e.stopPropagation();
            }
        });
        this.element.addEventListener('mousemove', (e) => {
            // Allow mousemove to propagate during resize or drag
            if (!this.isResizing && !this.isDragging) {
                e.stopPropagation();
            }
        });
    }
    
    handleDrag = (e) => {
        if (!this.isDragging) return;
        
        this.x = e.clientX - this.dragOffset.x;
        this.y = e.clientY - this.dragOffset.y;
        
        // Keep within viewport
        this.x = Math.max(0, Math.min(window.innerWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(window.innerHeight - this.height, this.y));
        
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    };
    
    handleDragEnd = () => {
        this.isDragging = false;
        document.body.style.cursor = '';
        
        // Hide drag handle unless hovering
        const dragHandle = this.element.querySelector('.sticky-note-drag-handle');
        if (dragHandle && !this.element.matches(':hover')) {
            dragHandle.style.opacity = '0';
        }
        
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        this.save();
    };
    
    handleResize = (e) => {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.initialMouseX;
        const deltaY = e.clientY - this.initialMouseY;
        
        this.width = Math.max(220, this.initialWidth + deltaX);
        this.height = Math.max(140, this.initialHeight + deltaY);
        
        // Ensure note doesn't go off screen
        const maxWidth = window.innerWidth - this.x - 10;
        const maxHeight = window.innerHeight - this.y - 10;
        
        this.width = Math.min(this.width, maxWidth);
        this.height = Math.min(this.height, maxHeight);
        
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
    };
    
    handleResizeEnd = () => {
        this.isResizing = false;
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.handleResizeEnd);
        this.save();
    };
    
    save() {
        const data = {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            text: this.text,
            created: this.created
        };
        
        try {
            const notes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const index = notes.findIndex(note => note.id === this.id);
            
            if (index >= 0) {
                notes[index] = data;
            } else {
                notes.push(data);
            }
            
            localStorage.setItem('stickyNotes', JSON.stringify(notes));
        } catch (error) {
            console.warn('Failed to save sticky note:', error);
        }
    }
    
    delete() {
        // Clean up event listeners
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.handleResizeEnd);
        
        // Unregister from debug system
        DebugSystem.unregisterDebugElement(`stickyNote_${this.id}`);
        
        this.element.remove();
        StickyNote.notes.delete(this.id);
        
        try {
            const notes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const filtered = notes.filter(note => note.id !== this.id);
            localStorage.setItem('stickyNotes', JSON.stringify(filtered));
        } catch (error) {
            console.warn('Failed to delete sticky note from storage:', error);
        }
    }
    
    // Static methods
    static create(options = {}) {
        // Position new notes with slight offset from existing ones
        const offset = StickyNote.notes.size * 30;
        const defaultOptions = {
            x: 100 + offset,
            y: 100 + offset
        };
        
        return new StickyNote({ ...defaultOptions, ...options });
    }
    
    static loadAll() {
        try {
            const notes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            notes.forEach(noteData => {
                const note = new StickyNote(noteData);
                
                // Check if we're in presentation mode and hide if needed
                if (DebugSystem.isPresentationMode && note.element) {
                    note.element.style.display = 'none';
                }
            });
            
            // Update nextId to avoid conflicts
            if (notes.length > 0) {
                StickyNote.nextId = Math.max(...notes.map(n => n.id)) + 1;
            }
        } catch (error) {
            console.warn('Failed to load sticky notes:', error);
        }
    }
    
    static clearAll() {
        const confirmed = confirm('Are you sure you want to delete all sticky notes?');
        if (confirmed) {
            StickyNote.notes.forEach(note => note.element.remove());
            StickyNote.notes.clear();
            
            try {
                localStorage.removeItem('stickyNotes');
            } catch (error) {
                console.warn('Failed to clear sticky notes from storage:', error);
            }
        }
    }
}

// Initialize sticky note system
if (typeof window !== 'undefined') {
    window.StickyNoteManager = { StickyNote };
    
    // Load existing notes when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => StickyNote.loadAll());
    } else {
        StickyNote.loadAll();
    }
}