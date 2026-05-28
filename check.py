#!/usr/bin/env python3
"""
🌳 TREE - Tool hiển thị cây thư mục đơn giản
Sử dụng: python tree.py [đường_dẫn]
"""

import os
from pathlib import Path
import sys

def show_tree(path=".", max_depth=10):
    """Hiển thị cây thư mục"""
    
    def _show(folder, prefix="", depth=0):
        if depth > max_depth:
            return
        
        try:
            items = sorted(Path(folder).iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
            
            # Lọc file ẩn và thư mục không cần thiết
            ignore = {'.git', 'node_modules', '__pycache__', '.vscode', '.idea', 'build', 'dist'}
            items = [item for item in items if not item.name.startswith('.') and item.name not in ignore]
            
            for i, item in enumerate(items):
                is_last = i == len(items) - 1
                
                # Ký tự vẽ cây
                if is_last:
                    current = "└── "
                    next_prefix = prefix + "    "
                else:
                    current = "├── "
                    next_prefix = prefix + "│   "
                
                # Icon cho file/folder
                if item.is_dir():
                    icon = "📁"
                    print(f"{prefix}{current}{icon} {item.name}/")
                    _show(item, next_prefix, depth + 1)
                else:
                    # Icon theo loại file
                    ext = item.suffix.lower()
                    if ext in ['.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c']:
                        icon = "📄"
                    elif ext in ['.json', '.yml', '.yaml', '.xml']:
                        icon = "⚙️"
                    elif ext in ['.md', '.txt']:
                        icon = "📝"
                    elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
                        icon = "🖼️"
                    else:
                        icon = "📄"
                    
                    print(f"{prefix}{current}{icon} {item.name}")
                    
        except PermissionError:
            print(f"{prefix}❌ Không có quyền truy cập")
    
    folder_path = Path(path)
    if not folder_path.exists():
        print(f"❌ Đường dẫn không tồn tại: {path}")
        return
    
    print(f"📁 {folder_path.name}/")
    _show(folder_path)

def main():
    print("🌳 TREE - Hiển thị cây thư mục")
    print("=" * 40)
    
    # Lấy đường dẫn từ tham số hoặc nhập tay
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = input("Nhập đường dẫn (Enter = thư mục hiện tại): ").strip()
        if not path:
            path = "."
    
    show_tree(path)
    print("=" * 40)

if __name__ == "__main__":
    main()