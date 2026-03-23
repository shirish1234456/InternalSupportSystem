import os
import re

file_path = 'app/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add GripHorizontal to lucide-react imports
if 'GripHorizontal' not in content:
    content = content.replace('Clock, Users, FileText', 'Clock, Users, FileText, GripHorizontal')

# 2. Replace the Main Charts container with ResponsiveGridLayout
rgl_container = '''{/* Draggable Dashboard Layout */}
            <ResponsiveGridLayout
                className="layout mt-6 relative z-20"
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                draggableHandle=".drag-handle"
            >'''

content = content.replace(
    '{/* Main Charts Area */}\n            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">',
    rgl_container
)

# 3. Fuse the secondary charts grid by removing its wrapper
content = re.sub(
    r'</motion\.div>\s*\{/\* Secondary Charts \*/\}\s*<motion\.div variants=\{containerVariants\} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">',
    '',
    content
)

# 4. Remove the final closing </motion.div> for the secondary charts and replace with </ResponsiveGridLayout>
content = re.sub(
    r'</motion\.div>\s*</div>\s*\);\s*\}',
    '</ResponsiveGridLayout>\n        </div>\n    );\n}',
    content
)

# 5. Inject keys and drag handles into the 7 chart cards
# They currently look like: <motion.div variants={itemVariants} className="bg-white/70 ... p-6 ...">
# We change it to: <div key="..." className="bg-white/70 ... p-6 flex flex-col h-full">

chart_keys = ['comparative', 'department', 'issues', 'emails', 'spikes', 'agents', 'queries']

# For the drag handle, we find the first <h3 class... flex items-center gap-2"> or <div class... flex items-center justify-between">
# and inject the GripHorizontal.

cards = content.split('<motion.div variants={itemVariants}')

new_content = cards[0]
for i in range(1, len(cards)):
    key = chart_keys[i-1] if i-1 < len(chart_keys) else f"unknown-{i}"
    
    # Replace the container definition
    piece = cards[i].replace(' className="', f' key="{key}" className="w-full h-full flex flex-col ')
    
    # We replace the closing tag of this specific card. 
    # Since it was `<motion.div...` it originally ended with `</motion.div>`.
    # To do this safely, we simply replace the LAST `</motion.div>` in this chunk? No, that's brittle.
    # It's better to just globally replace `</motion.div>` and wait, there are no nested `motion.div` in the charts!
    piece = piece.replace('</motion.div>', '</div>')
    
    # Inject drag handle into the header
    drag_handle = '<GripHorizontal className="w-5 h-5 text-slate-300 hover:text-slate-500 cursor-move drag-handle transition-colors" />'
    
    # find `<div className="flex items-center gap-2">` or `<h3 className="..." flex items-center gap-2">`
    # and put drag handle inside.
    if '<div className="flex items-center gap-2">' in piece:
        piece = piece.replace('<div className="flex items-center gap-2">', f'<div className="flex items-center gap-2">{drag_handle}')
    elif 'flex items-center gap-2">' in piece:
        piece = piece.replace('flex items-center gap-2">', f'flex items-center gap-2">{drag_handle}')
    
    new_content += '<div' + piece

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully rewrote layout. Tokens parsed: {len(new_content)}")
