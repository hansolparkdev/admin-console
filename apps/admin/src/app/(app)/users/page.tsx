export default function UsersPage() {
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
        Users
      </h1>
      <p style={{ color: "var(--on-surface-variant)" }}>
        사용자 목록은 후속 슬라이스에서 추가됩니다.
      </p>
    </div>
  );
}
