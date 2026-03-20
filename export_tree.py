import os

# ================================
# 排除資料夾名稱
# ================================
EXCLUDE_DIRS = {
    "__pycache__",
    ".next",
    "node_modules",
    ".git",
    "dist",
    "build",
    ".venv",
    ".idea",
}

# ================================
# 排除檔案名稱（完整檔名）
# ================================
EXCLUDE_FILES = {
    "export_tree.py",
    "structure.txt",
    "docker-compose.yml.old",
}

# ================================
# 排除副檔名（可選）
# ================================
EXCLUDE_EXTENSIONS = {
    ".log",
    ".tmp",
    ".cache",
}

OUTPUT_FILE = "structure.txt"


def should_exclude(entry: str) -> bool:
    """判斷是否應該排除"""

    # 排除指定檔案
    if entry in EXCLUDE_FILES:
        return True

    # 排除副檔名
    _, ext = os.path.splitext(entry)
    if ext in EXCLUDE_EXTENSIONS:
        return True

    return False


def export_tree(root_dir, prefix=""):
    entries = sorted(os.listdir(root_dir))

    filtered_entries = []
    for e in entries:
        full_path = os.path.join(root_dir, e)

        # 排除資料夾
        if os.path.isdir(full_path) and e in EXCLUDE_DIRS:
            continue

        # 排除檔案
        if should_exclude(e):
            continue

        filtered_entries.append(e)

    lines = []
    for index, entry in enumerate(filtered_entries):
        path = os.path.join(root_dir, entry)

        is_last = index == len(filtered_entries) - 1
        connector = "└── " if is_last else "├── "

        lines.append(prefix + connector + entry)

        # 遞迴資料夾
        if os.path.isdir(path):
            extension = "    " if is_last else "│   "
            lines.extend(export_tree(path, prefix + extension))

    return lines


if __name__ == "__main__":
    root = "."
    tree_lines = export_tree(root)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(tree_lines))

    print(f"✅ 目錄結構已輸出到：{OUTPUT_FILE}")
