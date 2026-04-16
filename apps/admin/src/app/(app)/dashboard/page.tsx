export default function DashboardPage() {
  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-heading), Manrope, sans-serif",
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "var(--on-surface)",
        }}
      >
        Dashboard
      </h1>
      <p style={{ color: "var(--on-surface-variant)" }}>
        대시보드 콘텐츠는 후속 슬라이스에서 추가됩니다.
      </p>
    </div>
  );
}
