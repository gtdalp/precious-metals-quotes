#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
贵金属行情网页 - GitHub 部署脚本
使用 GitHub CLI 自动部署
"""

import os
import sys
import subprocess
import json
import time
import shutil

# 配置
REPO_NAME = "precious-metals-quotes"
REPO_DESCRIPTION = "贵金属行情中心 - 实时展示黄金、白银、铜价格及 A 股相关股票数据"
BRANCH = "main"
GITHUB_PAGES_BRANCH = "gh-pages"

# 刷新 PATH 以包含 gh
if sys.platform == 'win32':
    os.environ['Path'] = os.environ.get('Path', '') + ';' + os.environ.get('Path', '')

def print_step(message):
    print(f"\n{'='*60}")
    print(f"[STEP] {message}")
    print(f"{'='*60}\n")

def print_success(message):
    print(f"[OK] {message}")

def print_error(message):
    print(f"[ERROR] {message}")

def run_command(command, cwd=None, check=True):
    """执行 shell 命令"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=check,
            encoding='utf-8'
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        if check:
            print_error(f"命令执行失败：{e}")
            if e.stderr:
                print(f"错误：{e.stderr}")
        return None

def get_github_username():
    """获取 GitHub 用户名"""
    result = run_command("gh api user --jq .login", check=False)
    return result

def main():
    print("\n" + "=" * 60)
    print("  贵金属行情网页 - GitHub 部署工具")
    print("=" * 60 + "\n")
    
    # 获取工作目录
    work_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(work_dir, 'assets')
    
    print(f"工作目录：{work_dir}\n")
    
    # 检查 GitHub 登录
    username = get_github_username()
    if not username:
        print_error("未登录 GitHub，请先执行：gh auth login")
        sys.exit(1)
    
    print_success(f"GitHub 用户：{username}\n")
    
    # 步骤 1: 创建或获取仓库
    print_step("创建/获取 GitHub 仓库")
    
    repo_url = f"https://github.com/{username}/{REPO_NAME}"
    
    # 检查仓库是否存在
    result = run_command(f"gh repo view {username}/{REPO_NAME} --json name,url", check=False)
    
    if result:
        print_success(f"使用现有仓库：{repo_url}")
    else:
        print(f"创建新仓库：{REPO_NAME}")
        run_command(f"gh repo create {REPO_NAME} --public --description \"{REPO_DESCRIPTION}\"")
        print_success(f"仓库创建成功：{repo_url}")
    
    # 步骤 2: 初始化 Git 仓库
    print_step("初始化 Git 仓库")
    
    git_dir = os.path.join(work_dir, '.git')
    if not os.path.exists(git_dir):
        run_command("git init", cwd=work_dir)
        print_success("Git 仓库初始化完成")
    else:
        print_success("Git 仓库已存在")
    
    # 设置远程仓库
    run_command(f"git remote remove origin", cwd=work_dir, check=False)
    run_command(f"git remote add origin https://github.com/{username}/{REPO_NAME}.git", cwd=work_dir)
    print_success(f"远程仓库配置：https://github.com/{username}/{REPO_NAME}.git")
    
    # 步骤 3: 复制 assets 文件到根目录
    print_step("准备部署文件")
    
    for file in os.listdir(assets_dir):
        src = os.path.join(assets_dir, file)
        dst = os.path.join(work_dir, file)
        
        if os.path.isfile(src):
            shutil.copy2(src, dst)
            print(f"  [FILE] {file}")
    
    print_success("文件准备完成\n")
    
    # 步骤 4: 提交并推送到 main 分支
    print_step("推送到 main 分支")
    
    run_command("git add -A", cwd=work_dir)
    run_command('git commit -m "Deploy precious metals quotes page"', cwd=work_dir, check=False)
    run_command(f"git branch -M {BRANCH}", cwd=work_dir, check=False)
    run_command(f"git push -u origin {BRANCH} --force", cwd=work_dir)
    print_success("main 分支推送成功\n")
    
    # 步骤 5: 创建 gh-pages 分支
    print_step("创建 gh-pages 分支")
    
    current_branch = run_command("git branch --show-current", cwd=work_dir)
    
    # 创建 gh-pages 分支
    run_command(f"git checkout -b {GITHUB_PAGES_BRANCH}", cwd=work_dir)
    
    # 删除不需要的文件
    files_to_remove = ['skills', 'scripts', '*.skill', '*.md', 'SKILL.md', 'DEPLOY.md', 'README.md']
    for pattern in ['skills', 'scripts', '*.skill', '*.md']:
        run_command(f"git rm -r --ignore-unmatch {pattern}", cwd=work_dir, check=False)
    
    # 提交 gh-pages
    run_command(f'git commit -m "Setup gh-pages branch"', cwd=work_dir, check=False)
    run_command(f"git push -u origin {GITHUB_PAGES_BRANCH} --force", cwd=work_dir)
    
    print_success(f"{GITHUB_PAGES_BRANCH} 分支推送成功\n")
    
    # 切换回 main 分支
    if current_branch:
        run_command(f"git checkout {current_branch}", cwd=work_dir)
    else:
        run_command(f"git checkout {BRANCH}", cwd=work_dir)
    
    # 步骤 6: 启用 GitHub Pages
    print_step("启用 GitHub Pages")
    
    # 检查 Pages 是否已启用
    pages_url = run_command(
        f"gh api repos/{username}/{REPO_NAME}/pages --jq .html_url",
        check=False
    )
    
    if pages_url and pages_url != 'null':
        print_success(f"GitHub Pages 已启用：{pages_url}")
    else:
        print("正在启用 GitHub Pages...")
        run_command(
            f"gh api repos/{username}/{REPO_NAME}/pages "
            f"-X POST "
            f"-f source['branch']='{GITHUB_PAGES_BRANCH}' "
            f"-f source['path']='/'",
            check=False
        )
        print("等待 GitHub Pages 部署...")
        time.sleep(5)
        
        pages_url = run_command(
            f"gh api repos/{username}/{REPO_NAME}/pages --jq .html_url",
            check=False
        )
        
        if pages_url and pages_url != 'null':
            print_success(f"GitHub Pages 已启用：{pages_url}")
        else:
            pages_url = f"https://{username}.github.io/{REPO_NAME}/"
            print(f"备用访问链接：{pages_url}")
    
    # 步骤 7: 清理临时文件
    print_step("清理临时文件")
    
    for file in ['index.html', 'app.js']:
        file_path = os.path.join(work_dir, file)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    print_success("清理完成\n")
    
    # 输出结果
    print("=" * 60)
    print("  部署完成！")
    print("=" * 60 + "\n")
    
    print("GitHub 仓库地址:")
    print(f"   {repo_url}\n")
    
    print("GitHub Pages 访问链接:")
    print(f"   {pages_url}\n")
    
    print("提示:")
    print("   - 页面每 5 秒自动刷新数据")
    print("   - 点击右下角按钮可手动刷新")
    print("   - 如需修改配置，请编辑 app.js 文件")
    print("   - GitHub Pages 可能需要 1-2 分钟生效\n")

if __name__ == "__main__":
    main()
