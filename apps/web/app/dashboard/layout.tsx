import {
  Navbar,
  Sidebar,
  Footer,
} from "@angelisyn/ui";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <Sidebar>
          <h3>Dashboard</h3>

          <p>Projects</p>

          <p>Agents</p>

          <p>API Keys</p>

          <p>Settings</p>
        </Sidebar>

        <main
          style={{
            flex: 1,
            padding: "40px",
          }}
        >
          {children}
        </main>
      </div>

      <Footer />
    </>
  );
}