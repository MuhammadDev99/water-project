import os
import subprocess
from datetime import datetime

# ==============================================================================
# ⚙️ SCRIPT CONFIGURATION (EDIT EVERYTHING HERE)
# ==============================================================================

# --- GENERAL OPTIONS ---
OUTPUT_FILE = "project_context.txt"
RUN_TYPE_CHECK = True         # Set to False to skip 'npx tsc --noEmit'
HIDE_TREE_ONLY_DIRS = False    # True = completely hide them; False = show in tree, but hide file content

# --- 1. WHAT TO INCLUDE ---
INCLUDE_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', 
    '.html', '.css', '.prisma', '.sql', '.env'
}
INCLUDE_FILENAMES = {
    'Dockerfile', 'docker-compose.yml', '.env.example'
}

# --- 2. WHAT TO COMPLETELY IGNORE ---
IGNORE_DIRS = {
    ".cache",
    'node_modules', '.git', '.expo', 'dist', 'build', '.next', 
    '__pycache__', '.vs', '.vscode', 'out',"drizzle"
}
IGNORE_FILES = {
    'README.md',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
    'script.py', 'project_context.txt' # Prevent the script from reading itself or its output
}

# --- 3. FOCUS MODES ---
# Folders here will either be entirely hidden or just have their contents hidden (based on HIDE_TREE_ONLY_DIRS)
TREE_ONLY_DIRS = {
    # 'client',
    # 'admin',
    # 'components',
    # 'assets',
}

# If ANYTHING is added here, the script switches to "Exclusive Mode" 
# Only files/folders/extensions listed here will have their content read.
ONLY_SHOW_CONTENT_FOR = {
    # 'package.json',
    # 'tsconfig.json',
    # '.json',
}

# ==============================================================================
# 🛑 END OF CONFIGURATION (Do not edit below unless changing core logic)
# ==============================================================================


# ==========================================
# 🧠 HELPER FUNCTIONS
# ==========================================

def should_include_file(filename):
    """Determines if a file should be tracked based on our rules."""
    if filename in IGNORE_FILES:
        return False
        
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext in INCLUDE_EXTENSIONS or filename in INCLUDE_FILENAMES:
        return True
        
    return False

def generate_tree(root_dir):
    """Generates a text-based directory tree for AI context."""
    tree_str = ""
    # Determine what directories to filter out of the tree
    effective_ignore = IGNORE_DIRS.copy()
    if HIDE_TREE_ONLY_DIRS:
        effective_ignore.update(TREE_ONLY_DIRS)

    for root, dirs, files in os.walk(root_dir):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in effective_ignore]
        dirs.sort()
        
        level = root.replace(root_dir, '').count(os.sep)
        indent = ' ' * 4 * level
        
        folder_name = os.path.basename(root) if root != root_dir else os.path.basename(root_dir)
        tree_str += f"{indent}📂 {folder_name}/\n"
        
        subindent = ' ' * 4 * (level + 1)
        
        valid_files = [f for f in files if should_include_file(f)]
        valid_files.sort()
        
        for f in valid_files:
            tree_str += f"{subindent}📄 {f}\n"
            
    return tree_str

