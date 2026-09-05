import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Smartphone, Check, Copy, ExternalLink, QrCode, PlayCircle, GitBranch, Sparkles } from "lucide-react";

interface PhoneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export default function PhoneGuideModal({
  isOpen,
  onClose,
  appUrl,
}: PhoneGuideModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"phone" | "googleplay" | "github">("phone");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    appUrl
  )}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#12151c] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-white max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">使用与发布指南</h3>
              <p className="text-xs text-white/40">微信输入法试用 • 桌面快捷 App • Google Play 上架</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-black/40 border border-white/10 rounded-2xl p-1 mb-5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "phone"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>手机/微信试用</span>
            </button>
            <button
              onClick={() => setActiveTab("googleplay")}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "googleplay"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Google Play 上架</span>
            </button>
            <button
              onClick={() => setActiveTab("github")}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === "github"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub 导出</span>
            </button>
          </div>

          {/* TAB 1: 手机与微信输入法试用 */}
          {activeTab === "phone" && (
            <div className="space-y-4">
              {/* QR Code and link section */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                <p className="text-xs text-white/70 mb-3 flex items-center space-x-1.5 font-medium">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>使用手机微信或自带相机扫码打开：</span>
                </p>
                <div className="bg-white p-2.5 rounded-2xl shadow-lg mb-3">
                  <img
                    src={qrCodeUrl}
                    alt="Scan to open on phone"
                    className="w-36 h-36"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Link & Open in new tab */}
                <div className="w-full flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-xs text-white/70 truncate flex-1 font-mono">
                    {appUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 flex items-center space-x-1 py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>独立打开</span>
                  </a>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2 text-xs text-white/80 bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-bold text-cyan-400 text-xs uppercase tracking-wider mb-2">
                  📲 微信输入法语音转文字流程：
                </p>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>手机端打开网址后，点击输入框或麦克风按钮唤起<strong>微信输入法</strong>。</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>长按键盘空格键说话，微信输入法实时转文字（例如说：“明天下午三点去机场接老李，记得带上合同”）。</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>点击“生成待办清单”，后台 <strong>DeepSeek V3</strong> 模型智能解析并自动归档到今日清单！</p>
                  </div>
                </div>

                {/* Instant PWA desktop shortcut tip */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-start space-x-2 text-white/60">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>免发布秒变原生 App 技巧</strong>：在手机 Chrome 或自带浏览器打开本页，点击菜单中的<strong>“添加到主屏幕”</strong>，即可在折叠屏桌面上生成独立无边框应用图标，无需经过应用商店审核！
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Google Play 上架流程 */}
          {activeTab === "googleplay" && (
            <div className="space-y-3.5 text-xs text-white/80">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4">
                <h4 className="font-bold text-cyan-300 text-sm flex items-center space-x-2 mb-1">
                  <PlayCircle className="w-4 h-4" />
                  <span>Google Play 上架说明</span>
                </h4>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  Google Play 开发者账号支持直接上架 Web App（基于 <strong>Google 官方 TWA - Trusted Web Activity</strong> 技术标准），无需从头编写安卓原生代码。
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <p className="font-bold text-white text-xs">🛠️ 官方 3 步打包上架方法（Bubblewrap）：</p>
                
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      <strong>导出代码或使用现有线上地址</strong>：本项目已配置好完整的 <code className="bg-black/40 text-cyan-300 px-1 rounded">manifest.json</code> 与移动端支持。线上托管地址即为您当前的 Shared URL。
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      <strong>使用 Google 官方工具生成 AAB 安装包</strong>：在电脑终端运行 Google 官方的 Bubblewrap 工具：<br />
                      <code className="block bg-black/60 text-cyan-300 p-2 rounded-xl mt-1 font-mono text-[10px] select-all">
                        npx @bubblewrap/cli init --manifest="{appUrl}/manifest.json"
                      </code>
                      该命令会自动读取配置并生成 Google Play 要求的 <code className="text-cyan-300 font-bold">.aab</code> (Android App Bundle) 文件。
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      <strong>上传至 Google Play Console</strong>：登录您的 Google Play 开发者后台，创建新应用并上传刚才生成的 <code className="text-cyan-300 font-bold">.aab</code> 文件，填写应用信息即可提交发布。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-[11px] text-amber-200">
                💡 <strong>提示</strong>：Google Play 上架需要数天的审查流程；如果仅仅是您自己日常使用，最便捷的方法是在手机浏览器中<strong>直接“添加到主屏幕”</strong>，体验与商店下载完全一致。
              </div>
            </div>
          )}

          {/* TAB 3: GitHub 同步与导出 */}
          {activeTab === "github" && (
            <div className="space-y-3.5 text-xs text-white/80">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <span>如何同步代码到您的 GitHub 仓库？</span>
                </h4>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  在当前的 Google AI Studio 平台中，代码保存在云端专属环境内。您可以一键将全部源码同步推送到您自己的 GitHub 账号：
                </p>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>查看当前网页右上角（AI Studio 顶部导航栏右上方）。</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      点击 <strong>“Settings” (设置齿轮 ⚙️)</strong> 或 <strong>“Export” (导出)</strong> 按钮。
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      选择 <strong>“Export to GitHub”</strong>，授权您的 GitHub 账号后，即可自动创建 GitHub 仓库并将全部代码推送到您的仓库中；也可以选择 <strong>“Download ZIP”</strong> 下载完整压缩包到本地电脑。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full mt-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            完成
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
