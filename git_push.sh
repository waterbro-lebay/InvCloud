#!/bin/bash

# 提示使用者輸入 commit 訊息
read -p "請輸入 commit 訊息: " commit_message

# 提示使用者輸入分支名稱
read -p "請輸入要 push 的分支名稱: " branch_name

# 執行 Git 指令
git add .
git commit -m "$commit_message"
git push origin "$branch_name"

echo "✅ 已成功推送到 $branch_name 分支！"