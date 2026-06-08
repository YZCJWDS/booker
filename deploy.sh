#!/bin/bash

# Odile's Lab 博客部署脚本
# 用途：快速部署静态博客到 VPS

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  Odile's Lab 博客部署工具${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# 配置文件路径
CONFIG_FILE=".deploy-config"

# 读取已保存的配置
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        return 0
    else
        return 1
    fi
}

# 保存配置
save_config() {
    cat > "$CONFIG_FILE" << EOF
# Odile's Lab 部署配置
# 此文件由 deploy.sh 自动生成，请勿手动编辑

VPS_USER="$VPS_USER"
VPS_HOST="$VPS_HOST"
VPS_PATH="$VPS_PATH"
LOCAL_PATH="$LOCAL_PATH"
EOF
    echo -e "${GREEN}✓ 配置已保存到 $CONFIG_FILE${NC}"
}

# 交互式配置
interactive_config() {
    echo -e "${BLUE}首次部署需要配置 VPS 信息${NC}"
    echo ""

    # VPS 用户名
    read -p "VPS 用户名 (默认: root): " input_user
    VPS_USER=${input_user:-root}

    # VPS IP 地址
    while true; do
        read -p "VPS IP 地址: " VPS_HOST
        if [ -z "$VPS_HOST" ]; then
            echo -e "${RED}IP 地址不能为空，请重新输入${NC}"
        else
            break
        fi
    done

    # 部署路径
    read -p "部署路径 (默认: /var/www/blog): " input_path
    VPS_PATH=${input_path:-/var/www/blog}

    # 本地路径
    LOCAL_PATH="./"

    echo ""
    echo -e "${YELLOW}配置信息确认：${NC}"
    echo -e "  用户名: ${VPS_USER}"
    echo -e "  主机IP: ${VPS_HOST}"
    echo -e "  路径: ${VPS_PATH}"
    echo ""

    read -p "确认配置无误？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}已取消配置${NC}"
        exit 1
    fi

    # 询问是否保存配置
    read -p "是否保存配置以便下次使用？(Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        save_config
        echo -e "${YELLOW}提示：配置文件已保存，请勿将其提交到 Git${NC}"
    fi
}

# 加载配置或进行交互式配置
if load_config; then
    echo -e "${GREEN}✓ 已加载保存的配置${NC}"
    echo -e "  用户: ${VPS_USER}"
    echo -e "  主机: ${VPS_HOST}"
    echo -e "  路径: ${VPS_PATH}"
    echo ""

    read -p "使用此配置继续部署？(Y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        interactive_config
    fi
else
    interactive_config
fi

# 确认部署
echo -e "${YELLOW}即将部署到：${NC}"
echo -e "  用户: ${VPS_USER}"
echo -e "  主机: ${VPS_HOST}"
echo -e "  路径: ${VPS_PATH}"
echo ""
read -p "确认部署？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}已取消部署${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[1/4] 检查本地文件...${NC}"
if [ ! -f "index.html" ]; then
    echo -e "${RED}错误：未找到 index.html，请在博客根目录执行此脚本${NC}"
    exit 1
fi
for cmd in ssh rsync; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${RED}错误：未找到 $cmd，请先安装后再部署${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ 本地文件检查通过${NC}"

echo ""
echo -e "${GREEN}[2/4] 连接 VPS 并创建目录...${NC}"
ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${VPS_PATH}"
echo -e "${GREEN}✓ 目录创建成功${NC}"

echo ""
echo -e "${GREEN}[3/4] 上传文件到 VPS...${NC}"
rsync -avz --delete \
    --exclude=".git" \
    --exclude=".deploy-config" \
    --exclude=".deploy-config.ps1.json" \
    --exclude="node_modules" \
    --exclude="*.sh" \
    --exclude="*.ps1" \
    --exclude="CHANGELOG.md" \
    "${LOCAL_PATH}" "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 文件上传成功${NC}"
else
    echo -e "${RED}✗ 文件上传失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[4/4] 设置文件权限...${NC}"
ssh "${VPS_USER}@${VPS_HOST}" "chown -R www-data:www-data ${VPS_PATH}"
echo -e "${GREEN}✓ 权限设置成功${NC}"

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "访问地址: ${GREEN}http://${VPS_HOST}/${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo -e "  1. 如果网站无法访问，检查 Nginx 配置"
echo -e "  2. 执行 'sudo nginx -t' 检查配置是否正确"
echo -e "  3. 执行 'sudo systemctl reload nginx' 重载 Nginx"
echo ""
