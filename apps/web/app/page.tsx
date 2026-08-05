import { Button, Container, Heading, Logo } from "@angelisyn/ui";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        color: "white",
      }}
    >
      <Container>
        <div
          style={{
            paddingTop: 80,
          }}
        >
          <Logo />

          <Heading>
            Modern AI Platform
          </Heading>

          <p
            style={{
              fontSize: 20,
              maxWidth: 600,
              marginBottom: 40,
            }}
          >
            Angelisyn is building intelligent software for cybersecurity,
            automation, and AI.
          </p>

          <Button>
            Get Started
          </Button>
        </div>
      </Container>
    </main>
  );
}