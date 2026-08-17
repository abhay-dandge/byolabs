#!/usr/bin/env bash
# ==============================================================================
# BYOLabs.in — Ubuntu Kubernetes Server Installation & Deployment Script
# Description: Fully automated script to install Node.js 20, K3s Kubernetes,
#              apply RBAC permissions, build the monorepo, seed database,
#              and launch BYOLabs API (port 4000) and Web App (port 3000).
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================================${NC}"
echo -e "${GREEN} 🚀 BYOLabs.in — Ubuntu + Kubernetes Production Deployer${NC}"
echo -e "${CYAN}====================================================================${NC}"

# 1. Check Root / Sudo privilege
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}➜ Requesting sudo privileges for package installation...${NC}"
  SUDO="sudo"
else
  SUDO=""
fi

# 2. Update System Packages & Install Prerequisites
echo -e "\n${BLUE}[1/6] Updating APT system packages & installing prerequisites...${NC}"
$SUDO apt-get update -y
$SUDO apt-get install -y curl wget git build-essential ca-certificates gnupg software-properties-common

# 3. Install Node.js 20.x LTS & PM2
echo -e "\n${BLUE}[2/6] Checking / Installing Node.js 20.x LTS & PM2 process manager...${NC}"
if ! command -v node &> /dev/null || [ $(node -v | cut -d. -f1 | tr -d 'v' | cut -d. -f1) -lt 20 ]; then
  echo -e "${YELLOW}Installing Node.js 20 LTS from NodeSource...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
  $SUDO apt-get install -y nodejs
else
  echo -e "${GREEN}✔ Node.js version $(node -v) is already installed.${NC}"
fi

if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}Installing PM2 process manager globally...${NC}"
  $SUDO npm install -g pm2
else
  echo -e "${GREEN}✔ PM2 process manager is already installed.${NC}"
fi

# 4. Check & Provision Kubernetes Engine (K3s)
echo -e "\n${BLUE}[3/6] Setting up Kubernetes engine & Kubeconfig...${NC}"
if ! command -v kubectl &> /dev/null && [ ! -f ~/.kube/config ] && [ ! -f /etc/rancher/k3s/k3s.yaml ]; then
  echo -e "${YELLOW}No Kubernetes cluster detected. Installing lightweight K3s server...${NC}"
  curl -sfL https://get.k3s.io | sh -
  
  # Configure kubeconfig for current user
  mkdir -p ~/.kube
  $SUDO cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
  $SUDO chown $(id -u):$(id -g) ~/.kube/config
  export KUBECONFIG=~/.kube/config
  echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
  echo -e "${GREEN}✔ K3s cluster installed and Kubeconfig configured at ~/.kube/config${NC}"
else
  echo -e "${GREEN}✔ Kubernetes control plane / Kubeconfig detected.${NC}"
  if [ -f /etc/rancher/k3s/k3s.yaml ] && [ ! -f ~/.kube/config ]; then
    mkdir -p ~/.kube
    $SUDO cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
    $SUDO chown $(id -u):$(id -g) ~/.kube/config
  fi
  export KUBECONFIG=~/.kube/config
fi

# Apply BYOLabs K8s RBAC Roles
echo -e "${YELLOW}Applying BYOLabs K8s ClusterRole & ServiceAccount permissions...${NC}"
if [ -f "./infrastructure/kubernetes/rbac.yaml" ]; then
  kubectl apply -f ./infrastructure/kubernetes/rbac.yaml
  echo -e "${GREEN}✔ K8s RBAC ClusterRoles successfully applied.${NC}"
fi

# 5. Monorepo Build & Seed Database
echo -e "\n${BLUE}[4/6] Installing NPM workspace dependencies & building project...${NC}"
npm install

echo -e "${YELLOW}Building packages (@byolabs/shared, @byolabs/api, @byolabs/web)...${NC}"
(cd packages/shared && npm run build)
(cd apps/api && npm run build)
(cd apps/web && npm run build)

echo -e "${YELLOW}Seeding initial database (Labs & Admin account)...${NC}"
npm run seed

# 6. Launch Application Processes using PM2
echo -e "\n${BLUE}[5/6] Starting BYOLabs backend & web frontend using PM2...${NC}"

# Stop any previously running BYOLabs PM2 instances
pm2 delete byolabs-api byolabs-web 2>/dev/null || true

# Start API Server (Port 4000)
pm2 start apps/api/dist/server.js --name "byolabs-api" --env PORT=4000

# Start Web Server Preview (Port 3000)
pm2 start "npx vite preview --port 3000 --host 0.0.0.0" --name "byolabs-web" --cwd apps/web

pm2 save

SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "\n${CYAN}====================================================================${NC}"
echo -e "${GREEN} 🎉 BYOLabs.in Deployment Complete!${NC}"
echo -e "${CYAN}====================================================================${NC}"
echo -e " 🌐 Web Application:  ${GREEN}http://${SERVER_IP}:3000/${NC}  (or http://localhost:3000/)"
echo -e " 🔌 Backend API & WS: ${GREEN}http://${SERVER_IP}:4000/${NC}"
echo -e " 🔑 Admin Email:       ${YELLOW}admin@byolabs.in${NC}"
echo -e " 🔑 Admin Password:    ${YELLOW}Admin@123456${NC}"
echo -e " ⚙️  K8s Cluster Mode:  ${GREEN}ACTIVE${NC}"
echo -e "${CYAN}====================================================================${NC}"
echo -e "💡 Useful PM2 Management Commands:"
echo -e "   - Check Status: ${YELLOW}pm2 status${NC}"
echo -e "   - View Logs:   ${YELLOW}pm2 logs${NC}"
echo -e "   - Restart App: ${YELLOW}pm2 restart all${NC}"
echo -e "${CYAN}====================================================================${NC}"
