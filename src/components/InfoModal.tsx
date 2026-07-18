interface InfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function InfoModal({ open, onClose }: InfoModalProps) {
  if (!open) return null;
  return (
    <div id="infoModal" className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content">
        <div className="info-title">🌿 生态学演示器</div>
        <div className="info-sub">基于 Lotka-Volterra 三营养模型</div>
        <div className="info-desc">
          <p><strong>📖 教材依据</strong><br />普通高中教科书 · 生物学选择性必修2<br />《生物与环境》</p>
          <p><strong>🧬 数学模型</strong><br />植物 -&gt; 雪兔 -&gt; 猞猁 三级捕食系统<br />参数可调，展示周期性波动与生态恢复力</p>
          <p><strong>🤖 AI 助手</strong><br />右侧 AI 抽屉可通过自然语言控制模拟：<br />读取种群、设置数量、启动/暂停/重置。</p>
        </div>
        <div className="info-authors">
          <div className="authors-label">✨ 制作者 ✨</div>
          <div className="author-names">
            <span>林炎逸</span>
            <span>刘子木</span>
          </div>
        </div>
        <button className="close-modal" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
