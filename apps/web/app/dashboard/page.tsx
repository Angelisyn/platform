"use client";

import {
  Card,
  Heading,
  Badge,
  Button,
} from "@angelisyn/ui";

export default function Dashboard() {
  return (
    <>
      <Heading>
        Dashboard
      </Heading>

      <Badge>
        Development
      </Badge>

      <Card>
        Angelisyn Platform Dashboard
      </Card>

      <br />

      <Button
        onClick={() => alert("Coming Soon")}
      >
        Create Project
      </Button>
    </>
  );
}