def get_typescript_errors():
    """Runs a TypeScript compiler check and returns the output."""
    try:
        # Using npx ensures we use the project's local typescript dependency
        result = subprocess.run(
            "npx tsc --noEmit",
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            return "✅ No TypeScript errors found. Types are entirely intact.\n"
        else:
            # Combine stdout and stderr as tsc might use either depending on the error/version
            output = result.stdout + "\n" + result.stderr
            return f"❌ TypeScript errors found:\n\n```text\n{output.strip()}\n```\n"
            
    except Exception as e:
        return f"⚠️ Could not execute type check. Error: {e}\n"

# ==========================================
# 🚀 MAIN EXECUTION
# ==========================================

def generate_context():
    root_dir = os.getcwd()
    total_files_added = 0
    total_files_omitted = 0
    
    # Determine effective directories to ignore for the main loop
    effective_ignore = IGNORE_DIRS.copy()
    if HIDE_TREE_ONLY_DIRS:
        effective_ignore.update(TREE_ONLY_DIRS)

    print(f"🔍 Scanning directory: {root_dir}...\n")
    
    if ONLY_SHOW_CONTENT_FOR:
        print(f"⚠️ EXCLUSIVE MODE ACTIVE: Only showing content for: {', '.join(ONLY_SHOW_CONTENT_FOR)}\n")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        # --- 1. WRITE HEADER ---
        outfile.write("=" * 60 + "\n")
        outfile.write(" PROJECT ARCHITECTURE AND SOURCE CODE\n")
        outfile.write("=" * 60 + "\n")
        outfile.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # --- 2. WRITE DIRECTORY TREE ---
        print("🌳 Generating directory tree...")
        outfile.write("--- DIRECTORY TREE ---\n")
        outfile.write(generate_tree(root_dir))
        outfile.write("\n" + "=" * 60 + "\n\n")
        
        # --- 3. WRITE TYPESCRIPT TYPE ERRORS (IF ENABLED) ---
        if RUN_TYPE_CHECK:
            print("⏳ Running TypeScript type check (this may take a few moments)...")
            outfile.write("--- TYPESCRIPT TYPE CHECK (tsc --noEmit) ---\n")
            outfile.write(get_typescript_errors())
            outfile.write("\n" + "=" * 60 + "\n\n")

        # --- 4. WRITE FILE CONTENTS ---
        print("📄 Extracting file contents...")
        for root, dirs, files in os.walk(root_dir):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in effective_ignore]

            for file in files:
                if not should_include_file(file):
                    continue

                full_path = os.path.join(root, file)
                
                # Normalize slashes
                relative_path = os.path.relpath(full_path, root_dir).replace(os.sep, '/')
                path_parts = relative_path.split('/')
                file_name = path_parts[-1]
                file_ext = os.path.splitext(file_name)[1].lower()
                
                omit_content = False

                # ----------------------------------------------------
                # 🎯 CONTENT FILTERING LOGIC
                # ----------------------------------------------------
                if ONLY_SHOW_CONTENT_FOR:
                    # STRICT WHITELIST MODE
                    is_focused = (
                        file_name in ONLY_SHOW_CONTENT_FOR or 
                        file_ext in ONLY_SHOW_CONTENT_FOR or 
                        any(folder in ONLY_SHOW_CONTENT_FOR for folder in path_parts[:-1])
                    )
                    if not is_focused:
                        omit_content = True
                else:
                    # BLACKLIST MODE
                    # Even if not hidden from tree, check if content should be hidden
                    is_tree_only = any(folder in TREE_ONLY_DIRS for folder in path_parts[:-1])
                    if is_tree_only:
                        omit_content = True

                # Skip reading if content is omitted
                if omit_content:
                    total_files_omitted += 1
                    # Only print omitted message if the folder wasn't already hidden from tree
                    if not any(folder in effective_ignore for folder in path_parts[:-1]):
                        print(f"  🙈 Omitted content: {relative_path}")
                    continue

                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as infile:
                        content = infile.read()
                        
                    outfile.write(f"--- FILE: {relative_path} ---\n")
                    outfile.write("```" + file_ext.replace('.', '') + "\n")
                    outfile.write(content)
                    if not content.endswith("\n"):
                        outfile.write("\n")
                    outfile.write("```\n\n")
                    
                    total_files_added += 1
                    print(f"  ✓ Added: {relative_path}")
                
                except Exception as e:
                    print(f"  ❌ Error reading {relative_path}: {e}")

    # --- SUMMARY ---
    print("\n" + "=" * 40)
    print("🎉 DONE!")
    print(f"📁 Full files processed: {total_files_added}")
    print(f"🙈 Files in tree but content hidden: {total_files_omitted}")
    if RUN_TYPE_CHECK:
        print("🛠️  TypeScript checks included.")
    print(f"💾 Output saved to: {OUTPUT_FILE}")
    print("=" * 40)

if __name__ == "__main__":
    generate_context()